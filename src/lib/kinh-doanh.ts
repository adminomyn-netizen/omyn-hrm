/** Số tự tính của khúc Kinh doanh: số dư công nợ đại lý và doanh số so chỉ tiêu. Hàm thuần, không chạm DB. */

export type DaiLyNo = { id: string; ten: string; hanMuc: number | null };
export type DongNo = { daiLyId: string; ngay: string; loai: string; soTien: number; hanThanhToan: string | null };
export type CongNo = { id: string; ten: string; phatSinh: number; daThu: number; soDu: number; hanMuc: number | null; vuotHanMuc: boolean; quaHan: number; denHan7Ngay: number };

/** `loaiThu` là tên dòng trả nợ: "Đã thu" với đại lý (họ trả mình), "Đã trả" với nhà cung cấp (mình trả họ).
 * Số dư = tổng phát sinh − tổng đã thu (có thể âm khi thu dư). Quá hạn: trừ tiền đã thu vào khoản phát sinh CŨ NHẤT trước (FIFO), phần còn nợ của khoản đã quá hạn thanh toán (hạn < hôm nay) cộng lại. Đến hạn 7 ngày: phần còn nợ của khoản có hạn từ hôm nay đến hôm nay + 7 ngày. */
export function tinhCongNo(daiLy: readonly DaiLyNo[], dong: readonly DongNo[], homNay: string, loaiThu = "Đã thu"): CongNo[] {
  return daiLy
    .map((d) => {
      const ds = dong.filter((x) => x.daiLyId === d.id);
      const phatSinh = ds.filter((x) => x.loai === "Phát sinh").reduce((a, x) => a + x.soTien, 0);
      const daThu = ds.filter((x) => x.loai === loaiThu).reduce((a, x) => a + x.soTien, 0);
      const soDu = phatSinh - daThu;
      let thu = daThu;
      let quaHan = 0, denHan7Ngay = 0;
      const han7 = new Date(Date.parse(`${homNay}T00:00:00Z`) + 7 * 864e5).toISOString().slice(0, 10);
      for (const x of ds.filter((y) => y.loai === "Phát sinh").sort((a, b) => a.ngay.localeCompare(b.ngay))) {
        const tru = Math.min(thu, x.soTien);
        thu -= tru;
        if (x.hanThanhToan && x.hanThanhToan < homNay) quaHan += x.soTien - tru;
        else if (x.hanThanhToan && x.hanThanhToan <= han7) denHan7Ngay += x.soTien - tru;
      }
      return { id: d.id, ten: d.ten, phatSinh, daThu, soDu, hanMuc: d.hanMuc, vuotHanMuc: d.hanMuc !== null && soDu > d.hanMuc, quaHan, denHan7Ngay };
    })
    .filter((c) => c.phatSinh || c.daThu)
    .sort((a, b) => b.soDu - a.soDu);
}

export type ChiTieuDong = { kenh: string; chiTieu: number };
export type DoanhSoKenh = { kenh: string; chiTieu: number | null; thucDat: number; phanTram: number | null };

/** Doanh số tháng theo kênh. Sàn = doanh thu theo ngày − tiền hoàn; Sỉ và đại lý = đơn sỉ đã chốt trở đi (không tính báo giá, huỷ);
 * Livestream = phiên đã live. Tổng = Sàn + Sỉ: livestream bán qua sàn đã nằm trong doanh thu sàn nên KHÔNG cộng thêm (tránh tính hai lần). */
export function tinhDoanhSo(
  chiTieu: readonly ChiTieuDong[],
  sanDoanhThu: number,
  sanHoan: number,
  donSi: readonly { trangThai: string; giaTri: number }[],
  live: number,
): DoanhSoKenh[] {
  const san = Math.max(0, sanDoanhThu - sanHoan);
  const si = donSi.filter((d) => ["Đã chốt", "Đang giao", "Đã giao", "Đã thu đủ"].includes(d.trangThai)).reduce((a, d) => a + d.giaTri, 0);
  const thuc: Record<string, number> = { Tổng: san + si, Sàn: san, "Sỉ và đại lý": si, Livestream: live };
  return Object.keys(thuc).map((kenh) => {
    const ct = chiTieu.filter((c) => c.kenh === kenh).reduce((a, c) => a + c.chiTieu, 0);
    const co = chiTieu.some((c) => c.kenh === kenh) && ct > 0;
    return { kenh, chiTieu: co ? ct : null, thucDat: thuc[kenh], phanTram: co ? Math.round((thuc[kenh] / ct) * 100) : null };
  });
}

export type DongTheoNguoi = { nguoiId: string; ten: string; san: number; si: number; soDonSi: number; live: number; coHoiChot: number };

/** Doanh số tháng của từng người: Sàn = doanh thu (trừ hoàn) của các gian hàng người đó vận hành; Sỉ = đơn đã chốt trở đi người đó phụ trách;
 * Live = phiên đã live người đó làm host; cơ hội chốt = số cơ hội ở giai đoạn Đã chốt. KHÔNG cộng các cột lại vì live bán qua sàn đã nằm trong cột Sàn. */
