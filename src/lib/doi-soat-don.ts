/** Đối soát tiền sàn theo từng đơn: đọc bảng quyết toán của sàn (dán từ Excel/CSV) và so với Sổ đơn lẻ. Hàm thuần, không chạm DB. */
import { docNgay, docTien, tachBang, type LoiDong } from "@/lib/nhap-don-le";

export type KetQuaDoiSoat = "Khớp" | "Lệch giá trị" | "Lệch trạng thái" | "Thiếu trong Omyn";
export const KET_QUA_DOI_SOAT: readonly KetQuaDoiSoat[] = ["Khớp", "Lệch giá trị", "Lệch trạng thái", "Thiếu trong Omyn"];

/** Nguyên nhân lệch (chọn khi xử lý). */
export const NGUYEN_NHAN_LECH: readonly string[] = [
  "Phí sàn tính sai % so với hợp đồng",
  "Phí vận chuyển cao hơn báo giá",
  "Khuyến mãi hoặc voucher không áp đúng",
  "Đơn hoàn từng phần chưa khớp",
  "Giá trị đơn sàn khác Omyn",
  "Đơn sàn chưa nhập vào Omyn",
  "Lệch do làm tròn",
  "Chưa rõ nguyên nhân",
];

export type DongDoiSoat = {
  dong: number; maDon: string; ngayNhanTien: string | null; khachTra: number | null;
  phiHoaHong: number; phiGiaoDich: number; phiVanChuyen: number; phiDichVu: number; phiAffiliate: number; thue: number; phiKhac: number;
  hoanTien: number; thucNhan: number;
};

const bo = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

type Cot = "maDon" | "ngayNhanTien" | "khachTra" | "phiHoaHong" | "phiGiaoDich" | "phiVanChuyen" | "phiDichVu" | "phiAffiliate" | "thue" | "phiKhac" | "hoanTien" | "thucNhan";
/** Tên cột chấp nhận (đã bỏ dấu, chữ thường). Sàn đổi tên cột thì đổi tên cột trong Excel cho khớp một tên dưới đây rồi dán lại. */
export const COT_DOI_SOAT: Record<Cot, { nhan: string; ten: string[] }> = {
  maDon: { nhan: "Mã đơn", ten: ["ma don", "ma don hang", "order id", "order no", "order sn", "so don", "ma don hang tmdt"] },
  thucNhan: { nhan: "Thực nhận", ten: ["thuc nhan", "so tien thuc nhan", "tien thuc nhan", "tong tien quyet toan", "tong so tien quyet toan", "settlement amount", "total settlement amount", "tien ve tai khoan", "payout", "escrow amount"] },
  ngayNhanTien: { nhan: "Ngày nhận tiền", ten: ["ngay nhan tien", "ngay thanh toan", "ngay quyet toan", "ngay chuyen tien", "payment date", "settlement date", "order settled time"] },
  khachTra: { nhan: "Tiền khách trả", ten: ["tien khach tra", "khach thanh toan", "tong thanh toan", "tong tien khach tra", "customer payment", "buyer paid", "gia tri don hang"] },
  phiHoaHong: { nhan: "Phí hoa hồng", ten: ["phi hoa hong", "phi co dinh", "commission fee", "platform commission", "phi hoa hong cua tiktok shop"] },
  phiGiaoDich: { nhan: "Phí giao dịch", ten: ["phi giao dich", "phi thanh toan", "phi xu ly giao dich", "transaction fee"] },
  phiVanChuyen: { nhan: "Phí vận chuyển", ten: ["phi van chuyen", "phi van chuyen thuc te", "shipping fee", "actual shipping fee"] },
  phiDichVu: { nhan: "Phí dịch vụ", ten: ["phi dich vu", "service fee"] },
  phiAffiliate: { nhan: "Hoa hồng liên kết", ten: ["hoa hong lien ket", "phi affiliate", "affiliate commission", "phi hoa hong tiep thi lien ket"] },
  thue: { nhan: "Thuế khấu trừ", ten: ["thue", "thue khau tru", "tax", "thue gtgt", "thue tncn"] },
  phiKhac: { nhan: "Phí khác", ten: ["phi khac", "other fee", "other fees"] },
  hoanTien: { nhan: "Tiền hoàn", ten: ["tien hoan", "hoan tien", "refund", "refund amount", "so tien hoan"] },
};

