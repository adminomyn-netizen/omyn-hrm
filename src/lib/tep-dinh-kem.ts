/** Phần dùng chung (không chạm DB) của chức năng đính kèm file: loại giấy, giới hạn, kiểm tên tệp, đường dẫn trong kho. */
/** 6 màn pháp lý/sản phẩm gắn tệp ngay từ đầu (loại giấy riêng) + hồ sơ ứng viên. Mọi sổ khác có ô "Link …" cũng nhận tệp (xem coTepDinhKem ở hr-module.ts). */
export const MAN_PHAP_LY = ["ho-so-san-pham", "so-cong-bo", "so-hop-dong", "duyet-bao-bi", "nha-cung-cap", "san-pham"] as const;
export const MAN_UNG_VIEN = "ung-vien";
export type ManTep = string;
const CHUNG = ["Tài liệu", "Bài thuyết trình (slide)", "Hình ảnh", "Khác"];
const LOAI_PHAP_LY = ["Giấy uỷ quyền (LOA)", "CFS", "Phiếu công bố", "PIF", "Hợp đồng", "Chứng từ thanh toán", "Giấy đăng ký doanh nghiệp (ĐKDN)", "Artwork", ...CHUNG];
const LOAI_UNG_VIEN = ["CV", "Bằng cấp / chứng chỉ", ...CHUNG];
const LOAI_KHAC = ["Tài liệu", "Bài thuyết trình (slide)", "Hình ảnh", "Bằng chứng", "Báo cáo", "Khác"];
/** Mọi loại giấy hợp lệ (khớp ràng buộc trong DB, migration 0051). */
export const LOAI_GIAY_TEP = [...new Set([...LOAI_PHAP_LY, ...LOAI_UNG_VIEN, ...LOAI_KHAC])] as readonly string[];
/** Loại giấy chọn được ở từng màn. */
export const loaiTheoMan = (man: string): readonly string[] => ((MAN_PHAP_LY as readonly string[]).includes(man) ? LOAI_PHAP_LY : man === MAN_UNG_VIEN ? LOAI_UNG_VIEN : LOAI_KHAC);
export const GIOI_HAN_TEP = 25 * 1024 * 1024;
export const KHO_TEP = "tai-lieu-omyn";
/** Đuôi tệp cho phép: PDF, ảnh, Word/Excel/PowerPoint (và bản mở), văn bản, nén. Không nhận .svg/.html/chương trình chạy được. */
export const DUOI_TEP = ["pdf", "png", "jpg", "jpeg", "webp", "gif", "bmp", "heic", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt", "rtf", "odt", "ods", "odp", "zip", "rar", "7z"];

export const duoiTep = (ten: string) => (ten.includes(".") ? ten.slice(ten.lastIndexOf(".") + 1).toLowerCase() : "");
/** Chỉ kiểm HÌNH DẠNG tên màn (an toàn khi ghép đường dẫn); màn có thật và có nhận tệp do máy chủ kiểm (tep-dinh-kem-data.ts). */
export const laManTep = (v: string) => /^[a-z0-9-]{2,60}$/.test(v);
export const laLoaiGiay = (v: string, man?: string) => (man ? loaiTheoMan(man) : LOAI_GIAY_TEP).includes(v);
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
