/** Đối soát COD với bảng của đơn vị vận chuyển (ĐVVC), khớp theo MÃ VẬN ĐƠN. Hàm thuần, không chạm DB. */
import { docNgay, tachBang, type LoiDong } from "@/lib/nhap-don-le";
import { docTienCoDau } from "@/lib/doi-soat-don";

export type DongVanChuyen = { dong: number; maVanDon: string; codThuHo: number | null; codDaChuyen: number; phi: number | null; ngayChuyen: string | null };

const bo = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
type Cot = "maVanDon" | "codDaChuyen" | "codThuHo" | "phi" | "ngayChuyen";
export const COT_VAN_CHUYEN: Record<Cot, { nhan: string; ten: string[] }> = {
  maVanDon: { nhan: "Mã vận đơn", ten: ["ma van don", "van don", "ma van chuyen", "so van don", "tracking number", "tracking no", "awb", "ma don van chuyen", "ma tracking"] },
  codDaChuyen: { nhan: "COD đã chuyển", ten: ["cod da chuyen", "tien cod da chuyen", "da chuyen", "tien da chuyen", "so tien da chuyen", "tien thuc nhan", "thuc nhan", "so tien doi soat", "tien tra shop", "tien chuyen khoan"] },
  codThuHo: { nhan: "COD thu hộ", ten: ["cod", "cod thu ho", "tien thu ho", "so tien thu ho", "tien cod", "thu ho"] },
  phi: { nhan: "Phí vận chuyển", ten: ["phi van chuyen", "cuoc phi", "phi", "cuoc van chuyen", "shipping fee", "phi giao hang", "tong phi"] },
  ngayChuyen: { nhan: "Ngày chuyển tiền", ten: ["ngay chuyen tien", "ngay doi soat", "ngay thanh toan", "ngay chuyen khoan", "ngay tra tien", "payment date"] },
};

/** Chuẩn mã vận đơn để khớp: bỏ khoảng trắng, chữ hoa. */
export const chuanMaVanDon = (s: string) => s.replace(/\s+/g, "").toUpperCase();

/**
 * Đọc bảng của ĐVVC. Dòng đầu là tiêu đề. Bắt buộc: Mã vận đơn, COD đã chuyển. Tuỳ chọn: COD thu hộ (để so với sổ), Phí vận chuyển, Ngày chuyển tiền.
 * Số lấy giá trị tuyệt đối. `truPhi` = file ghi số đã TRỪ phí: COD đã chuyển = số trong file + phí (cần có cột Phí). Mã vận đơn trùng trong file thì cộng gộp.
 */
export function docBangVanChuyen(text: string, truPhi: boolean): { dong: DongVanChuyen[]; loi: LoiDong[]; canhBao: LoiDong[]; thieuCot: string[] } {
  const bang = tachBang(text);
  if (bang.length === 0) return { dong: [], loi: [], canhBao: [], thieuCot: ["file trống"] };
  const tieuDe = bang[0].map(bo);
  const vt = {} as Record<Cot, number>;
  for (const k of Object.keys(COT_VAN_CHUYEN) as Cot[]) vt[k] = tieuDe.findIndex((h) => COT_VAN_CHUYEN[k].ten.includes(h));
  const thieuCot = (["maVanDon", "codDaChuyen"] as Cot[]).filter((k) => vt[k] < 0).map((k) => COT_VAN_CHUYEN[k].nhan);
  if (truPhi && vt.phi < 0 && !thieuCot.includes("Phí vận chuyển")) thieuCot.push("Phí vận chuyển (cần khi file ghi số đã trừ phí)");
  if (thieuCot.length) return { dong: [], loi: [], canhBao: [], thieuCot };
  const loi: LoiDong[] = [], canhBao: LoiDong[] = [], theoMa = new Map<string, DongVanChuyen>(), dem = new Map<string, number>();
  bang.slice(1).forEach((r, i) => {
    const dong = i + 2;
    const ma = chuanMaVanDon(r[vt.maVanDon] ?? "");
    if (!ma) return void loi.push({ dong, loi: "Thiếu mã vận đơn." });
    const chuyen = docTienCoDau(r[vt.codDaChuyen] ?? "");
    if (chuyen === null) return void loi.push({ dong, loi: `COD đã chuyển “${r[vt.codDaChuyen] ?? ""}” không đọc được.` });
    const so = (k: Cot) => {
      if (vt[k] < 0) return null;
      const o = (r[vt[k]] ?? "").trim();
      if (!o) return null;
      const v = docTienCoDau(o);
      if (v === null) { canhBao.push({ dong, loi: `${COT_VAN_CHUYEN[k].nhan} “${o}” không đọc được, bỏ qua.` }); return null; }
      return Math.abs(v);
    };
    const phi = so("phi");
    if (truPhi && phi === null) return void loi.push({ dong, loi: "Thiếu phí vận chuyển để cộng lại." });
    const ngayRaw = vt.ngayChuyen >= 0 ? (r[vt.ngayChuyen] ?? "").trim() : "";
    const ngay = ngayRaw ? docNgay(ngayRaw) : null;
    if (ngayRaw && !ngay) canhBao.push({ dong, loi: `Ngày chuyển tiền “${ngayRaw}” không đọc được, để trống.` });
    const d: DongVanChuyen = { dong, maVanDon: ma, codThuHo: so("codThuHo"), codDaChuyen: Math.abs(chuyen) + (truPhi ? (phi ?? 0) : 0), phi, ngayChuyen: ngay };
    dem.set(ma, (dem.get(ma) ?? 0) + 1);
    const co = theoMa.get(ma);
    if (!co) { theoMa.set(ma, d); return; }
    co.codDaChuyen += d.codDaChuyen;
    co.codThuHo = co.codThuHo === null ? d.codThuHo : d.codThuHo === null ? co.codThuHo : co.codThuHo + d.codThuHo;
    co.phi = co.phi === null ? d.phi : d.phi === null ? co.phi : co.phi + d.phi;
    co.ngayChuyen = co.ngayChuyen ?? d.ngayChuyen;
  });
  for (const [ma, n] of dem) if (n > 1) canhBao.push({ dong: theoMa.get(ma)!.dong, loi: `Mã vận đơn ${ma} có ${n} dòng, đã cộng gộp.` });
  return { dong: [...theoMa.values()], loi, canhBao, thieuCot: [] };
}

export type DonSo = { id: string; maVanDon: string; thuHo: number; trangThai: string };

/** So một dòng của ĐVVC với đơn trong sổ: chênh COD (file thu hộ khác sổ) và đơn chưa "Đã giao" mà ĐVVC đã chuyển tiền. */
export function soVoiSo(d: DongVanChuyen, don: DonSo): { chenhCod: boolean; chuaDaGiao: boolean; chuyenNhieuHon: boolean } {
  return {
    chenhCod: d.codThuHo !== null && d.codThuHo !== don.thuHo,
    chuaDaGiao: don.trangThai !== "Đã giao",
    chuyenNhieuHon: don.thuHo > 0 && d.codDaChuyen > don.thuHo,
  };
}
