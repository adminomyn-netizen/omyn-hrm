/** Quy tắc nhắc việc HCNS & KPI (hàm thuần, cron gọi qua nhac-hr-data.ts). Nhắc đủ để không sót việc nhưng không dồn dập:
 *  người nào chỉ nhận tin về việc của chính họ, quản lý nhận MỘT bản tóm tắt mỗi sáng. */

export type TinHr = { khung: string; tieuDe: string; noiDung: string; url: string };

const MS_NGAY = 864e5;
export const congNgay = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * MS_NGAY).toISOString().slice(0, 10);
/** Số ngày từ `tu` đến `den` (âm = `den` đã qua). */
export const soNgayTu = (tu: string, den: string) => Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / MS_NGAY);

/** Những ngày còn lại (so với hạn) mới nhắc: còn 3 ngày, đúng hạn, trễ 2 ngày, trễ 5 ngày, trễ 10 ngày. Đủ nhắc, không nhắc hằng ngày. */
export const NGAY_NHAC_HAN = new Set([3, 0, -2, -5, -10]);
const nhacVaoNgay = (con: number) => NGAY_NHAC_HAN.has(con);

export type DanhGiaDenHan = { moc: "30 ngày" | "60 ngày"; han: string; con: number };
/** Các mốc đánh giá thử việc (ngày 30 và ngày `soNgay`, mặc định 60) cần nhắc hôm nay: chưa có đánh giá cho mốc, và hôm nay đúng ngày nhắc. */
export function danhGiaCanNhac(ngayBatDau: string, homNay: string, daCo: readonly string[], soNgay = 60): DanhGiaDenHan[] {
  const cac: [DanhGiaDenHan["moc"], number][] = [["30 ngày", 30], ["60 ngày", Math.max(soNgay, 31)]];
  return cac.flatMap(([moc, n]) => {
    const han = congNgay(ngayBatDau, n), con = soNgayTu(homNay, han);
    return !daCo.includes(moc) && nhacVaoNgay(con) ? [{ moc, han, con }] : [];
  });
}

/** Offer đã gửi/đang thương lượng mà sắp hoặc đã quá hạn trả lời (nhắc đúng các ngày trong NGAY_NHAC_HAN). */
export function offerCanNhac(hanTraLoi: string | null, trangThai: string, homNay: string): number | null {
  if (!hanTraLoi || !["Đã gửi", "Thương lượng"].includes(trangThai)) return null;
  const con = soNgayTu(homNay, hanTraLoi);
  return nhacVaoNgay(con) ? con : null;
}

/** Mốc nhắc hợp đồng sắp hết hạn: còn 45, 30, 15, 7 ngày, đúng hạn, trễ 3 ngày (45 ngày đủ để đánh giá tái ký và soạn hợp đồng mới). */
export const NGAY_NHAC_HOP_DONG = new Set([45, 30, 15, 7, 0, -3]);
/** Số ngày còn lại nếu hôm nay là mốc cần nhắc của một hợp đồng đang hiệu lực có thời hạn, ngược lại null. */
export function hopDongCanNhac(denNgay: string | null, trangThai: string, homNay: string): number | null {
  if (!denNgay || trangThai !== "Đang hiệu lực") return null;
  const con = soNgayTu(homNay, denNgay);
  return NGAY_NHAC_HOP_DONG.has(con) ? con : null;
}

/** Còn bao nhiêu phút tới giờ phỏng vấn nếu nằm trong 65 phút tới (cron chạy 5 phút/lần, mỗi buổi chỉ gửi một lần nhờ khoá), ngược lại null. */
export function phutToiPhongVan(thoiGianMs: number, bayGioMs: number): number | null {
  const p = Math.ceil((thoiGianMs - bayGioMs) / 60_000);
  return p > 0 && p <= 65 ? p : null;
}

/** Cụm từ "còn 3 ngày / hôm nay / trễ 2 ngày". */
export const nhanHan = (con: number) => (con > 0 ? `còn ${con} ngày` : con === 0 ? "đến hạn hôm nay" : `trễ ${-con} ngày`);

export type SoLieuHcns = { phongVanHomNay: number; offerCanNhac: number; danhGiaCanNhac: number; deXuatCho: number; hopDongSapHan?: number };
/** Bản tóm tắt sáng cho quản lý HCNS; không có việc nào thì không gửi. */
export function tomTatHcns(s: SoLieuHcns): TinHr | null {
  const phan = [
    s.phongVanHomNay && `${s.phongVanHomNay} buổi phỏng vấn hôm nay`,
    s.offerCanNhac && `${s.offerCanNhac} offer cần chốt`,
    s.danhGiaCanNhac && `${s.danhGiaCanNhac} đánh giá thử việc đến hạn`,
    s.hopDongSapHan && `${s.hopDongSapHan} hợp đồng sắp hết hạn`,
    s.deXuatCho && `${s.deXuatCho} đề xuất chờ duyệt`,
  ].filter(Boolean) as string[];
  if (!phan.length) return null;
  const url = s.hopDongSapHan ? "/hr/hop-dong-lao-dong" : s.danhGiaCanNhac ? "/hr/onboarding" : s.offerCanNhac ? "/hr/offer-tuyen-dung" : s.phongVanHomNay ? "/hr/lich-phong-van" : "/hr/de-xuat-phe-duyet";
  return { khung: "hr_tom_tat", tieuDe: "Việc HCNS hôm nay", noiDung: phan.join(" · "), url };
}

/** Tin xếp hạng gửi mỗi người sau khi kỳ kết thúc. */
export function tinXepHang(o: { kyNhan: string; kyMa: string; hangCaNhan: number; tongNguoi: number; diem: number; phong?: { ten: string; hang: number; tong: number }; top?: string }): TinHr {
  const diem = o.diem.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  const p = o.phong ? ` Phòng ${o.phong.ten} hạng ${o.phong.hang}/${o.phong.tong}.` : "";
  const t = o.top && o.hangCaNhan > 3 ? ` Dẫn đầu: ${o.top}.` : "";
  return { khung: `xh_${o.kyMa}`, tieuDe: `Xếp hạng KPI ${o.kyNhan}`, noiDung: `Bạn hạng ${o.hangCaNhan}/${o.tongNguoi} toàn công ty (${diem}%).${p}${t}`, url: `/kpi?ky=${o.kyMa}` };
}

/** Các kỳ cần báo xếp hạng vào sáng `homNay`: ngày làm việc trước; ngày 1 thêm tháng vừa qua; ngày 1 đầu quý thêm quý vừa qua. */
export function kyCanBaoXepHang(homNay: string, ngayLamViecTruoc: string): string[] {
  const ra = [ngayLamViecTruoc];
  if (homNay.slice(8) === "01") {
    const hqua = congNgay(homNay, -1);
    ra.push(hqua.slice(0, 7));
    if (["01", "04", "07", "10"].includes(homNay.slice(5, 7))) ra.push(`${hqua.slice(0, 4)}-Q${Math.ceil(Number(hqua.slice(5, 7)) / 3)}`);
  }
  return ra;
}
