/** Số tự tính của khúc Kinh doanh: số dư công nợ đại lý và doanh số so chỉ tiêu. Hàm thuần, không chạm DB. */

export type DaiLyNo = { id: string; ten: string; hanMuc: number | null };
export type DongNo = { daiLyId: string; ngay: string; loai: string; soTien: number; hanThanhToan: string | null };
export type CongNo = { id: string; ten: string; phatSinh: number; daThu: number; soDu: number; hanMuc: number | null; vuotHanMuc: boolean; quaHan: number };

/** Số dư = tổng phát sinh − tổng đã thu (có thể âm khi thu dư). Quá hạn: trừ tiền đã thu vào khoản phát sinh CŨ NHẤT trước (FIFO), phần còn nợ của khoản đã quá hạn thanh toán (hạn < hôm nay) cộng lại. */
export function tinhCongNo(daiLy: readonly DaiLyNo[], dong: readonly DongNo[], homNay: string): CongNo[] {
  return daiLy
    .map((d) => {
      const ds = dong.filter((x) => x.daiLyId === d.id);
      const phatSinh = ds.filter((x) => x.loai === "Phát sinh").reduce((a, x) => a + x.soTien, 0);
      const daThu = ds.filter((x) => x.loai === "Đã thu").reduce((a, x) => a + x.soTien, 0);
      const soDu = phatSinh - daThu;
      let thu = daThu;
      let quaHan = 0;
      for (const x of ds.filter((y) => y.loai === "Phát sinh").sort((a, b) => a.ngay.localeCompare(b.ngay))) {
        const tru = Math.min(thu, x.soTien);
        thu -= tru;
        if (x.hanThanhToan && x.hanThanhToan < homNay) quaHan += x.soTien - tru;
      }
      return { id: d.id, ten: d.ten, phatSinh, daThu, soDu, hanMuc: d.hanMuc, vuotHanMuc: d.hanMuc !== null && soDu > d.hanMuc, quaHan };
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
