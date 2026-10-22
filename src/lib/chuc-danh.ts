/** Chức danh nhạy cảm: chỉ Quản trị được gắn tài khoản vào hồ sơ có chức danh này. */
const CHUC_DANH_NHAY_CAM = ["tổng giám đốc", "phó tổng giám đốc", "hcns", "kế toán"];
export function laChucDanhNhayCam(chucDanh: string | null | undefined) {
  const c = (chucDanh ?? "").toLowerCase();
  return CHUC_DANH_NHAY_CAM.some((x) => c.includes(x));
}

/** Phòng ban có quyền Quản trị: người đăng ký chọn phòng ban này thì ô vai trò khi duyệt mặc định là Quản trị.
 * Vẫn do Kỹ thuật/Quản trị bấm duyệt — chọn phòng ban lúc đăng ký KHÔNG tự cấp quyền. */
export const KHOI_QUYEN_QUAN_TRI = "Hành chính nhân sự";

/** Chức vụ lãnh đạo: cũng được coi như Hành chính nhân sự — khi duyệt, vai trò gợi ý là Quản trị (chủ app chốt 22/10/2026).
 * Chỉ là GỢI Ý: người duyệt vẫn bấm xác nhận, hệ thống không tự nâng quyền. */
export const CHUC_VU_QUYEN_QUAN_TRI = ["tổng giám đốc", "phó tổng giám đốc", "giám đốc", "phó giám đốc"];
export function nenLaQuanTri(chucVu: string | null | undefined, tenKhoi: string | null | undefined) {
  return tenKhoi === KHOI_QUYEN_QUAN_TRI || CHUC_VU_QUYEN_QUAN_TRI.includes((chucVu ?? "").trim().toLowerCase());
}
