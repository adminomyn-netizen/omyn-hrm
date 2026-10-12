import {
  LayoutGrid,
  Users,
  Clock,
  Inbox,
  Wallet,
  Briefcase,
  BarChart3,
  FileText,
  Settings,
  Activity,
  type LucideIcon,
} from "lucide-react";
import type { VaiTro } from "@/lib/auth";

export type MucMenu = {
  ten: string;
  duong_dan: string;
  icon: LucideIcon;
  // không khai = mọi vai trò đều thấy
  chiVaiTro?: VaiTro[];
};

export const menuChinh: MucMenu[] = [
  { ten: "Tổng quan", duong_dan: "/dashboard", icon: LayoutGrid },
  { ten: "Hồ sơ nhân sự", duong_dan: "/nhan-su", icon: Users },
  { ten: "Chấm công", duong_dan: "/cham-cong", icon: Clock },
  { ten: "Đơn từ & phê duyệt", duong_dan: "/don-tu", icon: Inbox },
  { ten: "Bảng lương", duong_dan: "/luong", icon: Wallet },
  { ten: "Tuyển dụng", duong_dan: "/tuyen-dung", icon: Briefcase },
  { ten: "Đánh giá hiệu suất", duong_dan: "/danh-gia", icon: BarChart3 },
  { ten: "Báo cáo & biểu mẫu", duong_dan: "/bao-cao", icon: FileText },
  { ten: "Kỹ thuật", duong_dan: "/ky-thuat", icon: Activity, chiVaiTro: ["ky_thuat", "admin"] },
  { ten: "Cài đặt & phân quyền", duong_dan: "/cai-dat", icon: Settings, chiVaiTro: ["admin"] },
];

export function locMenuTheoVaiTro(vaiTro: VaiTro | null): MucMenu[] {
  return menuChinh.filter((m) => !m.chiVaiTro || (vaiTro && m.chiVaiTro.includes(vaiTro)));
}
