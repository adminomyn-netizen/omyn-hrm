import "server-only";
import { docTatCa } from "@/lib/hr-db";
import { dongMuaTuDonLe, type DongDiem } from "@/lib/kinh-doanh";

/** Mọi dòng điểm của khách lẻ: sổ điểm ghi tay + dòng Mua tự sinh từ Sổ đơn lẻ (đơn đã giao có gắn khách, không trùng mã đơn đã ghi tay). Màn điểm và hàng đợi tin nhắn dùng chung. */
export async function layDongDiemGop(): Promise<DongDiem[]> {
  const [dd, don] = await Promise.all([
    docTatCa<{ khach_le_id: string; loai: string; ngay: string; so_tien: number | null; so_diem: number; ma_don: string | null }>("kd_diem_khach", "id, khach_le_id, loai, ngay, so_tien, so_diem, ma_don"),
    docTatCa<{ khach_le_id: string | null; ngay: string; ma_don: string; gia_tri: number; trang_thai: string }>("kd_don_le", "id, khach_le_id, ngay, ma_don, gia_tri, trang_thai"),
  ]);
  const tay: DongDiem[] = dd.map((d) => ({ khachId: d.khach_le_id, loai: d.loai, ngay: d.ngay, soTien: d.so_tien, soDiem: d.so_diem, maDon: d.ma_don }));
  return [...tay, ...dongMuaTuDonLe(don.map((d) => ({ khachId: d.khach_le_id, ngay: d.ngay, maDon: d.ma_don, giaTri: d.gia_tri, trangThai: d.trang_thai })), tay)];
}