/** Tiền có thể âm: "-12.500", "−12,500", "(12.500)" → số âm. Không đọc được thì null. */
export function docTienCoDau(s: string): number | null {
  let t = s.trim();
  if (!t) return null;
  let am = false;
  if (/^\(.*\)$/.test(t)) { am = true; t = t.slice(1, -1); }
  if (/^[-−–]/.test(t)) { am = !am; t = t.slice(1); }
  const so = docTien(t.trim());
  return so === null ? null : (am ? -so : so);
}

/**
 * Đọc bảng quyết toán. Dòng đầu là tiêu đề. Bắt buộc: Mã đơn, Thực nhận. Còn lại tuỳ chọn.
 * Các khoản phí lưu số DƯƠNG (file ghi âm hay dương đều lấy giá trị tuyệt đối); Thực nhận giữ dấu.
 * Một mã đơn xuất hiện nhiều dòng (vd điều chỉnh) thì CỘNG GỘP các khoản, ngày nhận tiền lấy dòng đầu, và báo ở cảnh báo.
 */
export function docBangDoiSoat(text: string): { dong: DongDoiSoat[]; loi: LoiDong[]; canhBao: LoiDong[]; thieuCot: string[] } {
  const bang = tachBang(text);
  if (bang.length === 0) return { dong: [], loi: [], canhBao: [], thieuCot: ["file trống"] };
  const tieuDe = bang[0].map(bo);
  const vt = {} as Record<Cot, number>;
  for (const k of Object.keys(COT_DOI_SOAT) as Cot[]) vt[k] = tieuDe.findIndex((h) => COT_DOI_SOAT[k].ten.includes(h));
  const thieuCot = (["maDon", "thucNhan"] as Cot[]).filter((k) => vt[k] < 0).map((k) => COT_DOI_SOAT[k].nhan);
  if (thieuCot.length) return { dong: [], loi: [], canhBao: [], thieuCot };
  const loi: LoiDong[] = [], canhBao: LoiDong[] = [], theoMa = new Map<string, DongDoiSoat>();
  const dem = new Map<string, number>();
  bang.slice(1).forEach((r, i) => {
    const dong = i + 2;
    const maDon = (r[vt.maDon] ?? "").trim();
    if (!maDon) return void loi.push({ dong, loi: "Thiếu mã đơn." });
    const tn = docTienCoDau(r[vt.thucNhan] ?? "");
    if (tn === null) return void loi.push({ dong, loi: `Thực nhận “${r[vt.thucNhan] ?? ""}” không đọc được.` });
    const tien = (k: Cot) => {
      if (vt[k] < 0) return 0;
      const o = (r[vt[k]] ?? "").trim();
      if (!o) return 0;
      const v = docTienCoDau(o);
      if (v === null) { canhBao.push({ dong, loi: `${COT_DOI_SOAT[k].nhan} “${o}” không đọc được, tính 0.` }); return 0; }
      return Math.abs(v);
    };
    const khachRaw = vt.khachTra >= 0 ? (r[vt.khachTra] ?? "").trim() : "";
    const khach = khachRaw ? docTienCoDau(khachRaw) : null;
    const ngayRaw = vt.ngayNhanTien >= 0 ? (r[vt.ngayNhanTien] ?? "").trim() : "";
    const ngay = ngayRaw ? docNgay(ngayRaw) : null;
    if (ngayRaw && !ngay) canhBao.push({ dong, loi: `Ngày nhận tiền “${ngayRaw}” không đọc được, để trống.` });
    const d: DongDoiSoat = {
      dong, maDon, ngayNhanTien: ngay, khachTra: khach === null ? null : Math.abs(khach),
      phiHoaHong: tien("phiHoaHong"), phiGiaoDich: tien("phiGiaoDich"), phiVanChuyen: tien("phiVanChuyen"), phiDichVu: tien("phiDichVu"),
      phiAffiliate: tien("phiAffiliate"), thue: tien("thue"), phiKhac: tien("phiKhac"), hoanTien: tien("hoanTien"), thucNhan: tn,
    };
    const co = theoMa.get(maDon);
    dem.set(maDon, (dem.get(maDon) ?? 0) + 1);
    if (!co) { theoMa.set(maDon, d); return; }
    co.khachTra = co.khachTra === null ? d.khachTra : d.khachTra === null ? co.khachTra : co.khachTra + d.khachTra;
    co.phiHoaHong += d.phiHoaHong; co.phiGiaoDich += d.phiGiaoDich; co.phiVanChuyen += d.phiVanChuyen; co.phiDichVu += d.phiDichVu;
    co.phiAffiliate += d.phiAffiliate; co.thue += d.thue; co.phiKhac += d.phiKhac; co.hoanTien += d.hoanTien; co.thucNhan += d.thucNhan;
    co.ngayNhanTien = co.ngayNhanTien ?? d.ngayNhanTien;
  });
  for (const [ma, n] of dem) if (n > 1) canhBao.push({ dong: theoMa.get(ma)!.dong, loi: `Mã đơn ${ma} có ${n} dòng, đã cộng gộp thành một.` });
  return { dong: [...theoMa.values()], loi, canhBao, thieuCot: [] };
}

