/** Vị trí cơ bản người dùng tự chọn khi đăng ký. Chỉ là YÊU CẦU để Quản trị duyệt nhanh — không cấp quyền gì.
 * Giám đốc, trưởng bộ phận, leader KHÔNG nằm trong danh sách này: do Quản trị gán sau. */
export const VI_TRI_DANG_KY = [
  { gia_tri: "nhan_vien", nhan: "Nhân viên", chucDanh: "Nhân viên" },
  { gia_tri: "hr", nhan: "Nhân sự (HR)", chucDanh: "HCNS" },
] as const;

export type ViTriDangKy = (typeof VI_TRI_DANG_KY)[number]["gia_tri"];
export const laViTriDangKy = (v: string): v is ViTriDangKy => VI_TRI_DANG_KY.some((x) => x.gia_tri === v);
export const nhanViTri = (v: unknown) => VI_TRI_DANG_KY.find((x) => x.gia_tri === v)?.nhan ?? "";
