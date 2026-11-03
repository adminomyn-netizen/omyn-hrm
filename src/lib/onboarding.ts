/** Lộ trình 60 ngày mẫu cho người mới (theo app Onboarding Lark: gửi form hồ sơ → đào tạo → đánh giá mentor 30/60 ngày → quyết định lên chính thức). */
export const GIAI_DOAN = ["Trước ngày 1", "Tuần 1", "Ngày 30", "Ngày 60"] as const;
export type GiaiDoan = (typeof GIAI_DOAN)[number];

export const NHIEM_VU_MAU: { giaiDoan: GiaiDoan; noiDung: string }[] = [
  { giaiDoan: "Trước ngày 1", noiDung: "Gửi form thông tin cá nhân và danh sách giấy tờ cần nộp" },
  { giaiDoan: "Trước ngày 1", noiDung: "Tạo tài khoản Omyn, email công ty và quyền hệ thống" },
  { giaiDoan: "Trước ngày 1", noiDung: "Chuẩn bị chỗ ngồi, thiết bị và gửi lịch ngày đầu tiên" },
  { giaiDoan: "Tuần 1", noiDung: "Chào mừng, giới thiệu công ty, văn hoá và nội quy" },
  { giaiDoan: "Tuần 1", noiDung: "Giới thiệu đội ngũ và mentor kèm cặp" },
  { giaiDoan: "Tuần 1", noiDung: "Ký hợp đồng thử việc và cam kết bảo mật (NDA)" },
  { giaiDoan: "Tuần 1", noiDung: "Đào tạo quy trình, phần mềm và bàn giao thiết bị" },
  { giaiDoan: "Tuần 1", noiDung: "Thống nhất mục tiêu 30 ngày đầu với quản lý" },
  { giaiDoan: "Ngày 30", noiDung: "Mentor đánh giá 30 ngày" },
  { giaiDoan: "Ngày 30", noiDung: "Nhân sự trao đổi 1-1: khó khăn, điều cần hỗ trợ" },
  { giaiDoan: "Ngày 30", noiDung: "Thống nhất mục tiêu 30 ngày tiếp theo" },
  { giaiDoan: "Ngày 60", noiDung: "Mentor đánh giá 60 ngày" },
  { giaiDoan: "Ngày 60", noiDung: "Quản lý và Nhân sự đánh giá cuối thử việc" },
  { giaiDoan: "Ngày 60", noiDung: "Quyết định lên chính thức hoặc kết thúc thử việc" },
  { giaiDoan: "Ngày 60", noiDung: "Ký hợp đồng chính thức và cập nhật hồ sơ nhân sự" },
];

export const TINH_TRANG_ONB = ["Chuẩn bị", "Đang thử việc", "Đạt, lên chính thức", "Không đạt", "Nghỉ giữa chừng"] as const;
export const TT_HO_SO = ["Chưa gửi form", "Đã gửi form", "Đã điền", "Thiếu thông tin", "Đủ hồ sơ"] as const;

const NGAY_MS = 86400000;
export const cong = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * NGAY_MS).toISOString().slice(0, 10);

/** Hạn của một giai đoạn tính từ ngày bắt đầu. */
export function hanGiaiDoan(gd: GiaiDoan, batDau: string, soNgay: number): string {
  return gd === "Trước ngày 1" ? cong(batDau, -2) : gd === "Tuần 1" ? cong(batDau, 7) : gd === "Ngày 30" ? cong(batDau, Math.min(30, soNgay)) : cong(batDau, soNgay);
}

/** Ngày thứ mấy của thử việc (1-based) tính theo giờ Việt Nam; âm/0 = chưa tới ngày bắt đầu. */
export function ngayThuViec(batDau: string, homNay: string): number {
  return Math.round((new Date(`${homNay}T00:00:00Z`).getTime() - new Date(`${batDau}T00:00:00Z`).getTime()) / NGAY_MS) + 1;
}
export const homNayVN = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
