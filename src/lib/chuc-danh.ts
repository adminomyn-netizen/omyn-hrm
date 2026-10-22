/** Chức danh nhạy cảm: chỉ Quản trị được gắn tài khoản vào hồ sơ có chức danh này. */
const CHUC_DANH_NHAY_CAM = ["tổng giám đốc", "phó tổng giám đốc", "hcns", "kế toán"];
export function laChucDanhNhayCam(chucDanh: string | null | undefined) {
  const c = (chucDanh ?? "").toLowerCase();
  return CHUC_DANH_NHAY_CAM.some((x) => c.includes(x));
}
