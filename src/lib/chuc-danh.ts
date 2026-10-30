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

/** Chức vụ không phải chấm công (chủ app chốt 22/10/2026): Tổng giám đốc, Giám đốc và tài khoản Kỹ thuật.
 * Mọi người còn lại — kể cả Quản trị/Hành chính nhân sự — đều phải chấm công. Phó giám đốc vẫn chấm công. */
export const CHUC_VU_KHONG_CHAM_CONG = ["tổng giám đốc", "giám đốc"];
export function khongCanChamCong(vaiTro: string | null | undefined, chucDanh: string | null | undefined) {
  return vaiTro === "ky_thuat" || CHUC_VU_KHONG_CHAM_CONG.includes((chucDanh ?? "").trim().toLowerCase());
}

/** Chức vụ giám đốc (Tổng giám đốc, Giám đốc): người duy nhất được nhập/sửa mức thưởng thi đua KPI (anh Nam 30/10). Phó giám đốc KHÔNG tính. */
export const laGiamDoc = (chucDanh: string | null | undefined) => CHUC_VU_KHONG_CHAM_CONG.includes((chucDanh ?? "").trim().toLowerCase());
