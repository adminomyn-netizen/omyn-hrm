/** Lãi lỗ theo kênh trong một tháng: doanh thu, hoàn trả, lãi gộp, phí sàn (từ đối soát từng đơn) và lãi sau phí sàn. Hàm thuần, không chạm DB. */
import { laiGopSi } from "@/lib/kinh-doanh";

export type DonKenh = { id: string; kenh: string; trangThai: string; giaTri: number };
export type DongHangKenh = { donId: string; sanPhamId: string; soLuong: number; donGia: number; chietKhau: number };

export type DongLaiLo = {
  kenh: string;
  soDonGiao: number; doanhThu: number;
  soDonHoan: number; tienHoan: number;
  /** Số đơn của kênh trong tháng (mọi trạng thái) để tính tỷ lệ hoàn. */
  tongDon: number; tyLeHoan: number | null;
  /** Lãi gộp của các đơn ĐÃ GIAO có dòng hàng và giá vốn; null nếu không dòng nào có giá vốn. */
  laiGop: number | null; soDonCoHang: number;
  /** Các đơn đã giao đã có dòng đối soát: số đơn, phí sàn của chúng, lãi gộp của chúng và lãi sau phí sàn (null nếu thiếu giá vốn). */
  soDonDoiSoat: number; phiSan: number; laiGopDoiSoat: number | null; laiSauPhi: number | null;
};

/**
 * `phiTheoDon`: phí sàn tổng của từng đơn (id đơn lẻ → số tiền) lấy từ đối soát. Chỉ đơn Đã giao mới tính doanh thu.
 * Lãi sau phí sàn chỉ tính trên các đơn Đã giao ĐÃ đối soát (để không trừ phí thiếu), và chỉ khi có giá vốn.
 */
export function laiLoTheoKenh(don: readonly DonKenh[], dong: readonly DongHangKenh[], von: ReadonlyMap<string, number>, phiTheoDon: ReadonlyMap<string, number>): DongLaiLo[] {
  const kenhs = [...new Set(don.map((d) => d.kenh))].sort();
  return kenhs.map((kenh) => {
    const cua = don.filter((d) => d.kenh === kenh);
    const giao = cua.filter((d) => d.trangThai === "Đã giao");
    const hoan = cua.filter((d) => d.trangThai === "Hoàn trả");
    const idGiao = new Set(giao.map((d) => d.id));
    const idDoiSoat = new Set(giao.filter((d) => phiTheoDon.has(d.id)).map((d) => d.id));
    const hangCua = (ids: Set<string>) => dong.filter((d) => ids.has(d.donId)).map((d) => ({ sanPhamId: d.sanPhamId, soLuong: d.soLuong, donGia: d.donGia, chietKhau: d.chietKhau }));
    const tatCa = laiGopSi(hangCua(idGiao), von);
    const ds = laiGopSi(hangCua(idDoiSoat), von);
    const phi = giao.filter((d) => idDoiSoat.has(d.id)).reduce((a, d) => a + (phiTheoDon.get(d.id) ?? 0), 0);
    return {
      kenh, soDonGiao: giao.length, doanhThu: giao.reduce((a, d) => a + d.giaTri, 0),
      soDonHoan: hoan.length, tienHoan: hoan.reduce((a, d) => a + d.giaTri, 0),
      tongDon: cua.length, tyLeHoan: cua.length ? Math.round((hoan.length / cua.length) * 1000) / 10 : null,
      laiGop: tatCa.laiGop, soDonCoHang: new Set(dong.filter((d) => idGiao.has(d.donId)).map((d) => d.donId)).size,
      soDonDoiSoat: idDoiSoat.size, phiSan: phi, laiGopDoiSoat: ds.laiGop, laiSauPhi: ds.laiGop === null ? null : ds.laiGop - phi,
    };
  });
}
