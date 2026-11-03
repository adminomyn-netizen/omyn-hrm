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

export type DiemCauHinh = { dongMoiDiem: number; dongGiamMoiDiem: number; hetHanThang: number; cuaSoHangThang: number };
export type HangKhach = { ten: string; muaToiThieu: number; heSoPt: number };
export type DongDiem = { khachId: string; loai: string; ngay: string; soTien: number | null; soDiem: number; maDon?: string | null };
export type DiemKhach = {
  id: string; ten: string; kenh: string; dongYNhanTin: boolean;
  /** Tổng mua trong cửa sổ hạng (mặc định 12 tháng gần nhất). */
  muaCuaSo: number; hang: string | null; heSoPt: number;
  daTich: number; dung: number; hetHan: number; soDu: number; soDuTien: number;
  /** Điểm còn lại sẽ hết hạn trong 30 ngày tới. */
  sapHet: number;
  /** Điểm dùng vượt số có (sổ ghi sai), 0 là đúng. */
  thieu: number;
};

/** Cộng/trừ tháng trên ngày ISO (YYYY-MM-DD); ngày không có trong tháng đích thì lùi về cuối tháng. */
export function congThang(ngay: string, thang: number): string {
  const [y, m, d] = ngay.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + thang, 1));
  const cuoi = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, cuoi));
  return t.toISOString().slice(0, 10);
}
const congNgay = (ngay: string, n: number) => new Date(Date.parse(ngay) + n * 864e5).toISOString().slice(0, 10);

const hangTheoMua = (hang: readonly HangKhach[], mua: number) => [...hang].sort((a, b) => b.muaToiThieu - a.muaToiThieu).find((h) => mua >= h.muaToiThieu) ?? null;

/** Điểm của một lần mua = số tiền / đồng-mỗi-điểm × hệ số hạng (% , 100 = giữ nguyên), làm tròn xuống; toàn số nguyên nên không lệch số lẻ. */
export const diemMotLanMua = (soTien: number, dongMoiDiem: number, heSoPt: number) => Math.floor((soTien * heSoPt) / (dongMoiDiem * 100));

/**
 * Điểm và hạng khách lẻ theo tham số cấu hình (không cứng trong mã):
 * - Mua: điểm = số tiền / dongMoiDiem × hệ số của hạng khách đang có LÚC MUA (hạng tính từ các lần mua trước đó trong cửa sổ cuaSoHangThang).
 * - Tặng: cộng tay. Mỗi lần cộng thành một lô điểm hết hạn sau hetHanThang tháng.
 * - Dùng: trừ lần lượt từ lô cũ nhất còn hạn tại ngày dùng.
 * - Hạng hiện tại = hạng cao nhất có muaToiThieu ≤ tổng mua trong cửa sổ tính đến hôm nay; chưa có hạng nào thì để trống.
 */
export function tinhDiemKhach(
  khach: readonly { id: string; ten: string; kenh: string; dongYNhanTin: boolean }[],
  dong: readonly DongDiem[],
  hang: readonly HangKhach[],
  ch: DiemCauHinh,
  homNay: string,
): DiemKhach[] {
  const sapHetDen = congNgay(homNay, 30);
  return khach
    .map((k) => {
      const ds = dong.map((d, i) => ({ d, i })).filter((x) => x.d.khachId === k.id).sort((a, b) => (a.d.ngay < b.d.ngay ? -1 : a.d.ngay > b.d.ngay ? 1 : a.i - b.i)).map((x) => x.d);
      const lo: { het: string; con: number }[] = [];
      const mua: { ngay: string; tien: number }[] = [];
      let daTich = 0, dung = 0, thieu = 0;
      for (const d of ds) {
        if (d.loai === "Mua" && d.soTien) {
          const bat = congThang(d.ngay, -ch.cuaSoHangThang);
          const truoc = mua.filter((m) => m.ngay > bat).reduce((a, m) => a + m.tien, 0);
          const diem = diemMotLanMua(d.soTien, ch.dongMoiDiem, hangTheoMua(hang, truoc)?.heSoPt ?? 100);
          mua.push({ ngay: d.ngay, tien: d.soTien });
          if (diem > 0) { lo.push({ het: congThang(d.ngay, ch.hetHanThang), con: diem }); daTich += diem; }
        } else if (d.loai === "Tặng") {
          lo.push({ het: congThang(d.ngay, ch.hetHanThang), con: d.soDiem }); daTich += d.soDiem;
        } else if (d.loai === "Dùng") {
          dung += d.soDiem;
          let can = d.soDiem;
          for (const l of lo) {
            if (can <= 0) break;
            if (l.het <= d.ngay || l.con <= 0) continue;
            const t = Math.min(l.con, can); l.con -= t; can -= t;
          }
          thieu += can;
        }
      }
      const conHan = lo.filter((l) => l.het > homNay);
      const soDu = conHan.reduce((a, l) => a + l.con, 0);
      const hetHan = lo.filter((l) => l.het <= homNay).reduce((a, l) => a + l.con, 0);
      const bat = congThang(homNay, -ch.cuaSoHangThang);
      const muaCuaSo = mua.filter((m) => m.ngay > bat).reduce((a, m) => a + m.tien, 0);
      const h = hangTheoMua(hang, muaCuaSo);
      return {
        id: k.id, ten: k.ten, kenh: k.kenh, dongYNhanTin: k.dongYNhanTin, muaCuaSo, hang: h?.ten ?? null, heSoPt: h?.heSoPt ?? 100,
        daTich, dung, hetHan, soDu, soDuTien: soDu * ch.dongGiamMoiDiem, sapHet: conHan.filter((l) => l.het <= sapHetDen).reduce((a, l) => a + l.con, 0), thieu,
      };
    })
    .sort((a, b) => b.muaCuaSo - a.muaCuaSo);
}

