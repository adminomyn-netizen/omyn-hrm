/** Quét mã đóng gói và nhận hàng hoàn. Hàm thuần, không chạm DB: nhận các dòng đã tìm được rồi quyết định làm gì. */

/** Bỏ ký tự điều khiển (máy quét hay thêm) và khoảng trắng thừa. Không đổi chữ hoa/thường. */
export const chuanMaQuet = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, "").trim().replace(/\s+/g, " ");

export type DongKho = { id: string; kenh: string; trangThai: string; maVanDon: string | null; dongGoiLuc: string | null };
export type DonSo = { id: string; kenh: string; trangThai: string };

export type QuyetDinhDong =
  | { loai: "dong"; id: string }
  | { loai: "daDong"; id: string; luc: string | null }
  | { loai: "tao"; donSoId: string; kenhKho: string }
  | { loai: "chan"; ly: string }
  | { loai: "trung"; ly: string }
  | { loai: "khongThay" };

/** Kênh của sổ đơn lẻ ứng với kênh của sổ đóng gói. Sàn = Shopee, TikTok Shop; còn lại ghi Khác. */
export const kenhKhoTuKenhSo = (kenh: string) => (kenh === "Shopee" || kenh === "TikTok Shop" ? "Sàn" : "Khác");

/**
 * Quyết định khi quét một mã đơn.
 * - Đã có dòng trong sổ đóng gói: "Chờ đóng" thì đóng; "Đã đóng" thì báo quét lại; trạng thái khác thì chặn.
 *   Nếu Sổ đơn lẻ ghi đơn Huỷ hoặc Hoàn trả mà vẫn "Chờ đóng" thì chặn, không đóng.
 * - Chưa có dòng nhưng có đúng một đơn trong Sổ đơn lẻ: chỉ đơn "Đang xử lý" mới tạo dòng đóng gói.
 * - Không thấy ở đâu: khongThay (màn hình hỏi người dùng có ghi đơn mới không).
 */
export function quyetDinhDongGoi(dongKho: readonly DongKho[], donSo: readonly DonSo[]): QuyetDinhDong {
  if (dongKho.length > 1) return { loai: "trung", ly: "Mã này có nhiều dòng trong sổ đóng gói (nhiều kênh). Mở Đóng gói và giao hàng để chọn đúng đơn." };
  if (dongKho.length === 1) {
    const k = dongKho[0];
    if (k.trangThai === "Đã đóng") return { loai: "daDong", id: k.id, luc: k.dongGoiLuc };
    if (k.trangThai !== "Chờ đóng") return { loai: "chan", ly: `Đơn này đã ghi "${k.trangThai}", không đóng lại.` };
    if (donSo.length === 1 && (donSo[0].trangThai === "Huỷ" || donSo[0].trangThai === "Hoàn trả")) {
      return { loai: "chan", ly: `Sổ đơn lẻ ghi đơn này "${donSo[0].trangThai}". ĐỪNG đóng gói, báo bộ phận bán hàng.` };
    }
    return { loai: "dong", id: k.id };
  }
  if (donSo.length > 1) return { loai: "trung", ly: "Mã này có ở nhiều kênh trong Sổ đơn lẻ. Mở Đóng gói và giao hàng để ghi đúng đơn." };
  if (donSo.length === 1) {
    const d = donSo[0];
    if (d.trangThai !== "Đang xử lý") return { loai: "chan", ly: `Sổ đơn lẻ ghi đơn này "${d.trangThai}", không đóng gói.` };
    return { loai: "tao", donSoId: d.id, kenhKho: kenhKhoTuKenhSo(d.kenh) };
  }
  return { loai: "khongThay" };
}

export type DongHoan = { id: string; tinhTrang: string };
export type QuyetDinhHoan =
  | { loai: "nhan"; id: string }
  | { loai: "daGhi"; tinhTrang: string }
  | { loai: "nhieu" }
  | { loai: "chuaGhi" }
  | { loai: "khongThay" };

/**
 * Quyết định khi quét hàng hoàn về. `dongHoan` = các dòng Đơn hoàn tìm được theo mã vận đơn hoàn hoặc mã đơn; `coDon` = mã có trong Sổ đơn lẻ.
 * Chỉ dòng "Chờ hàng về" mới chuyển được sang "Đã nhận đủ". Nhận thiếu hoặc hỏng thì sửa tay ở màn Đơn hoàn.
 */
export function quyetDinhHangHoan(dongHoan: readonly DongHoan[], coDon: boolean): QuyetDinhHoan {
  if (dongHoan.length === 0) return coDon ? { loai: "chuaGhi" } : { loai: "khongThay" };
  const cho = dongHoan.filter((d) => d.tinhTrang === "Chờ hàng về");
  if (cho.length === 1) return { loai: "nhan", id: cho[0].id };
  if (cho.length > 1) return { loai: "nhieu" };
  return { loai: "daGhi", tinhTrang: dongHoan[0].tinhTrang };
}
