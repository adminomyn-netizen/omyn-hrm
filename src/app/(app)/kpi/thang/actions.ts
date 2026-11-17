"use server";

import { revalidatePath } from "next/cache";
import { dbHr } from "@/lib/hr-db";
import { layNguoiDungHienTai } from "@/lib/auth";
import { chiTieuThangApCho, thangNhapHopLe } from "@/lib/kpi";
import { docChiTieuThang, homNayHcm, nguoiNhapDuoc, taiNen } from "@/lib/kpi-data";

export type KetQuaKpiThang = { loi?: string; ok?: boolean; daLuu?: number };

/** Lưu kết quả KPI một tháng. Ô tên `v|<mã người>|<mã chỉ tiêu>`; ô trống = xoá kết quả đã nhập.
 * Quyền kiểm ở máy chủ: người ngoài danh sách nhập được, hoặc chỉ tiêu không áp cho chức danh/khối của họ, bị từ chối cả lô. Mọi thay đổi để lại nhật ký (trigger). */
export async function luuKetQuaKpiThang(fd: FormData): Promise<KetQuaKpiThang> {
  const thang = String(fd.get("thang") ?? "");
  if (!thangNhapHopLe(thang, homNayHcm())) return { loi: "Tháng không hợp lệ: chỉ nhập cho tháng này hoặc 2 tháng trước." };
  const nen = await taiNen();
  const duoc = new Map(nguoiNhapDuoc(nen).map((n) => [n.id, n]));
  const ct = new Map((await docChiTieuThang()).map((c) => [c.id, c]));
  const nd = await layNguoiDungHienTai();
  const luu: { nhan_vien_id: string; chi_tieu_id: string; thang: string; thuc_te: number; nguoi_nhap: string | null; cap_nhat_luc: string }[] = [];
  const xoa: { nv: string; ct: string }[] = [];
  for (const [k, raw] of fd.entries()) {
    if (!k.startsWith("v|")) continue;
    const [, nvId, ctId] = k.split("|");
    const nv = duoc.get(nvId), c = ct.get(ctId);
    if (!nv || !c || chiTieuThangApCho([c], nv.chucDanh, nv.khoiId).length === 0) return { loi: "Có ô không thuộc quyền nhập của bạn. Tải lại trang rồi nhập lại." };
    const s = String(raw).trim().replace(",", ".");
    if (s === "") { xoa.push({ nv: nvId, ct: ctId }); continue; }
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0 || n > 1e12) return { loi: `Giá trị “${String(raw).slice(0, 20)}” của chỉ tiêu “${c.ten}” chưa hợp lệ (số không âm).` };
    luu.push({ nhan_vien_id: nvId, chi_tieu_id: ctId, thang: `${thang}-01`, thuc_te: n, nguoi_nhap: nd?.id ?? null, cap_nhat_luc: new Date().toISOString() });
  }
  const db = dbHr();
  if (luu.length) {
    const { error } = await db.from("kpi_ket_qua_thang").upsert(luu, { onConflict: "nhan_vien_id,chi_tieu_id,thang" });
    if (error) return { loi: "Chưa lưu được. Thử lại sau ít phút." };
  }
  for (const x of xoa) await db.from("kpi_ket_qua_thang").delete().eq("nhan_vien_id", x.nv).eq("chi_tieu_id", x.ct).eq("thang", `${thang}-01`);
  revalidatePath("/kpi/thang");
  return { ok: true, daLuu: luu.length };
}
