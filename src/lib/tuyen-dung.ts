// Hằng số tuyển dụng dùng chung cho máy chủ và giao diện (không import "server-only").
export const BUOC_UNG_VIEN = ["Mới nộp", "Hẹn phỏng vấn", "Vòng 1", "Vòng 2", "Đề nghị", "Nhận việc", "Không đạt"] as const;
export const TRANG_THAI_TIN = ["Đang tuyển", "Đang phỏng vấn", "Đã đóng"] as const;
export const NGUON_UNG_VIEN = ["TopCV", "Facebook", "Zalo", "Website OMYN", "Người quen giới thiệu", "Khác"] as const;
export type BuocUngVien = (typeof BUOC_UNG_VIEN)[number];
