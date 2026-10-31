"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layLinkTep, layTepCuaDong, quyenTep, taoLinkTaiLen, xacNhanTep, xoaTep, type TepInfo } from "@/lib/tep-dinh-kem-data";

type Loi = { loi: string };
const KHONG_QUYEN: Loi = { loi: "Bạn không có quyền với tệp đính kèm." };

/** Người đang đăng nhập và quyền tệp của họ (xem = xem/tải; nhập = thêm cả tệp). Chưa đổi mật khẩu tạm hoặc chưa duyệt = không có gì. */
async function nguoi() {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return null;
  const q = await quyenTep(nd);
  return q ? { nd, q } : null;
}

export async function dsTepAction(man: string, dongId: string): Promise<Loi | { ds: TepInfo[]; nhap: boolean }> {
  const n = await nguoi();
  if (!n) return KHONG_QUYEN;
  return { ds: await layTepCuaDong(man, dongId), nhap: n.q === "nhap" };
}

export async function taoLinkTaiLenAction(v: { man: string; dongId: string; loai: string; tenTep: string; kichThuoc: number }) {
  const n = await nguoi();
  if (!n || n.q !== "nhap") return KHONG_QUYEN;
  return taoLinkTaiLen(v);
}

export async function xacNhanTepAction(v: { man: string; dongId: string; loai: string; tenTep: string; kieu: string | null; duongDan: string }) {
  const n = await nguoi();
  if (!n || n.q !== "nhap") return KHONG_QUYEN;
  const kq = await xacNhanTep({ ten: n.nd.hoTen, nguon: "Trong app" }, n.nd.id, v);
  if ("ok" in kq) revalidatePath(`/hr/${v.man}`);
  return kq;
}

/** Link xem/tải có chữ ký, hết hạn sau 2 phút. */
export async function linkTepAction(tepId: string, tai: boolean) {
  const n = await nguoi();
  if (!n) return KHONG_QUYEN;
  return layLinkTep(tepId, tai);
}

/** Gỡ tệp: Quản trị/Kỹ thuật, hoặc người được nhập quyền Pháp lý từ Trưởng bộ phận trở lên (cùng luật xoá dòng). */
export async function xoaTepAction(tepId: string, man: string) {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return KHONG_QUYEN;
  const { quyenTrenSo } = await import("@/lib/quyen-nghiep-vu");
  const q = await quyenTrenSo(nd, "Pháp lý & Hồ sơ");
  if (!q.xoa) return KHONG_QUYEN;
  const kq = await xoaTep(tepId, nd.id, nd.hoTen);
  if ("ok" in kq) revalidatePath(`/hr/${man}`);
  return kq;
}
