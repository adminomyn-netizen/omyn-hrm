"use server";

import { revalidatePath } from "next/cache";
import { dbHr } from "@/lib/hr-db";
import { layNguoiDungHienTai } from "@/lib/auth";
import { coCheCuaNguoi, thangNhapHopLe } from "@/lib/kpi";
import { dongBoKpiVaoLuong } from "@/lib/luong/kpi-vao-luong";
import { docCoChe, homNayHcm, nguoiChamDuoc, taiNen } from "@/lib/kpi-data";

export type KetQuaChamThang = { loi?: string; ok?: boolean; daLuu?: number; daVaoLuong?: number };

/** Lưu điểm chấm KPI một tháng. Ô tên `v|<mã người>|<mã nhóm>` = % hoàn thành 0–100; ô trống = xoá điểm đã chấm.
 * Quyền kiểm ở máy chủ cho cả lô: chỉ Ban lãnh đạo (Quản trị/Kỹ thuật, HCNS) hoặc trưởng phòng với cấp dưới trực tiếp; nhóm phải thuộc cơ chế của đúng chức danh người đó.
 * Tỷ trọng được ghi kèm tại lúc chấm. Mọi thay đổi để lại nhật ký (trigger). */
export async function luuChamKpiThang(fd: FormData): Promise<KetQuaChamThang> {
  const thang = String(fd.get("thang") ?? "");
  if (!thangNhapHopLe(thang, homNayHcm())) return { loi: "Tháng không hợp lệ: chỉ chấm cho tháng này hoặc 2 tháng trước." };
  const nen = await taiNen();
  const duoc = new Map(nguoiChamDuoc(nen).map((n) => [n.id, n]));
  const coChe = await docCoChe();
  const nhomCua = new Map<string, { coCheId: string; tyTrong: number; ten: string }>();
  for (const c of coChe) for (const n of c.nhom) nhomCua.set(n.id, { coCheId: c.id, tyTrong: n.tyTrong, ten: n.ten });
  const nd = await layNguoiDungHienTai();
  const luu: { nhan_vien_id: string; nhom_id: string; thang: string; ty_le: number; ty_trong: number; nguoi_cham: string | null; cap_nhat_luc: string }[] = [];
  const xoa: { nv: string; nhom: string }[] = [];
  for (const [k, raw] of fd.entries()) {
    if (!k.startsWith("v|")) continue;
    const [, nvId, nhomId] = k.split("|");
    const nv = duoc.get(nvId), nh = nhomCua.get(nhomId);
    if (!nv || !nh || coCheCuaNguoi(coChe, nv)?.id !== nh.coCheId) return { loi: "Có ô không thuộc quyền chấm của bạn. Tải lại trang rồi chấm lại." };
    const s = String(raw).trim().replace(",", ".");
    if (s === "") { xoa.push({ nv: nvId, nhom: nhomId }); continue; }
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0 || n > 100) return { loi: `“${String(raw).slice(0, 20)}” ở nhóm “${nh.ten}” chưa hợp lệ: nhập % hoàn thành từ 0 đến 100.` };
    luu.push({ nhan_vien_id: nvId, nhom_id: nhomId, thang: `${thang}-01`, ty_le: Math.round(n * 100) / 100, ty_trong: nh.tyTrong, nguoi_cham: nd?.id ?? null, cap_nhat_luc: new Date().toISOString() });
  }
  const db = dbHr();
  if (luu.length) {
    const { error } = await db.from("kpi_cham_thang").upsert(luu, { onConflict: "nhan_vien_id,nhom_id,thang" });
    if (error) return { loi: "Chưa lưu được. Thử lại sau ít phút." };
  }
  for (const x of xoa) await db.from("kpi_cham_thang").delete().eq("nhan_vien_id", x.nv).eq("nhom_id", x.nhom).eq("thang", `${thang}-01`);
  // Chấm đủ các nhóm thì mức hưởng tự đi vào dòng lương của đúng tháng (kỳ chưa duyệt).
  const dongLuong = await dongBoKpiVaoLuong(thang).catch(() => ({ capNhat: 0 }));
  revalidatePath("/kpi/thang");
  if (dongLuong.capNhat > 0) revalidatePath("/luong");
  return { ok: true, daLuu: luu.length, daVaoLuong: dongLuong.capNhat };
}
