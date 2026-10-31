/** Hiệu quả marketing trong tháng: tổng chi quảng cáo và KOL/KOC so với doanh thu. Hàm thuần, không chạm DB. */
export type DauVaoMkt = { chiMeta: number; chiTikTok: number; chiShopee: number; chiKol: number; nganSachDuyet: number; doanhThu: number };
export type HieuQuaMkt = DauVaoMkt & { tongChi: number; tiLeChiPhi: number | null; vuotNganSach: boolean };

/** Tỷ lệ chi phí = tổng chi ÷ doanh thu (làm tròn 0,1%); doanh thu bằng 0 thì để trống. Vượt ngân sách chỉ báo khi tháng đó có ngân sách đã duyệt. */
export function tinhHieuQuaMkt(d: DauVaoMkt): HieuQuaMkt {
  const tongChi = d.chiMeta + d.chiTikTok + d.chiShopee + d.chiKol;
  return { ...d, tongChi, tiLeChiPhi: d.doanhThu > 0 ? Math.round((tongChi / d.doanhThu) * 1000) / 10 : null, vuotNganSach: d.nganSachDuyet > 0 && tongChi > d.nganSachDuyet };
}