export function tinhDoanhSoTheoNguoi(d: {
  ten: ReadonlyMap<string, string>;
  sanTheoGianHang: readonly { nguoiVanHanhId: string | null; doanhThu: number; hoan: number }[];
  donSi: readonly { nguoiId: string | null; trangThai: string; giaTri: number }[];
  live: readonly { hostId: string | null; doanhThu: number }[];
  coHoi: readonly { nguoiId: string | null; giaiDoan: string }[];
}): DongTheoNguoi[] {
  const ra = new Map<string, DongTheoNguoi>();
  const lay = (id: string | null) => {
    if (!id) return null;
    let r = ra.get(id);
    if (!r) { r = { nguoiId: id, ten: d.ten.get(id) ?? "Nhân viên đã xoá", san: 0, si: 0, soDonSi: 0, live: 0, coHoiChot: 0 }; ra.set(id, r); }
    return r;
  };
  for (const s of d.sanTheoGianHang) { const r = lay(s.nguoiVanHanhId); if (r) r.san += Math.max(0, s.doanhThu - s.hoan); }
  for (const o of d.donSi) { const r = lay(o.nguoiId); if (r && ["Đã chốt", "Đang giao", "Đã giao", "Đã thu đủ"].includes(o.trangThai)) { r.si += o.giaTri; r.soDonSi += 1; } }
  for (const l of d.live) { const r = lay(l.hostId); if (r) r.live += l.doanhThu; }
  for (const c of d.coHoi) { const r = lay(c.nguoiId); if (r && c.giaiDoan === "Đã chốt") r.coHoiChot += 1; }
  return [...ra.values()].filter((r) => r.san || r.si || r.live || r.coHoiChot).sort((a, b) => b.san + b.si - (a.san + a.si));
}

/** Ngày tính một cơ hội đã chốt vào tháng nào: ngày chốt nếu đã điền, chưa điền thì ngày tạo cơ hội (giờ Việt Nam). */
export const ngayChotCuaCoHoi = (ngayChot: string | null, taoLuc: string): string =>
  ngayChot ?? new Date(taoLuc).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

/** Ba nguồn doanh thu sàn của Omyn (chị Lâm chốt). */
export const NGUON_SAN = ["Shopee", "TikTok Shop", "Facebook"] as const;
export type DongSanTay = { ngay: string; nenTang: string; doanhThu: number; hoan: number };
export type DongShopeeKeo = { ngay: string; doanhThu: number; soDon: number };
export type SanTheoNguon = { nguon: string; doanhThu: number; hoan: number; rong: number; tuKeo: boolean };

/** Doanh thu sàn theo 3 nguồn. Shopee: ngày nào đã có số tự kéo về (có đơn hoặc có doanh thu) thì dùng số đó và bỏ số nhập tay của các gian hàng Shopee ngày ấy; ngày chưa có thì dùng số nhập tay.
 * Số Shopee tự kéo về chưa tách được tiền hoàn nên tính hoàn = 0. TikTok Shop và Facebook chỉ có số nhập tay. `ngayShopeeKeo` là các ngày đã dùng số tự kéo, để màn khác loại đúng các dòng nhập tay. */
export function gopDoanhThuSan(tay: readonly DongSanTay[], shopeeKeo: readonly DongShopeeKeo[]): { theoNguon: SanTheoNguon[]; ngayShopeeKeo: Set<string> } {
  const ngayShopeeKeo = new Set(shopeeKeo.filter((d) => d.doanhThu > 0 || d.soDon > 0).map((d) => d.ngay));
  const ra = new Map<string, SanTheoNguon>(NGUON_SAN.map((n) => [n, { nguon: n, doanhThu: 0, hoan: 0, rong: 0, tuKeo: false }]));
  const lay = (n: string) => { let r = ra.get(n); if (!r) { r = { nguon: n, doanhThu: 0, hoan: 0, rong: 0, tuKeo: false }; ra.set(n, r); } return r; };
  for (const d of tay) {
    if (d.nenTang === "Shopee" && ngayShopeeKeo.has(d.ngay)) continue;
    const r = lay(d.nenTang);
    r.doanhThu += d.doanhThu; r.hoan += d.hoan;
  }
  const sp = lay("Shopee");
  for (const d of shopeeKeo) if (ngayShopeeKeo.has(d.ngay)) { sp.doanhThu += d.doanhThu; sp.tuKeo = true; }
  const theoNguon = [...ra.values()].map((r) => ({ ...r, rong: Math.max(0, r.doanhThu - r.hoan) }));
  return { theoNguon, ngayShopeeKeo };
}

export type DonSiDoiChieu = { id: string; ma: string; giaTri: number; tongDong: number; soDong: number; lech: number | null };

/** Thành tiền một dòng hàng = số lượng × đơn giá × (100 − chiết khấu %) / 100, làm tròn đồng. */
export const thanhTienDong = (soLuong: number, donGia: number, chietKhau: number) => Math.round((soLuong * donGia * (100 - chietKhau)) / 100);

/** Đối chiếu từng đơn sỉ: tổng các dòng hàng so với "giá trị đơn" đã ghi. Đơn chưa có dòng nào thì không so (lech = null). */
export function doiChieuDonSi(
  don: readonly { id: string; ma: string; giaTri: number }[],
  dong: readonly { donSiId: string; soLuong: number; donGia: number; chietKhau: number }[],
): DonSiDoiChieu[] {
  return don.map((d) => {
    const ds = dong.filter((x) => x.donSiId === d.id);
    const tongDong = ds.reduce((a, x) => a + thanhTienDong(x.soLuong, x.donGia, x.chietKhau), 0);
    return { id: d.id, ma: d.ma, giaTri: d.giaTri, tongDong, soDong: ds.length, lech: ds.length ? d.giaTri - tongDong : null };
  });
}
