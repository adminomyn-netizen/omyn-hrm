// Hồ sơ nhân viên: sơ yếu lý lịch + giấy tờ scan (dùng chung máy chủ và giao diện, không import "server-only").
export const LOAI_TAI_LIEU = [
  "CCCD mặt trước", "CCCD mặt sau", "Sơ yếu lý lịch", "Bằng cấp", "Hợp đồng lao động", "Cam kết bảo mật (NDA)",
  "Giấy khám sức khoẻ", "Sổ BHXH", "Giấy tờ người phụ thuộc", "Khác",
] as const;
export type LoaiTaiLieu = (typeof LOAI_TAI_LIEU)[number];

/** Giấy tờ bắt buộc phải có trong hồ sơ (theo bảng "Quản lý nhân sự" của MSC: ảnh CCCD, NDA, hợp đồng). */
/** Giấy tờ bắt buộc theo luật (chị Lâm chốt 30/10): CCCD hai mặt, sơ yếu lý lịch, bằng cấp, giấy khám sức khoẻ, sổ BHXH. Mã số thuế là trường thông tin, kiểm riêng ở truongThieuTheoLuat. */
export const GIAY_TO_THEO_LUAT: readonly LoaiTaiLieu[] = ["CCCD mặt trước", "CCCD mặt sau", "Sơ yếu lý lịch", "Bằng cấp", "Giấy khám sức khoẻ", "Sổ BHXH"];
/** Giấy tờ theo quy định công ty. */
export const GIAY_TO_CONG_TY: readonly LoaiTaiLieu[] = ["Hợp đồng lao động", "Cam kết bảo mật (NDA)"];
export const GIAY_TO_BAT_BUOC: readonly LoaiTaiLieu[] = [...GIAY_TO_THEO_LUAT, ...GIAY_TO_CONG_TY];
/** Thông tin bắt buộc theo luật trong sơ yếu lý lịch. */
export const TRUONG_BAT_BUOC_THEO_LUAT: readonly { k: string; nhan: string }[] = [{ k: "cccd", nhan: "Số CCCD" }, { k: "ma_so_thue", nhan: "Mã số thuế" }, { k: "so_bhxh", nhan: "Số sổ BHXH" }];
/** Thông tin bắt buộc theo luật còn thiếu trong hồ sơ cá nhân. */
export const truongThieuTheoLuat = (h: Record<string, unknown> | null) => TRUONG_BAT_BUOC_THEO_LUAT.filter((t) => String(h?.[t.k] ?? "").trim() === "").map((t) => t.nhan);
export const TRANG_THAI_TAI_LIEU = ["Chờ xác nhận", "Đã xác nhận", "Cần bổ sung"] as const;

export const MIME_CHO_PHEP = ["application/pdf", "image/jpeg", "image/png"] as const;
export const KICH_THUOC_TOI_DA = 10 * 1024 * 1024;
const DUOI: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
export const duoiTep = (mime: string) => DUOI[mime] ?? "";

export function kiemTraTep(mime: string, kichThuoc: number): string | null {
  if (!(MIME_CHO_PHEP as readonly string[]).includes(mime)) return "Chỉ nhận PDF, JPG hoặc PNG.";
  if (!Number.isInteger(kichThuoc) || kichThuoc <= 0) return "Tệp rỗng.";
  if (kichThuoc > KICH_THUOC_TOI_DA) return "Tệp quá 10 MB.";
  return null;
}

type TlTom = { loai: string; da_go: boolean; trang_thai: string };
/** Giấy tờ bắt buộc còn thiếu: chưa có tệp nào còn hiệu lực, hoặc tệp bị đánh dấu "Cần bổ sung". */
export function giayToConThieu(ds: TlTom[]): LoaiTaiLieu[] {
  return GIAY_TO_BAT_BUOC.filter((l) => !ds.some((d) => d.loai === l && !d.da_go && d.trang_thai !== "Cần bổ sung"));
}

const so = (s: string) => s.replace(/\s/g, "");
/** Kiểm tra các trường hồ sơ cá nhân; trả về lỗi đầu tiên hoặc null. Trường trống luôn hợp lệ (điền dần). */
export function kiemTraHoSo(h: { cccd?: string; dien_thoai?: string; ma_so_thue?: string; so_bhxh?: string; nguoi_than_dien_thoai?: string; ngay_sinh?: string; ngay_cap_cccd?: string }): string | null {
  const ngayHopLe = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
  if (h.cccd && !/^(\d{9}|\d{12})$/.test(so(h.cccd))) return "Số CCCD gồm 12 chữ số (CMND cũ 9 số).";
  if (h.dien_thoai && !/^[0-9+().-]{8,16}$/.test(so(h.dien_thoai))) return "Số điện thoại chưa đúng.";
  if (h.nguoi_than_dien_thoai && !/^[0-9+().-]{8,16}$/.test(so(h.nguoi_than_dien_thoai))) return "Số điện thoại người thân chưa đúng.";
  if (h.ma_so_thue && !/^(\d{10}|\d{12}|\d{13}|\d{10}-\d{3})$/.test(so(h.ma_so_thue))) return "Mã số thuế gồm 10, 12 (số CCCD) hoặc 13 chữ số.";
  if (h.so_bhxh && !/^(\d{10}|\d{12})$/.test(so(h.so_bhxh))) return "Số sổ BHXH gồm 10 chữ số, hoặc 12 chữ số (số CCCD).";
  if (h.ngay_sinh && !ngayHopLe(h.ngay_sinh)) return "Ngày sinh chưa đúng.";
  if (h.ngay_cap_cccd && !ngayHopLe(h.ngay_cap_cccd)) return "Ngày cấp CCCD chưa đúng.";
  return null;
}

/** Hồ sơ đã điền bao nhiêu phần trăm các trường chính (để HCNS thấy ai còn thiếu). */
const TRUONG_CHINH = ["gioi_tinh", "ngay_sinh", "dien_thoai", "cccd", "ngay_cap_cccd", "noi_cap_cccd", "dia_chi_thuong_tru", "dia_chi_hien_tai", "nguoi_than_ten", "nguoi_than_dien_thoai", "ma_so_thue", "so_bhxh", "ngan_hang", "so_tai_khoan"] as const;
export const tyLeDienHoSo = (h: Record<string, unknown> | null) => (h ? Math.round((TRUONG_CHINH.filter((k) => String(h[k] ?? "").trim() !== "").length / TRUONG_CHINH.length) * 100) : 0);
export { TRUONG_CHINH };