export type GiaBan = { sanPhamId: string; kenh: string; giaVon: number | null; giaBan: number | null; trangThai: string; hieuLucTu: string | null; taoLuc: string };
export type BienTheoKenh = { kenh: string; soDong: number; soDuSo: number; thapNhat: number | null; caoNhat: number | null };
export type DongBien = { sanPhamId: string; kenh: string; giaVon: number; giaBan: number; lai: number; phanTram: number };
export type LaiSi = { doanhThu: number; doanhThuCoVon: number; von: number; laiGop: number | null; phanTram: number | null; soDong: number; soDongCoVon: number; thieuVon: string[] };

/**
 * Lãi gộp theo giá: chỉ các dòng giá ĐÃ DUYỆT có đủ cả giá vốn lẫn giá bán (giá bán > 0); thiếu một trong hai thì không tính, không đoán.
 * Phần trăm = (giá bán − giá vốn) / giá bán, làm tròn 1 chữ số thập phân.
 */
export function bienTheoGia(gia: readonly GiaBan[]): { dong: DongBien[]; theoKenh: BienTheoKenh[] } {
  const da = gia.filter((g) => g.trangThai === "Đã duyệt");
  const dong: DongBien[] = da
    .filter((g) => g.giaVon !== null && g.giaBan !== null && g.giaBan > 0)
    .map((g) => ({ sanPhamId: g.sanPhamId, kenh: g.kenh, giaVon: g.giaVon as number, giaBan: g.giaBan as number, lai: (g.giaBan as number) - (g.giaVon as number), phanTram: Math.round((((g.giaBan as number) - (g.giaVon as number)) / (g.giaBan as number)) * 1000) / 10 }));
  const kenh = [...new Set(da.map((g) => g.kenh))].sort();
  const theoKenh = kenh.map((k) => {
    const ds = dong.filter((d) => d.kenh === k);
    const pt = ds.map((d) => d.phanTram);
    return { kenh: k, soDong: da.filter((g) => g.kenh === k).length, soDuSo: ds.length, thapNhat: pt.length ? Math.min(...pt) : null, caoNhat: pt.length ? Math.max(...pt) : null };
  });
  return { dong, theoKenh };
}

/** Giá vốn một sản phẩm = giá vốn của dòng giá ĐÃ DUYỆT mới nhất (theo ngày hiệu lực, rồi ngày tạo) có ghi giá vốn; chưa có thì thiếu. */
export function giaVonMoiNhat(gia: readonly GiaBan[]): Map<string, number> {
  const m = new Map<string, { von: number; khoa: string }>();
  for (const g of gia) {
    if (g.trangThai !== "Đã duyệt" || g.giaVon === null) continue;
    const khoa = `${g.hieuLucTu ?? ""}|${g.taoLuc}`;
    const cu = m.get(g.sanPhamId);
    if (!cu || khoa > cu.khoa) m.set(g.sanPhamId, { von: g.giaVon, khoa });
  }
  return new Map([...m].map(([k, v]) => [k, v.von]));
}

/**
 * Lãi gộp thực tế kênh sỉ từ các dòng hàng của đơn đã chốt trở đi. Chỉ tính phần có giá vốn; dòng thiếu giá vốn liệt kê ở `thieuVon`
 * và KHÔNG tính vào lãi (không đưa ra lãi nếu không dòng nào có giá vốn).
 */
export function laiGopSi(dong: readonly { sanPhamId: string; soLuong: number; donGia: number; chietKhau: number }[], von: ReadonlyMap<string, number>): LaiSi {
  let doanhThu = 0, doanhThuCoVon = 0, tongVon = 0, soDongCoVon = 0;
  const thieu = new Set<string>();
  for (const d of dong) {
    const tt = thanhTienDong(d.soLuong, d.donGia, d.chietKhau);
    doanhThu += tt;
    const v = von.get(d.sanPhamId);
    if (v === undefined) { thieu.add(d.sanPhamId); continue; }
    doanhThuCoVon += tt; tongVon += v * d.soLuong; soDongCoVon++;
  }
  const lai = soDongCoVon ? doanhThuCoVon - tongVon : null;
  return { doanhThu, doanhThuCoVon, von: tongVon, laiGop: lai, phanTram: lai !== null && doanhThuCoVon > 0 ? Math.round((lai / doanhThuCoVon) * 1000) / 10 : null, soDong: dong.length, soDongCoVon, thieuVon: [...thieu] };
}

export type DonLeTinhDiem = { khachId: string | null; ngay: string; maDon: string; giaTri: number; trangThai: string };

/**
 * Các dòng "Mua" tự sinh từ Sổ đơn lẻ: chỉ đơn ĐÃ GIAO và có gắn khách. Đơn hoàn trả, huỷ hay đang xử lý không cộng điểm (đổi trạng thái là điểm tự đổi theo vì điểm luôn tính lại).
 * Nếu sổ điểm đã có dòng Mua ghi tay cùng mã đơn của cùng khách thì bỏ dòng tự sinh, để không cộng đôi.
 */
export function dongMuaTuDonLe(don: readonly DonLeTinhDiem[], dongTay: readonly DongDiem[]): DongDiem[] {
  const daGhi = new Set(dongTay.filter((d) => d.loai === "Mua" && d.maDon?.trim()).map((d) => `${d.khachId}|${d.maDon!.trim()}`));
  return don
    .filter((d) => d.trangThai === "Đã giao" && d.khachId && !daGhi.has(`${d.khachId}|${d.maDon.trim()}`))
    .map((d) => ({ khachId: d.khachId as string, loai: "Mua", ngay: d.ngay, soTien: d.giaTri, soDiem: 0, maDon: d.maDon }));
}
