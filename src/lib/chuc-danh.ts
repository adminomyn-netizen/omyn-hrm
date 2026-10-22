/** Chức danh nhạy cảm: chỉ Quản trị được gắn tài khoản vào hồ sơ có chức danh này. */
const CHUC_DANH_NHAY_CAM = ["tổng giám đốc", "phó tổng giám đốc", "hcns", "kế toán"];
export function laChucDanhNhayCam(chucDanh: string | null | undefined) {
  const c = (chucDanh ?? "").toLowerCase();
  return CHUC_DANH_NHAY_CAM.some((x) => c.includes(x));
}

/** Phòng ban có quyền Quản trị: người đăng ký chọn phòng ban này thì ô vai trò khi duyệt mặc định là Quản trị.
 * Vẫn do Kỹ thuật/Quản trị bấm duyệt — chọn phòng ban lúc đăng ký KHÔNG tự cấp quyền. */
export const KHOI_QUYEN_QUAN_TRI = "Hành chính nhân sự";
