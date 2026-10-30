"use server";

import { revalidatePath } from "next/cache";
import { dbHr } from "@/lib/hr-db";
import { layNguoiDungHienTai } from "@/lib/auth";
import { chiTieuApCho, ngayNhapHopLe } from "@/lib/kpi";
import { homNayHcm, nguoiNhapDuoc, taiNen } from "@/lib/kpi-data";

export type KetQuaKpi = { loi?: string; ok?: boolean; daLuu?: number };

/** Lưu kết quả một ngày. Ô tên `v|<mã người>|<mã chỉ tiêu>`; ô trống = xoá kết quả đã nhập. Quyền kiểm ở máy chủ: người ngoài danh sách nhập được, hoặc chỉ tiêu không áp cho khối của họ, bị từ chối cả lô. */
export async function luuKetQuaKpi(fd: FormData): Promise<KetQuaKpi> {
  const ngay = String(fd.get("ngay") ?? "");
  if (!ngayNhapHopLe(ngay, homNayHcm()))
    return {
      loi: "Ngày không hợp lệ: chỉ nhập cho hôm nay hoặc 31 ngày gần nhất.",
    };
  const nen = await taiNen();
  const duoc = new Map(nguoiNhapDuoc(nen).map((n) => [n.id, n]));
  const ct = new Map(nen.chiTieu.map((c) => [c.id, c]));
  const luu: {
    nhan_vien_id: string;
    chi_tieu_id: string;
    ngay: string;
    thuc_te: number;
    nguoi_nhap: string | null;
  }[] = [];
  const xoa: { nv: string; ct: string }[] = [];
  const nd = await layNguoiDungHienTai();
  for (const [k, raw] of fd.entries()) {
    if (!k.startsWith("v|")) continue;
    const [, nvId, ctId] = k.split("|");
    const nv = duoc.get(nvId),
      c = ct.get(ctId);
    if (!nv || !c || !chiTieuApCho([c], nv.khoiId).length)
      return {
        loi: "Có ô không thuộc quyền nhập của bạn. Tải lại trang rồi nhập lại.",
      };
    const s = String(raw).trim().replace(",", ".");
    if (s === "") {
      xoa.push({ nv: nvId, ct: ctId });
      continue;
    }
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0 || n > 1e9)
      return {
        loi: `Giá trị “${String(raw).slice(0, 20)}” của chỉ tiêu “${c.ten}” chưa hợp lệ (số không âm).`,
      };
    luu.push({
      nhan_vien_id: nvId,
      chi_tieu_id: ctId,
      ngay,
      thuc_te: n,
      nguoi_nhap: nd?.id ?? null,
    });
  }
  const db = dbHr();
  if (luu.length) {
    const { error } = await db.from("kpi_ket_qua").upsert(
      luu.map((x) => ({ ...x, cap_nhat_luc: new Date().toISOString() })),
      { onConflict: "nhan_vien_id,chi_tieu_id,ngay" },
    );
    if (error) return { loi: "Chưa lưu được. Thử lại sau ít phút." };
  }
  for (const x of xoa)
    await db
      .from("kpi_ket_qua")
      .delete()
      .eq("nhan_vien_id", x.nv)
      .eq("chi_tieu_id", x.ct)
      .eq("ngay", ngay);
  revalidatePath("/kpi");
  revalidatePath("/kpi/nhap");
  return { ok: true, daLuu: luu.length };
}
