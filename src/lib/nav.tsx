import {
  Activity,
  Building2,
  BarChart3,
  Clock,
  FileBarChart,
  Inbox,
  LayoutDashboard,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { VaiTro } from "@/lib/auth";

export type MucMenu = {
  ten: string;
  duong_dan: string;
  nhom: string;
  icon: LucideIcon;
  /** Một câu nói rõ mục này dùng để làm gì — hiện ở menu người dùng để ai vào cũng hiểu mình làm được gì. */
  moTa: string;
  // không khai = mọi vai trò đều thấy
  chiVaiTro?: VaiTro[];
};

const CHI_QUAN_LY: ("admin" | "ky_thuat")[] = ["admin", "ky_thuat"];

export const menuChinh: MucMenu[] = [
  { ten: "Tổng quan", duong_dan: "/dashboard", nhom: "Chung", icon: LayoutDashboard, moTa: "Ai cũng thấy; nội dung theo từng tài khoản: nhân viên xem việc của mình, quản lý xem số liệu công ty." },
  { ten: "Hồ sơ nhân sự", duong_dan: "/nhan-su", nhom: "Con người", icon: Users, chiVaiTro: CHI_QUAN_LY, moTa: "Thêm, sửa hồ sơ nhân viên; cho nghỉ việc." },
  { ten: "Khối và phòng ban", duong_dan: "/khoi", nhom: "Con người", icon: Building2, chiVaiTro: CHI_QUAN_LY, moTa: "Thêm, sửa, xoá khối; xem mỗi khối có bao nhiêu người." },
  { ten: "Tuyển dụng", duong_dan: "/tuyen-dung", nhom: "Con người", icon: UserPlus, chiVaiTro: CHI_QUAN_LY, moTa: "Đăng tin, nhận hồ sơ, theo dõi ứng viên qua từng vòng." },
  { ten: "Đánh giá hiệu suất", duong_dan: "/danh-gia", nhom: "Con người", icon: BarChart3, chiVaiTro: CHI_QUAN_LY, moTa: "Điểm và xếp loại hiệu suất theo kỳ." },
  { ten: "Chấm công", duong_dan: "/cham-cong", nhom: "Hằng ngày", icon: Clock, moTa: "Chấm công vào/ra và xem lịch công của bạn." },
  { ten: "Đơn từ và phê duyệt", duong_dan: "/don-tu", nhom: "Hằng ngày", icon: Inbox, moTa: "Nộp đơn nghỉ, công tác, tạm ứng và theo dõi kết quả duyệt." },
  { ten: "Bảng lương", duong_dan: "/luong", nhom: "Tiền lương", icon: Wallet, chiVaiTro: ["admin", "ky_thuat", "nhan_vien"], moTa: "Quản trị và Kỹ thuật: kỳ lương, thỏa thuận lương, tham số. Nhân viên: phiếu lương của mình." },
  { ten: "Báo cáo và biểu mẫu", duong_dan: "/bao-cao", nhom: "Quản trị", icon: FileBarChart, chiVaiTro: CHI_QUAN_LY, moTa: "Báo cáo tổng hợp và biểu mẫu." },
  { ten: "Kỹ thuật", duong_dan: "/ky-thuat", nhom: "Quản trị", icon: Activity, chiVaiTro: ["ky_thuat"], moTa: "Tình trạng hệ thống và số dòng dữ liệu. Chỉ tài khoản Kỹ thuật xem được." },
];

export function locMenuTheoVaiTro(vaiTro: VaiTro | null): MucMenu[] {
  return menuChinh.filter((m) => !m.chiVaiTro || (vaiTro && m.chiVaiTro.includes(vaiTro)));
}

/** Gom mục menu theo nhóm, giữ thứ tự xuất hiện đầu tiên của nhóm. */
export function gomTheoNhom(menu: MucMenu[]): { nhom: string; muc: MucMenu[] }[] {
  const ra: { nhom: string; muc: MucMenu[] }[] = [];
  for (const m of menu) {
    const g = ra.find((x) => x.nhom === m.nhom);
    if (g) g.muc.push(m);
    else ra.push({ nhom: m.nhom, muc: [m] });
  }
  return ra;
}

export const NHAN_VAI_TRO: Record<VaiTro, string> = {
  admin: "Quản trị",
  ky_thuat: "Kỹ thuật",
  nhan_vien: "Nhân viên",
  cho_duyet: "Chờ duyệt",
};
