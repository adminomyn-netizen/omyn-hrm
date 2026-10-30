import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { MANG_THEO_NHOM, quyenSauChucVu, tuTruongBoPhan, type Quyen, type QuyenMang } from "@/lib/quyen-mang";
import { menuChinh } from "@/lib/nav";

type NguoiCoVaiTro = { id: string; vaiTro: string };
const laQuanLy = (nd: NguoiCoVaiTro) => nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat";

/** Quyền các mảng của một nhân viên: theo khối của họ trong hồ sơ nhân sự (người đã nghỉ hoặc chưa có hồ sơ = không có gì). */
async function quyenTheoKhoi(userId: string): Promise<{ quyen: QuyenMang; chucDanh: string | null }> {
  const db = dbHr();
  const { data: nv } = await db.from("nhan_vien").select("khoi_id, chuc_danh, trang_thai").eq("user_id", userId).maybeSingle();
  if (!nv || nv.trang_thai === "Đã nghỉ" || !nv.khoi_id) return { quyen: {}, chucDanh: nv?.chuc_danh ?? null };
  const { data } = await db.from("quyen_man_nghiep_vu").select("mang, quyen").eq("khoi_id", nv.khoi_id);
  const quyen: QuyenMang = {};
  for (const r of (data ?? []) as { mang: string; quyen: Quyen }[]) {
    const q = quyenSauChucVu(r.quyen, nv.chuc_danh);
    if (q) quyen[r.mang] = q;
  }
  return { quyen, chucDanh: nv.chuc_danh ?? null };
}
const quyenCuaNguoi = cache(quyenTheoKhoi);

/** Quyền của một người trên một sổ nghiệp vụ: `muc` = null nghĩa là không được vào; `xoa` = được xoá bản ghi. Quản trị/Kỹ thuật luôn đủ. */
export async function quyenTrenSo(nd: NguoiCoVaiTro, nhomSo: string): Promise<{ muc: Quyen | null; xoa: boolean }> {
  if (laQuanLy(nd)) return { muc: "nhap", xoa: true };
  const mang = MANG_THEO_NHOM[nhomSo];
  if (!mang) return { muc: null, xoa: false };
  const { quyen, chucDanh } = await quyenCuaNguoi(nd.id);
  const muc = quyen[mang] ?? null;
  return { muc, xoa: muc === "nhap" && tuTruongBoPhan(chucDanh) };
}

/** Trang xem sổ nghiệp vụ: không có quyền thì đưa về trang Chấm công như các trang quản lý khác. */
export async function yeuCauQuyenSo(nhomSo: string) {
  const nd = await layNguoiDungDaDuyet();
  const q = await quyenTrenSo(nd, nhomSo);
  if (!q.muc) redirect("/cham-cong");
  return { nd, ...q, chiXem: q.muc === "xem" };
}

/** Đường dẫn menu nghiệp vụ mà nhân viên này được mở (Quản trị/Kỹ thuật đã thấy hết nên không cần). */
export async function duongDanDuocMo(nd: NguoiCoVaiTro): Promise<string[] | undefined> {
  if (laQuanLy(nd)) return undefined;
  const { quyen } = await quyenCuaNguoi(nd.id);
  return menuChinh.filter((m) => quyen[MANG_THEO_NHOM[m.nhom]]).map((m) => m.duong_dan);
}
