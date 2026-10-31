/** Thống kê đóng gói và giao hàng của kho. Hàm thuần, không chạm DB. */
export type DonDongGoi = { nguoiId: string | null; kenh: string; trangThai: string };
export type ThongKeDongGoi = {
  tong: number;
  theoTrangThai: Record<string, number>;
  /** Hoàn hoặc trả ÷ (đã giao + hoàn hoặc trả), làm tròn 0,1%; chưa có đơn nào kết thúc thì để trống. */
  tiLeHoan: number | null;
  theoNguoi: { nguoiId: string | null; ten: string; so: number }[];
  theoKenh: { kenh: string; so: number }[];
};

export function thongKeDongGoi(don: readonly DonDongGoi[], ten: ReadonlyMap<string, string>): ThongKeDongGoi {
  const theoTrangThai: Record<string, number> = {};
  const nguoi = new Map<string | null, number>();
  const kenh = new Map<string, number>();
  for (const d of don) {
    theoTrangThai[d.trangThai] = (theoTrangThai[d.trangThai] ?? 0) + 1;
    if (d.trangThai !== "Chờ đóng") nguoi.set(d.nguoiId, (nguoi.get(d.nguoiId) ?? 0) + 1);
    kenh.set(d.kenh, (kenh.get(d.kenh) ?? 0) + 1);
  }
  const giao = theoTrangThai["Đã giao"] ?? 0, hoan = theoTrangThai["Hoàn hoặc trả"] ?? 0;
  return {
    tong: don.length,
    theoTrangThai,
    tiLeHoan: giao + hoan > 0 ? Math.round((hoan / (giao + hoan)) * 1000) / 10 : null,
    theoNguoi: [...nguoi].map(([nguoiId, so]) => ({ nguoiId, ten: nguoiId ? (ten.get(nguoiId) ?? "Nhân viên đã xoá") : "Chưa ghi người đóng", so })).sort((a, b) => b.so - a.so),
    theoKenh: [...kenh].map(([k, so]) => ({ kenh: k, so })).sort((a, b) => b.so - a.so),
  };
}
