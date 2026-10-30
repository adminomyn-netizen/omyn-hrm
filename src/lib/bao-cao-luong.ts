/** Báo cáo công lương, BHXH và chi phí nhân sự từ các dòng bảng lương đã tính. Hàm thuần, không chạm DB. */

export type DongLuongBc = {
  kyId: string;
  khoi: string | null;
  tongThuNhap: number;
  thucLinh: number;
  bhNld: number;
  bhCty: number;
  thue: number;
  tienOt: number;
  phuCapThuc: number;
  tienAn: number;
};
export type KyBc = { id: string; ten: string; thang: number; nam: number; trangThai: string };

export type TongKy = KyBc & {
  soNguoi: number;
  tongThuNhap: number;
  thucLinh: number;
  bhNld: number;
  bhCty: number;
  thue: number;
  tienOt: number;
  phuCapThuc: number;
  tienAn: number;
  /** Chi phí công ty bỏ ra cho nhân sự trong kỳ = tổng thu nhập + BH công ty đóng. */
  chiPhiCty: number;
  /** So với kỳ liền trước (%), null nếu chưa có kỳ trước hoặc kỳ trước bằng 0. */
  doiChiPhi: number | null;
};

const cong = (ds: DongLuongBc[], f: (d: DongLuongBc) => number) => ds.reduce((a, d) => a + f(d), 0);

/** Các kỳ xếp cũ → mới, mỗi kỳ cộng dồn từ các dòng của nó. */
export function tongTheoKy(ky: KyBc[], dong: DongLuongBc[]): TongKy[] {
  const xep = [...ky].sort((a, b) => a.nam - b.nam || a.thang - b.thang);
  const ra: TongKy[] = [];
  for (const k of xep) {
    const d = dong.filter((x) => x.kyId === k.id);
    const tongThuNhap = cong(d, (x) => x.tongThuNhap), bhCty = cong(d, (x) => x.bhCty);
    const chiPhiCty = tongThuNhap + bhCty;
    const truoc = ra[ra.length - 1]?.chiPhiCty ?? 0;
    ra.push({
      ...k,
      soNguoi: d.length,
      tongThuNhap,
      thucLinh: cong(d, (x) => x.thucLinh),
      bhNld: cong(d, (x) => x.bhNld),
      bhCty,
      thue: cong(d, (x) => x.thue),
      tienOt: cong(d, (x) => x.tienOt),
      phuCapThuc: cong(d, (x) => x.phuCapThuc),
      tienAn: cong(d, (x) => x.tienAn),
      chiPhiCty,
      doiChiPhi: ra.length > 0 && truoc > 0 ? Math.round(((chiPhiCty - truoc) / truoc) * 1000) / 10 : null,
    });
  }
  return ra;
}

/** Quỹ lương (tổng thu nhập) của một kỳ theo khối, lớn → nhỏ. */
export function quyLuongTheoKhoi(dong: DongLuongBc[], kyId: string): { khoi: string; soNguoi: number; tongThuNhap: number; chiPhiCty: number }[] {
  const m = new Map<string, { soNguoi: number; tongThuNhap: number; chiPhiCty: number }>();
  for (const d of dong.filter((x) => x.kyId === kyId)) {
    const k = d.khoi ?? "Chưa gán khối";
    const c = m.get(k) ?? { soNguoi: 0, tongThuNhap: 0, chiPhiCty: 0 };
    c.soNguoi += 1;
    c.tongThuNhap += d.tongThuNhap;
    c.chiPhiCty += d.tongThuNhap + d.bhCty;
    m.set(k, c);
  }
  return [...m.entries()].map(([khoi, v]) => ({ khoi, ...v })).sort((a, b) => b.tongThuNhap - a.tongThuNhap);
}

/** Chi phí đào tạo rơi vào tháng (YYYY-MM): khoá học theo ngày hoàn thành, đợt đào tạo đã hoàn thành theo ngày dự kiến. */
export function chiPhiDaoTaoTheoThang(khoaHoc: { ngay: string | null; chiPhi: number | null }[], keHoach: { ngay: string | null; ngan: number | null; trangThai: string }[]): Map<string, number> {
  const m = new Map<string, number>();
  const them = (ngay: string | null, v: number | null) => {
    if (!ngay || !v) return;
    const t = ngay.slice(0, 7);
    m.set(t, (m.get(t) ?? 0) + v);
  };
  for (const k of khoaHoc) them(k.ngay, k.chiPhi);
  for (const k of keHoach) if (k.trangThai === "Hoàn thành") them(k.ngay, k.ngan);
  return m;
}
