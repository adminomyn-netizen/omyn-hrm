/** Phần dùng chung (không chạm DB) của chức năng đính kèm file: loại giấy, giới hạn, kiểm tên tệp, đường dẫn trong kho. */
export const MAN_TEP = ["ho-so-san-pham", "so-cong-bo", "so-hop-dong", "duyet-bao-bi", "nha-cung-cap", "san-pham"] as const;
export type ManTep = (typeof MAN_TEP)[number];
export const LOAI_GIAY_TEP = ["Giấy uỷ quyền (LOA)", "CFS", "Phiếu công bố", "PIF", "Hợp đồng", "Chứng từ thanh toán", "Giấy đăng ký doanh nghiệp (ĐKDN)", "Artwork", "Khác"] as const;
export const GIOI_HAN_TEP = 25 * 1024 * 1024;
export const KHO_TEP = "tai-lieu-omyn";
/** Đuôi tệp cho phép: PDF, ảnh, Word, Excel, nén. */
export const DUOI_TEP = ["pdf", "png", "jpg", "jpeg", "webp", "gif", "doc", "docx", "xls", "xlsx", "zip"];

export const duoiTep = (ten: string) => (ten.includes(".") ? ten.slice(ten.lastIndexOf(".") + 1).toLowerCase() : "");
export const laManTep = (v: string): v is ManTep => (MAN_TEP as readonly string[]).includes(v);
export const laLoaiGiay = (v: string) => (LOAI_GIAY_TEP as readonly string[]).includes(v);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const laUuid = (v: string) => UUID.test(v);

/** Kiểm thông tin một tệp sắp tải lên; trả chữ lỗi tiếng Việt hoặc null nếu hợp lệ. */
export function kiemTep(ten: string, kichThuoc: number): string | null {
  if (!ten.trim()) return "Thiếu tên tệp.";
  if (!DUOI_TEP.includes(duoiTep(ten))) return `Chỉ nhận tệp ${DUOI_TEP.join(", ")}.`;
  if (!Number.isFinite(kichThuoc) || kichThuoc <= 0) return "Tệp rỗng hoặc không rõ dung lượng.";
  if (kichThuoc > GIOI_HAN_TEP) return "Tệp quá lớn, tối đa 25 MB.";
  return null;
}

/** Đường dẫn trong kho: chỉ dùng mã ngẫu nhiên và đuôi tệp (tên gốc, kể cả tiếng Hàn, giữ ở bảng) để khỏi vướng ký tự lạ. */
export const duongDanTrongKho = (man: string, dongId: string, ma: string, ten: string) => `${man}/${dongId}/${ma}.${duoiTep(ten)}`;
export const duongDanHopLe = (man: string, dongId: string, duongDan: string) =>
  new RegExp(`^${man}/${dongId}/[0-9a-f-]{36}\\.(${DUOI_TEP.join("|")})$`).test(duongDan);

export const dungLuong = (b: number) => (b >= 1048576 ? `${(b / 1048576).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