export const tongPhi = (d: Pick<DongDoiSoat, "phiHoaHong" | "phiGiaoDich" | "phiVanChuyen" | "phiDichVu" | "phiAffiliate" | "thue" | "phiKhac">) =>
  d.phiHoaHong + d.phiGiaoDich + d.phiVanChuyen + d.phiDichVu + d.phiAffiliate + d.thue + d.phiKhac;

export type DonOmyn = { giaTri: number; trangThai: string };

/**
 * So một dòng quyết toán với đơn trong Sổ đơn lẻ (cùng kênh, cùng mã đơn).
 * Thứ tự ưu tiên: Thiếu trong Omyn > Lệch trạng thái (Omyn ghi Huỷ/Hoàn trả mà sàn vẫn trả tiền thực nhận > 0) > Lệch giá trị (tiền khách trả khác) > Khớp.
 * File không có cột Tiền khách trả thì không so giá trị.
 */
export function phanLoaiDoiSoat(d: Pick<DongDoiSoat, "khachTra" | "thucNhan">, don: DonOmyn | undefined): { ketQua: KetQuaDoiSoat; giaTriDon: number | null; canhBao: string | null } {
  if (!don) return { ketQua: "Thiếu trong Omyn", giaTriDon: null, canhBao: "Sàn có đơn này nhưng Sổ đơn lẻ chưa có." };
  if ((don.trangThai === "Huỷ" || don.trangThai === "Hoàn trả") && d.thucNhan > 0)
    return { ketQua: "Lệch trạng thái", giaTriDon: don.giaTri, canhBao: `Omyn ghi ${don.trangThai} nhưng sàn đã trả ${d.thucNhan.toLocaleString("vi-VN")} đ.` };
  if (d.khachTra !== null && d.khachTra !== don.giaTri)
    return { ketQua: "Lệch giá trị", giaTriDon: don.giaTri, canhBao: `Sàn ${d.khachTra.toLocaleString("vi-VN")} đ, Omyn ${don.giaTri.toLocaleString("vi-VN")} đ.` };
  return { ketQua: "Khớp", giaTriDon: don.giaTri, canhBao: null };
}

export type TomTat = { soDon: number; theoKetQua: Record<KetQuaDoiSoat, number>; khachTra: number; tongPhi: number; thucNhan: number; hoanTien: number };

export function tomTatDoiSoat(ds: readonly (Pick<DongDoiSoat, "khachTra" | "thucNhan" | "hoanTien" | "phiHoaHong" | "phiGiaoDich" | "phiVanChuyen" | "phiDichVu" | "phiAffiliate" | "thue" | "phiKhac"> & { ketQua: KetQuaDoiSoat })[]): TomTat {
  const t: TomTat = { soDon: ds.length, theoKetQua: { "Khớp": 0, "Lệch giá trị": 0, "Lệch trạng thái": 0, "Thiếu trong Omyn": 0 }, khachTra: 0, tongPhi: 0, thucNhan: 0, hoanTien: 0 };
  for (const d of ds) {
    t.theoKetQua[d.ketQua]++;
    t.khachTra += d.khachTra ?? 0; t.tongPhi += tongPhi(d); t.thucNhan += d.thucNhan; t.hoanTien += d.hoanTien;
  }
  return t;
}
