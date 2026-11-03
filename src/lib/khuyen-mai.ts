export type Voucher = {
  id: string; ma: string; loai: string; giaTri: number; giamToiDa: number | null; donToiThieu: number; kenh: string;
  tuNgay: string; denNgay: string; gioiHanLuot: number | null; gioiHanMoiKhach: number | null; bat: boolean;
};
export type LanDung = { voucherId: string; khachId: string | null; ngay: string; kenh: string; soTienDon: number; soTienGiam: number };

/** Số tiền giảm: Giảm % = đơn × % (làm tròn xuống, không quá mức giảm tối đa); Giảm tiền = đúng số tiền ghi. Không bao giờ quá giá trị đơn. */
export function tinhGiam(v: Pick<Voucher, "loai" | "giaTri" | "giamToiDa">, soTienDon: number): number {
  const g = v.loai === "Giảm %" ? Math.floor((soTienDon * v.giaTri) / 100) : v.giaTri;
  return Math.max(0, Math.min(g, v.giamToiDa ?? Infinity, soTienDon));
}

export type TrangThaiVoucher = "Tắt" | "Chưa tới ngày" | "Đang chạy" | "Hết hạn" | "Hết lượt";
export function trangThaiVoucher(v: Voucher, daDung: number, homNay: string): TrangThaiVoucher {
  if (!v.bat) return "Tắt";
  if (homNay > v.denNgay) return "Hết hạn";
  if (homNay < v.tuNgay) return "Chưa tới ngày";
  if (v.gioiHanLuot !== null && daDung >= v.gioiHanLuot) return "Hết lượt";
  return "Đang chạy";
}

/** Kiểm một lần dùng voucher; trả câu lỗi tiếng Việt hoặc null nếu hợp lệ. `daDung` là các lần dùng đã ghi của chính voucher này (không gồm lần đang kiểm). */
export function kiemTraDung(v: Voucher, l: { ngay: string; kenh: string; khachId: string | null; soTienDon: number }, daDung: readonly LanDung[]): string | null {
  if (!v.bat) return "Voucher này đang tắt.";
  if (l.ngay < v.tuNgay || l.ngay > v.denNgay) return "Ngày dùng nằm ngoài thời hạn của voucher.";
  if (v.kenh !== "Tất cả" && v.kenh !== l.kenh) return `Voucher chỉ áp dụng cho kênh ${v.kenh}.`;
  if (l.soTienDon < v.donToiThieu) return `Đơn chưa đạt mức tối thiểu ${v.donToiThieu.toLocaleString("vi-VN")}đ.`;
  if (v.gioiHanLuot !== null && daDung.length >= v.gioiHanLuot) return "Voucher đã hết lượt dùng.";
  if (v.gioiHanMoiKhach !== null && l.khachId && daDung.filter((d) => d.khachId === l.khachId).length >= v.gioiHanMoiKhach) return "Khách này đã dùng hết số lần cho phép của voucher.";
  return null;
}

export type HieuQuaKenh = { kenh: string; luot: number; doanhThu: number; giam: number; phanTramGiam: number | null };
export type HieuQuaVoucher = { voucherId: string; ma: string; luot: number; doanhThu: number; giam: number; phanTramGiam: number | null; conLuot: number | null };

const pt = (giam: number, doanhThu: number) => (doanhThu > 0 ? Math.round((giam / doanhThu) * 1000) / 10 : null);

/**
 * Hiệu quả khuyến mãi trong kỳ [tu, den]: số lượt dùng, doanh thu của các đơn có voucher, tiền đã giảm và % giảm trên doanh thu đơn.
 * Đây là chi phí khuyến mãi thật đã ghi; app chưa so với doanh thu nếu không có voucher nên không kết luận "có lời hay không".
 */
export function hieuQuaKhuyenMai(vouchers: readonly Voucher[], dung: readonly LanDung[], tu: string, den: string): { theoKenh: HieuQuaKenh[]; theoVoucher: HieuQuaVoucher[] } {
  const trong = dung.filter((d) => d.ngay >= tu && d.ngay <= den);
  const kenh = [...new Set(trong.map((d) => d.kenh))].sort();
  const theoKenh = kenh.map((k) => {
    const ds = trong.filter((d) => d.kenh === k);
    const doanhThu = ds.reduce((a, d) => a + d.soTienDon, 0), giam = ds.reduce((a, d) => a + d.soTienGiam, 0);
    return { kenh: k, luot: ds.length, doanhThu, giam, phanTramGiam: pt(giam, doanhThu) };
  });
  const theoVoucher = vouchers
    .map((v) => {
      const ds = trong.filter((d) => d.voucherId === v.id);
      const doanhThu = ds.reduce((a, d) => a + d.soTienDon, 0), giam = ds.reduce((a, d) => a + d.soTienGiam, 0);
      const tong = dung.filter((d) => d.voucherId === v.id).length;
      return { voucherId: v.id, ma: v.ma, luot: ds.length, doanhThu, giam, phanTramGiam: pt(giam, doanhThu), conLuot: v.gioiHanLuot === null ? null : Math.max(0, v.gioiHanLuot - tong) };
    })
    .filter((v) => v.luot > 0)
    .sort((a, b) => b.giam - a.giam);
  return { theoKenh, theoVoucher };
}
