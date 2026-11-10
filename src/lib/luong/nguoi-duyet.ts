/**
 * Bảng lương chỉ có 2 bước người: Phượng (nhân sự) LẬP, rồi chị Lâm hoặc chị Linh DUYỆT.
 * Người duyệt đặt cứng theo mã tài khoản (chị Lâm chốt 06/11/2026). Muốn đổi người thì sửa danh sách này.
 * Anh Nam (Kỹ thuật) không tự duyệt được, để người lập và người duyệt luôn là hai người khác nhau.
 */
export const NGUOI_DUYET_LUONG: Record<string, string> = {
  "2aa28611-2b2c-4e1c-946d-30855ac28085": "chị Lâm",
  "6272ee71-a07d-4105-998b-ef1cc5f9c9b3": "chị Linh",
};

export const duocDuyetLuong = (userId: string | null | undefined): boolean => !!userId && Object.prototype.hasOwnProperty.call(NGUOI_DUYET_LUONG, userId);

/** Chỉ chị Lâm / chị Linh được bật tắt "khấu trừ thuế 10%" cho từng người (chị Lâm 10/11: "để mình tự setup, đừng để nhân sự tự set"). Nhân sự chỉ xem. */
export const duocDatKhauTru10 = duocDuyetLuong;

/** Bước kế tiếp của kỳ. "da_kiem" là bước cũ đã bỏ: kỳ nào còn kẹt ở đó đi thẳng sang duyệt. */
export const THU_TU_KY = ["mo", "da_lap", "da_duyet", "da_chi"] as const;
export type TrangThaiKy = (typeof THU_TU_KY)[number];
export function buocKeTiep(hienTai: string): TrangThaiKy | null {
  const h = hienTai === "da_kiem" ? "da_lap" : hienTai;
  const i = THU_TU_KY.indexOf(h as TrangThaiKy);
  return i < 0 || i >= THU_TU_KY.length - 1 ? null : THU_TU_KY[i + 1];
}
