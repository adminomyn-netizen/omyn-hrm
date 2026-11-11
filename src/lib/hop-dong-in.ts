/** Dựng chữ cho bản in hợp đồng lao động từ dòng sổ hợp đồng (hàm thuần, có test). Không tự điền số hay điều khoản nào ngoài dữ liệu đã nhập. */
export type LoaiHd = "Thử việc" | "Xác định thời hạn" | "Không xác định thời hạn" | "Cộng tác viên" | "Khác" | string | null | undefined;

export const tieuDeHopDong = (loai: LoaiHd): string =>
  loai === "Thử việc" ? "HỢP ĐỒNG THỬ VIỆC" : loai === "Cộng tác viên" ? "HỢP ĐỒNG CỘNG TÁC VIÊN" : "HỢP ĐỒNG LAO ĐỘNG";

const ngay = (s: string | null | undefined) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "");

/** Câu thời hạn hợp đồng theo loại và ngày. Thiếu ngày thì để chỗ trống (chuỗi rỗng ở phần chưa biết). */
export function thoiHanHopDong(loai: LoaiHd, tu: string | null | undefined, den: string | null | undefined, cho = "……………"): string {
  if (loai === "Không xác định thời hạn") return `Hợp đồng không xác định thời hạn, có hiệu lực từ ngày ${ngay(tu) || cho}.`;
  if (den) return `Từ ngày ${ngay(tu) || cho} đến ngày ${ngay(den)}.`;
  return `Từ ngày ${ngay(tu) || cho} đến ngày ${cho}.`;
}

export const gioiTinhChu = (g: string | null | undefined) => (g ? g : "");
