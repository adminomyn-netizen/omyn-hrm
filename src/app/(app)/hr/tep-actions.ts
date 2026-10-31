"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layLinkTep, layTepCuaDong, manCuaTep, quyenTep, taoLinkTaiLen, xacNhanTep, xoaTep, type TepInfo } from "@/lib/tep-dinh-kem-data";

type Loi = { loi: string };
const KHONG_QUYEN: Loi = { loi: "Bạn không có quyền với tệp đính kèm." };

/** Người đang đăng nhập và quyền tệp của họ ở một màn (xem = xem/tải; nhập = thêm cả tệp). Chưa đổi mật khẩu tạm hoặc chưa duyệt = không có gì. */
async function nguoi(man: string | null) {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau || !man) return null;
  const q = await quyenTep(nd, man);
  return q.muc ? { nd, q } : null;
}

export async function dsTepAction(man: string, dongId: string): Promise<Loi | { ds: TepInfo[]; nhap: boolean; xoa: boolean }> {
  const n = await nguoi(man);
  if (!n) return KHONG_QUYEN;
  return { ds: await layTepCuaDong(man, dongId), nhap: n.q.muc === "nhap", xoa: n.q.xoa };
}

export async function taoLinkTaiLenAction(v: { man: string; dongId: string; loai: string; tenTep: string; kichThuoc: number }) {
  const n = await nguoi(v.man);
  if (!n || n.q.muc !== "nhap") return KHONG_QUYEN;
  return taoLinkTaiLen(v);
}

export async function xacNhanTepAction(v: { man: string; dongId: string; loai: string; tenTep: string; kieu: string | null; duongDan: string }) {
  const n = await nguoi(v.man);
  if (!n || n.q.muc !== "nhap") return KHONG_QUYEN;
  const kq = await xacNhanTep({ ten: n.nd.hoTen, nguon: "Trong app" }, n.nd.id, v);
  if ("ok" in kq) revalidatePath(`/hr/${v.man}`);
  return kq;
}

/** Link xem/tải có chữ ký, hết hạn sau 2 phút. Quyền kiểm theo màn của chính tệp (lấy từ DB, không tin trình duyệt). */
export async function linkTepAction(tepId: string, tai: boolean) {
  const n = await nguoi(await manCuaTep(tepId));
  if (!n) return KHONG_QUYEN;
  return layLinkTep(tepId, tai);
}

/** Gỡ tệp: Quản trị/Kỹ thuật, hoặc người được nhập quyền của màn đó từ Trưởng bộ phận trở lên (cùng luật xoá dòng). */
export async function xoaTepAction(tepId: string) {
  const man = await manCuaTep(tepId);
  const n = await nguoi(man);
  if (!n || !n.q.xoa) return KHONG_QUYEN;
  const kq = await xoaTep(tepId, n.nd.id, n.nd.hoTen);
  if ("ok" in kq) revalidatePath(`/hr/${man}`);
  return kq;
}
