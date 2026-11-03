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

export type DonCod = { id: string; ma: string; donVi: string; trangThai: string; ngay: string; ngayGiao: string | null; thuHo: number; daNhan: number; phi: number | null };
export type DoiSoatCod = { donVi: string; soDon: number; thuHo: number; daNhan: number; conTreo: number; soDonQuaHan: number; phi: number; soDonThieuPhi: number };
export type DonCodQuaHan = { id: string; ma: string; donVi: string; ngayGiao: string; soNgay: number; conTreo: number };

const soNgayGiua = (tu: string, den: string) => Math.round((Date.parse(den) - Date.parse(tu)) / 864e5);

/**
 * Đối soát COD theo đơn vị vận chuyển. Chỉ đơn "Đã giao" có tiền thu hộ mới là khoản phải thu; còn treo = thu hộ − đã nhận (không âm).
 * Quá hạn = đã giao quá `soNgayHan` ngày mà còn treo (tính từ ngày giao, không có thì từ ngày đơn). Đơn hoàn/trả không phải thu.
 * `nhanDu` liệt kê đơn nhận nhiều hơn thu hộ (cần xem lại). Đơn vị trống ghi "Chưa ghi đơn vị vận chuyển".
 */
export function doiSoatCod(don: readonly DonCod[], homNay: string, soNgayHan: number): { theoDonVi: DoiSoatCod[]; quaHan: DonCodQuaHan[]; nhanDu: DonCod[] } {
  const ten = (d: DonCod) => d.donVi.trim() || "Chưa ghi đơn vị vận chuyển";
  const phaiThu = don.filter((d) => d.trangThai === "Đã giao" && d.thuHo > 0);
  const quaHan: DonCodQuaHan[] = [];
  const m = new Map<string, DoiSoatCod>();
  for (const d of don.filter((x) => x.trangThai === "Đã giao" || x.trangThai === "Hoàn hoặc trả")) {
    const k = ten(d).toLowerCase();
    const r = m.get(k) ?? { donVi: ten(d), soDon: 0, thuHo: 0, daNhan: 0, conTreo: 0, soDonQuaHan: 0, phi: 0, soDonThieuPhi: 0 };
    r.soDon++;
    if (d.phi === null) r.soDonThieuPhi++; else r.phi += d.phi;
    if (d.trangThai === "Đã giao" && d.thuHo > 0) {
      r.thuHo += d.thuHo; r.daNhan += Math.min(d.daNhan, d.thuHo);
      const treo = Math.max(0, d.thuHo - d.daNhan);
      r.conTreo += treo;
      const goc = d.ngayGiao ?? d.ngay, soNgay = soNgayGiua(goc, homNay);
      if (treo > 0 && soNgay > soNgayHan) { r.soDonQuaHan++; quaHan.push({ id: d.id, ma: d.ma, donVi: ten(d), ngayGiao: goc, soNgay, conTreo: treo }); }
    }
    m.set(k, r);
  }
  return {
    theoDonVi: [...m.values()].sort((a, b) => b.conTreo - a.conTreo),
    quaHan: quaHan.sort((a, b) => b.soNgay - a.soNgay),
    nhanDu: phaiThu.filter((d) => d.daNhan > d.thuHo),
  };
}
