/** Tồn kho từng sản phẩm tính từ phiếu nhập xuất: nhập + điều chỉnh tăng − xuất − điều chỉnh giảm. Hàm thuần, không chạm DB. */
export type DongKho = { sanPhamId: string; loai: string; soLuong: number };
export type SanPhamKho = { id: string; ma: string; ten: string };
export type TonKho = { id: string; ma: string; ten: string; nhap: number; xuat: number; dieuChinh: number; ton: number };

export function tinhTonKho(sp: readonly SanPhamKho[], dong: readonly DongKho[]): TonKho[] {
  return sp
    .map((s) => {
      const ds = dong.filter((d) => d.sanPhamId === s.id);
      const tong = (loai: string) => ds.filter((d) => d.loai === loai).reduce((a, d) => a + d.soLuong, 0);
      const nhap = tong("Nhập"), xuat = tong("Xuất"), dieuChinh = tong("Điều chỉnh tăng") - tong("Điều chỉnh giảm");
      return { id: s.id, ma: s.ma, ten: s.ten, nhap, xuat, dieuChinh, ton: nhap + dieuChinh - xuat };
    })
    .filter((t) => t.nhap || t.xuat || t.dieuChinh)
    .sort((a, b) => a.ma.localeCompare(b.ma, "vi"));
}
