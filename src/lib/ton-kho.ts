/** Tồn kho từng sản phẩm tính từ phiếu nhập xuất: nhập + điều chỉnh tăng − xuất − điều chỉnh giảm. Hàm thuần, không chạm DB. */
export type DongKho = { sanPhamId: string; loai: string; soLuong: number; ngay?: string };
export type SanPhamKho = { id: string; ma: string; ten: string; tonToiThieu?: number | null };
export type TonKho = { id: string; ma: string; ten: string; nhap: number; xuat: number; dieuChinh: number; ton: number; sapHet: boolean };

export function tinhTonKho(sp: readonly SanPhamKho[], dong: readonly DongKho[]): TonKho[] {
  return sp
    .map((s) => {
      const ds = dong.filter((d) => d.sanPhamId === s.id);
      const tong = (loai: string) => ds.filter((d) => d.loai === loai).reduce((a, d) => a + d.soLuong, 0);
      const nhap = tong("Nhập"), xuat = tong("Xuất"), dieuChinh = tong("Điều chỉnh tăng") - tong("Điều chỉnh giảm");
      const ton = nhap + dieuChinh - xuat;
      return { id: s.id, ma: s.ma, ten: s.ten, nhap, xuat, dieuChinh, ton, sapHet: s.tonToiThieu != null && ton <= s.tonToiThieu };
    })
    .filter((t) => t.nhap || t.xuat || t.dieuChinh)
    .sort((a, b) => a.ma.localeCompare(b.ma, "vi"));
}

export type DongKiemKe = { sanPhamId: string; ngay: string; thucTe: number };
export type ChenhKiemKe = { sanPhamId: string; ngay: string; thucTe: number; soSach: number; chenh: number };

/** Tồn trên sổ của một sản phẩm tính đến hết ngày `ngay` (chỉ tính dòng có ngày; dòng thiếu ngày bỏ qua). */
export function tonDenNgay(dong: readonly DongKho[], sanPhamId: string, ngay: string): number {
  const ds = dong.filter((d) => d.sanPhamId === sanPhamId && d.ngay !== undefined && d.ngay <= ngay);
  const tong = (loai: string) => ds.filter((d) => d.loai === loai).reduce((a, d) => a + d.soLuong, 0);
  return tong("Nhập") + tong("Điều chỉnh tăng") - tong("Xuất") - tong("Điều chỉnh giảm");
}

/** Lần kiểm kê GẦN NHẤT của mỗi sản phẩm: số đếm thực tế so với tồn trên sổ tính đến ngày kiểm kê (chênh = thực tế − sổ). Lệch nhiều nhất xếp trước. */
export function chenhLechKiemKe(dong: readonly DongKho[], kiemKe: readonly DongKiemKe[]): ChenhKiemKe[] {
  const moiNhat = new Map<string, DongKiemKe>();
  for (const k of kiemKe) {
    const cu = moiNhat.get(k.sanPhamId);
    if (!cu || k.ngay > cu.ngay) moiNhat.set(k.sanPhamId, k);
  }
  return [...moiNhat.values()]
    .map((k) => {
      const soSach = tonDenNgay(dong, k.sanPhamId, k.ngay);
      return { sanPhamId: k.sanPhamId, ngay: k.ngay, thucTe: k.thucTe, soSach, chenh: k.thucTe - soSach };
    })
    .sort((a, b) => Math.abs(b.chenh) - Math.abs(a.chenh));
}
