import {
  ClipboardCheck,
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  FolderOpen,
  LayoutGrid,
  BarChart3,
  CalendarDays,
  Clock,
  FileBarChart,
  Inbox,
  LayoutDashboard,
  UserPlus,
  Users,
  Wallet,
  Briefcase,
  Trophy,
  Megaphone,
  ListChecks,
  Target,
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
  /** Chỉ hiện ở menu điện thoại/máy tính bảng; thanh bên của máy tính đã có nút ở đầu trang nên bỏ để khỏi trùng. */
  chiDiDong?: boolean;
};

const CHI_QUAN_LY: ("admin" | "ky_thuat")[] = ["admin", "ky_thuat"];

export const menuChinh: MucMenu[] = [
  { ten: "Tổng quan", duong_dan: "/dashboard", nhom: "Chung", icon: LayoutDashboard, moTa: "Ai cũng thấy; nội dung theo từng tài khoản: nhân viên xem việc của mình, quản lý xem số liệu công ty." },
  { ten: "Tổng hợp", duong_dan: "/tong-hop", nhom: "Chung", icon: LayoutGrid, chiVaiTro: CHI_QUAN_LY, moTa: "Việc cần xử lý hôm nay và số liệu theo từng cụm: con người, hằng ngày, tiền lương." },
  { ten: "Hướng dẫn", duong_dan: "/huong-dan", nhom: "Chung", icon: BookOpen, chiDiDong: true, moTa: "Hướng dẫn riêng cho vai trò của bạn: nhân viên, Quản trị/Hành chính nhân sự hoặc Kỹ thuật." },
  { ten: "Hồ sơ nhân sự", duong_dan: "/nhan-su", nhom: "Nhân sự", icon: Users, chiVaiTro: CHI_QUAN_LY, moTa: "Thêm, sửa hồ sơ nhân viên; cho nghỉ việc." },
  { ten: "Hồ sơ của tôi", duong_dan: "/ho-so-cua-toi", nhom: "Nhân sự", icon: FolderOpen, moTa: "Điền sơ yếu lý lịch, người thân và tải giấy tờ của bạn; HCNS xác nhận." },
  { ten: "Khối và phòng ban", duong_dan: "/khoi", nhom: "Nhân sự", icon: Building2, chiVaiTro: CHI_QUAN_LY, moTa: "Thêm, sửa, xoá khối; xem mỗi khối có bao nhiêu người." },
  { ten: "Tuyển dụng", duong_dan: "/tuyen-dung", nhom: "Nhân sự", icon: UserPlus, chiVaiTro: CHI_QUAN_LY, moTa: "Tiếp nhận yêu cầu tuyển dụng, đăng tin theo kênh, theo dõi ứng viên qua từng vòng, chi phí và báo cáo." },
  { ten: "Yêu cầu tuyển dụng", duong_dan: "/yeu-cau-tuyen-dung", nhom: "Nhân sự", icon: ClipboardList, chiVaiTro: ["nhan_vien"], moTa: "Trưởng bộ phận gửi yêu cầu tuyển người và theo dõi HCNS xử lý." },
  { ten: "Vận hành HCNS", duong_dan: "/hr", nhom: "Nhân sự", icon: Briefcase, chiVaiTro: CHI_QUAN_LY, moTa: "Kế hoạch tuyển dụng, phỏng vấn, offer, onboarding và lộ trình 60 ngày thử việc." },
  { ten: "Thi đua KPI", duong_dan: "/kpi", nhom: "Nhân sự", icon: Trophy, moTa: "Bảng xếp hạng phòng và cá nhân theo ngày, tháng, quý; nhập kết quả KPI hằng ngày." },
  { ten: "Quảng cáo", duong_dan: "/quang-cao", nhom: "Marketing", icon: Megaphone, chiVaiTro: CHI_QUAN_LY, moTa: "Số quảng cáo Facebook và TikTok kéo về mỗi ngày: chi tiêu, hiển thị, nhấp, theo chiến dịch, nhóm, quảng cáo." },
  { ten: "Đánh giá hiệu suất", duong_dan: "/danh-gia", nhom: "Nhân sự", icon: BarChart3, chiVaiTro: CHI_QUAN_LY, moTa: "Điểm và xếp loại hiệu suất theo kỳ." },
  { ten: "Mục tiêu BSC", duong_dan: "/bsc", nhom: "Nhân sự", icon: Target, moTa: "Bản đồ chiến lược 4 góc nhìn, điểm đạt từng mục tiêu; mục tiêu cá nhân và việc cần làm của bạn." },
  { ten: "Công việc", duong_dan: "/cong-viec", nhom: "Nhân sự", icon: ListChecks, moTa: "Việc của bạn và của nhóm: thêm nhanh một dòng, ghi số lượng đã làm, theo dõi việc quá hạn." },
  { ten: "Chấm công", duong_dan: "/cham-cong", nhom: "Nhân sự", icon: Clock, moTa: "Chấm công vào/ra và xem lịch công của bạn." },
  { ten: "Bảng công tháng", duong_dan: "/bang-cong", nhom: "Nhân sự", icon: CalendarDays, chiVaiTro: CHI_QUAN_LY, moTa: "Bảng chấm công cả tháng theo mã công (X, N, CT, P, L…) và ngày nghỉ lễ." },
  { ten: "Đơn từ và phê duyệt", duong_dan: "/don-tu", nhom: "Nhân sự", icon: Inbox, moTa: "Nộp đơn nghỉ, công tác, tạm ứng và theo dõi kết quả duyệt." },
  { ten: "Phê duyệt", duong_dan: "/phe-duyet", nhom: "Nhân sự", icon: ClipboardCheck, moTa: "19 loại phiếu (nhân sự, tài chính, marketing, hành chính): nộp, duyệt nhiều bước, lịch sử, tệp đính kèm." },
  { ten: "Bảng lương", duong_dan: "/luong", nhom: "Nhân sự", icon: Wallet, chiVaiTro: ["admin", "ky_thuat", "nhan_vien"], moTa: "Quản trị và Kỹ thuật: kỳ lương, thỏa thuận lương, tham số. Nhân viên: phiếu lương của mình." },
  { ten: "Báo cáo và biểu mẫu", duong_dan: "/bao-cao", nhom: "Quản trị", icon: FileBarChart, chiVaiTro: CHI_QUAN_LY, moTa: "Báo cáo tổng hợp và biểu mẫu." },
  { ten: "Kỹ thuật", duong_dan: "/ky-thuat", nhom: "Quản trị", icon: Activity, chiVaiTro: ["ky_thuat"], moTa: "Tình trạng hệ thống và số dòng dữ liệu. Chỉ tài khoản Kỹ thuật xem được." },
];

export function locMenuTheoVaiTro(vaiTro: VaiTro | null, boMucDiDong = false): MucMenu[] {
  return menuChinh.filter((m) => (!m.chiVaiTro || (vaiTro && m.chiVaiTro.includes(vaiTro))) && !(boMucDiDong && m.chiDiDong));
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
