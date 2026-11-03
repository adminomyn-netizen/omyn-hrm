import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ngayHomNayHCM } from "@/lib/data";
import { phanBoLoFefo, tinhTonLo, type DongKhoLo } from "@/lib/ton-kho";

export type KetQuaDongBoKho = { loi?: string; xuat: number; go: number };

/**
 * Đồng bộ phiếu kho với MỘT đơn lẻ (gọi sau khi lưu đơn hoặc dòng hàng): đơn "Đã giao" thì mỗi dòng hàng có phiếu Xuất (tự chia lô theo hạn gần trước);
 * đơn ở trạng thái khác (đang xử lý, hoàn trả, huỷ) thì không có phiếu nào, nghĩa là hàng không bị trừ / đã về kho. Gọi nhiều lần vẫn ra cùng kết quả.
 */
export async function dongBoKhoDonLe(db: SupabaseClient, donId: string): Promise<KetQuaDongBoKho> {
  const { data: don } = await db.from("kd_don_le").select("id, ma_don, kenh, ngay, trang_thai").eq("id", donId).maybeSingle();
  const { data: dong } = await db.from("kd_don_le_dong").select("id, san_pham_id, so_luong").eq("don_le_id", donId);
  const ids = (dong ?? []).map((d) => d.id as string);
  if (!ids.length) return { xuat: 0, go: 0 };
  const { data: cu } = await db.from("kho_nhap_xuat").select("id").in("don_le_dong_id", ids);
  const go = cu?.length ?? 0;
  if (go) {
    const { error } = await db.from("kho_nhap_xuat").delete().in("don_le_dong_id", ids);
    if (error) return { loi: "Chưa cập nhật được phiếu kho.", xuat: 0, go: 0 };
  }
  if (!don || don.trang_thai !== "Đã giao") return { xuat: 0, go };

  const sp = [...new Set((dong ?? []).map((d) => d.san_pham_id as string))];
  const [{ data: lo }, { data: phieu }] = await Promise.all([
    db.from("kho_lo_hang").select("id, san_pham_id, so_lo, han_dung, so_luong_nhap, trang_thai").in("san_pham_id", sp),
    db.from("kho_nhap_xuat").select("san_pham_id, loai, so_luong, ngay, so_lo").in("san_pham_id", sp),
  ]);
  const kho: DongKhoLo[] = (phieu ?? []).map((p) => ({ sanPhamId: p.san_pham_id, loai: p.loai, soLuong: p.so_luong, ngay: p.ngay, soLo: p.so_lo }));
  const homNay = ngayHomNayHCM();
  const moi: Record<string, unknown>[] = [];
  for (const d of dong ?? []) {
    const lots = tinhTonLo(
      (lo ?? []).filter((l) => l.san_pham_id === d.san_pham_id).map((l) => ({ id: l.id, sanPhamId: l.san_pham_id, soLo: l.so_lo, hanDung: l.han_dung, soLuongNhap: l.so_luong_nhap, trangThai: l.trang_thai })),
      kho, homNay,
    );
    for (const p of phanBoLoFefo(d.so_luong, lots)) {
      moi.push({ ngay: don.ngay, loai: "Xuất", san_pham_id: d.san_pham_id, so_luong: p.soLuong, so_lo: p.soLo, doi_tuong: `Đơn lẻ ${don.kenh}`, chung_tu: don.ma_don, don_le_dong_id: d.id, ghi_chu: `Tự xuất theo đơn lẻ ${don.ma_don}` });
      kho.push({ sanPhamId: d.san_pham_id, loai: "Xuất", soLuong: p.soLuong, ngay: don.ngay, soLo: p.soLo });
    }
  }
  if (!moi.length) return { xuat: 0, go };
  const { error } = await db.from("kho_nhap_xuat").insert(moi);
  if (error) return { loi: "Đã lưu đơn nhưng chưa trừ kho được. Mở đơn và lưu lại một lần nữa.", xuat: 0, go };
  return { xuat: moi.length, go };
}
