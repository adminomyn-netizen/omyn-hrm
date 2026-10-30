import {
  LogOut,
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
  TrendingUp,
  UserMinus,
  GraduationCap,
  BadgeCheck,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  PiggyBank,
  HeartPulse,
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
  /** Mục thuộc nhóm số mấy (1-10) trong menu Nhân sự theo mẫu của chị Lâm; 0 = Trang chủ Nhân sự. */
  phan?: number;
  /** Ẩn khỏi menu nhưng vẫn giữ trang (đường dẫn cũ còn chạy, dùng cho tiêu đề trang và tìm kiếm). */
  an?: boolean;
};

const CHI_QUAN_LY: ("admin" | "ky_thuat")[] = ["admin", "ky_thuat"];

export const menuChinh: MucMenu[] = [
  {
    ten: "Tổng quan",
    duong_dan: "/dashboard",
    nhom: "Chung",
    icon: LayoutDashboard,
    moTa: "Ai cũng thấy; nội dung theo từng tài khoản: nhân viên xem việc của mình, quản lý xem số liệu công ty.",
  },
  {
    ten: "Tổng hợp",
    duong_dan: "/tong-hop",
    nhom: "Chung",
    icon: LayoutGrid,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Việc cần xử lý hôm nay và số liệu theo từng cụm: con người, hằng ngày, tiền lương.",
  },
  {
    ten: "Hướng dẫn",
    duong_dan: "/huong-dan",
    nhom: "Chung",
    icon: BookOpen,
    chiDiDong: true,
    moTa: "Hướng dẫn riêng cho vai trò của bạn: nhân viên, Quản trị/Hành chính nhân sự hoặc Kỹ thuật.",
  },
  {
    ten: "Phê duyệt",
    duong_dan: "/phe-duyet",
    nhom: "Tổ chức & phê duyệt",
    icon: ClipboardCheck,
    moTa: "19 loại phiếu (nhân sự, tài chính, marketing, hành chính): nộp, duyệt nhiều bước, lịch sử, tệp đính kèm.",
  },
  {
    ten: "Khối và phòng ban",
    duong_dan: "/khoi",
    nhom: "Tổ chức & phê duyệt",
    icon: Building2,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Thêm, sửa, xoá khối; xem mỗi khối có bao nhiêu người.",
  },
  {
    ten: "Trang chủ Nhân sự",
    duong_dan: "/trang-chu-nhan-su",
    nhom: "Nhân sự",
    phan: 0,
    icon: LayoutGrid,
    moTa: "Toàn bộ mục Nhân sự xếp theo 10 nhóm: tuyển dụng, onboarding, hồ sơ, đào tạo, hiệu suất, thăng tiến, công lương, lịch, nghỉ việc, báo cáo.",
  },
  {
    ten: "Hồ sơ nhân sự",
    duong_dan: "/nhan-su",
    nhom: "Nhân sự",
    phan: 3,
    icon: Users,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Thêm, sửa hồ sơ nhân viên; cho nghỉ việc.",
  },
  {
    ten: "Hồ sơ của tôi",
    duong_dan: "/ho-so-cua-toi",
    nhom: "Nhân sự",
    phan: 3,
    icon: FolderOpen,
    moTa: "Điền sơ yếu lý lịch, người thân và tải giấy tờ của bạn; HCNS xác nhận.",
  },
  {
    ten: "Tuyển dụng",
    duong_dan: "/tuyen-dung",
    nhom: "Nhân sự",
    phan: 1,
    icon: UserPlus,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Tiếp nhận yêu cầu tuyển dụng, đăng tin theo kênh, theo dõi ứng viên qua từng vòng, chi phí và báo cáo.",
  },
  {
    ten: "Yêu cầu tuyển dụng",
    duong_dan: "/yeu-cau-tuyen-dung",
    nhom: "Nhân sự",
    phan: 1,
    icon: ClipboardList,
    chiVaiTro: ["nhan_vien"],
    moTa: "Trưởng bộ phận gửi yêu cầu tuyển người và theo dõi HCNS xử lý.",
  },
  {
    ten: "Kế hoạch tuyển dụng",
    duong_dan: "/hr",
    nhom: "Nhân sự",
    phan: 1,
    icon: Briefcase,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Mục tiêu và ngân sách tuyển dụng, kênh đăng tin, lịch phỏng vấn, offer. Cuối trang có các sổ HR khác chưa có menu riêng.",
  },
  {
    ten: "Mục tiêu BSC",
    duong_dan: "/bsc",
    nhom: "Nhân sự",
    phan: 5,
    icon: Target,
    moTa: "Bản đồ chiến lược 4 góc nhìn, điểm đạt từng mục tiêu; mục tiêu cá nhân và việc cần làm của bạn.",
  },
  {
    ten: "Công việc",
    duong_dan: "/cong-viec",
    nhom: "Nhân sự",
    phan: 5,
    icon: ListChecks,
    moTa: "Việc của bạn và của nhóm: thêm nhanh một dòng, ghi số lượng đã làm, theo dõi việc quá hạn.",
  },
  {
    ten: "KPI và đánh giá",
    duong_dan: "/kpi",
    nhom: "Nhân sự",
    phan: 5,
    icon: Trophy,
    moTa: "Chấm KPI hằng ngày, xếp hạng thi đua theo ngày/tháng/quý và đánh giá kỳ.",
  },
  {
    ten: "Đánh giá hiệu suất",
    duong_dan: "/danh-gia",
    nhom: "Nhân sự",
    phan: 5,
    an: true,
    icon: BarChart3,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Điểm và xếp loại hiệu suất theo kỳ.",
  },
  {
    ten: "Quảng cáo",
    duong_dan: "/quang-cao",
    nhom: "Marketing & Thương hiệu",
    icon: Megaphone,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Số quảng cáo Facebook và TikTok kéo về mỗi ngày: chi tiêu, hiển thị, nhấp, theo chiến dịch, nhóm, quảng cáo.",
  },
  {
    ten: "Chấm công",
    duong_dan: "/cham-cong",
    nhom: "Nhân sự",
    phan: 7,
    icon: Clock,
    moTa: "Chấm công vào/ra và xem lịch công của bạn.",
  },
  {
    ten: "Bảng công tháng",
    duong_dan: "/bang-cong",
    nhom: "Nhân sự",
    phan: 7,
    icon: CalendarDays,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Bảng chấm công cả tháng theo mã công (X, N, CT, P, L…) và ngày nghỉ lễ.",
  },
  {
    ten: "Đơn nghỉ và giải trình công",
    duong_dan: "/don-tu",
    nhom: "Nhân sự",
    phan: 7,
    icon: Inbox,
    moTa: "Nộp đơn nghỉ phép, giải trình chấm công và theo dõi kết quả duyệt. Phiếu đề nghị khác (tạm ứng, thanh toán, tuyển dụng…) ở mục Phê duyệt.",
  },
  {
    ten: "Nghỉ việc và bàn giao",
    duong_dan: "/nghi-viec",
    nhom: "Nhân sự",
    phan: 9,
    icon: LogOut,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Hồ sơ nghỉ việc: checklist bàn giao, chốt công-lương-BHXH, phỏng vấn thôi việc; chưa đủ thì chưa đóng.",
  },
  {
    ten: "Kế hoạch đào tạo",
    duong_dan: "/hr/ke-hoach-dao-tao",
    nhom: "Nhân sự",
    phan: 4,
    icon: GraduationCap,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Đợt đào tạo dự kiến: chủ đề, khối, hình thức, ngân sách.",
  },
  {
    ten: "Khoá học và chứng chỉ",
    duong_dan: "/hr/khoa-hoc-chung-chi",
    nhom: "Nhân sự",
    phan: 4,
    icon: BadgeCheck,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Khoá học, chứng chỉ của từng người; báo trước khi hết hạn.",
  },
  {
    ten: "Kỷ luật",
    duong_dan: "/hr/ky-luat",
    nhom: "Nhân sự",
    phan: 5,
    icon: ShieldAlert,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Ghi nhận vi phạm, hình thức xử lý và số quyết định.",
  },
  {
    ten: "Khung cấp bậc",
    duong_dan: "/hr/khung-cap-bac",
    nhom: "Nhân sự",
    phan: 6,
    icon: Layers,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Các cấp bậc, điều kiện lên cấp, khoảng lương tham chiếu.",
  },
  {
    ten: "Lịch sử thăng chức và điều chuyển",
    duong_dan: "/hr/thang-chuc-dieu-chuyen",
    nhom: "Nhân sự",
    phan: 6,
    icon: ArrowUpRight,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Mỗi lần thăng chức, điều chuyển, bổ nhiệm của từng người.",
  },
  {
    ten: "Báo cáo công lương",
    duong_dan: "/bao-cao-cong-luong",
    nhom: "Nhân sự",
    phan: 7,
    icon: FileSpreadsheet,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Tổng từng kỳ lương và quỹ lương theo khối.",
  },
  {
    ten: "Quản lý chi phí",
    duong_dan: "/quan-ly-chi-phi",
    nhom: "Nhân sự",
    phan: 7,
    icon: PiggyBank,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Lương, bảo hiểm công ty, đào tạo, tuyển dụng theo kỳ.",
  },
  {
    ten: "BHXH và phụ cấp",
    duong_dan: "/bhxh-phu-cap",
    nhom: "Nhân sự",
    phan: 7,
    icon: HeartPulse,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Mức đóng bảo hiểm và phụ cấp từng người, kèm tỷ lệ đang dùng.",
  },
  {
    ten: "Báo cáo HR",
    duong_dan: "/bao-cao-hr",
    nhom: "Nhân sự",
    phan: 10,
    icon: BarChart3,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "10 nhóm chỉ số HR: tuyển dụng, thử việc, hồ sơ, đào tạo, hiệu suất, thăng tiến, công lương, lịch, nghỉ việc, biến động.",
  },
  {
    ten: "Biến động nhân sự",
    duong_dan: "/bien-dong-nhan-su",
    nhom: "Nhân sự",
    phan: 10,
    icon: TrendingUp,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Đầu kỳ, vào, ra, cuối kỳ của 12 tháng gần nhất.",
  },
  {
    ten: "Tỷ lệ nghỉ việc",
    duong_dan: "/ty-le-nghi-viec",
    nhom: "Nhân sự",
    phan: 10,
    icon: UserMinus,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Tỷ lệ nghỉ theo tháng, theo năm và theo khối.",
  },
  {
    ten: "Lịch nhân sự",
    duong_dan: "/lich-nhan-su",
    nhom: "Nhân sự",
    phan: 8,
    icon: CalendarDays,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Hợp đồng hết hạn, hết thử việc, sinh nhật, nghỉ phép, đánh giá, hạn báo cáo nhà nước và BHXH theo tháng.",
  },
  {
    ten: "Quỹ phép",
    duong_dan: "/quy-phep",
    nhom: "Nhân sự",
    phan: 7,
    icon: CalendarDays,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Phép năm được hưởng, đã nghỉ, còn lại của từng người.",
  },
  {
    ten: "Bảng lương",
    duong_dan: "/luong",
    nhom: "Nhân sự",
    phan: 7,
    icon: Wallet,
    chiVaiTro: ["admin", "ky_thuat", "nhan_vien"],
    moTa: "Quản trị và Kỹ thuật: kỳ lương, thỏa thuận lương, tham số. Nhân viên: phiếu lương của mình.",
  },
  {
    ten: "Onboarding và thử việc",
    duong_dan: "/hr/onboarding",
    nhom: "Nhân sự",
    phan: 2,
    icon: UserPlus,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Lộ trình 4 giai đoạn, hồ sơ, đánh giá mentor 30/60 ngày, quyết định lên chính thức.",
  },
  {
    ten: "Hợp đồng lao động",
    duong_dan: "/hr/hop-dong-lao-dong",
    nhom: "Nhân sự",
    phan: 3,
    icon: FolderOpen,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Loại, thời hạn, số lần ký; cảnh báo hợp đồng sắp hết hạn.",
  },
  {
    ten: "Phụ lục hợp đồng",
    duong_dan: "/hr/hop-dong-phu-luc",
    nhom: "Nhân sự",
    phan: 3,
    icon: FolderOpen,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Phụ lục gia hạn, điều chỉnh lương, chức danh, địa điểm.",
  },
  {
    ten: "Tài sản cấp phát",
    duong_dan: "/hr/tai-san-cap-phat",
    nhom: "Nhân sự",
    phan: 3,
    icon: Briefcase,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Tài sản công ty cấp cho từng người và ngày trả.",
  },
  {
    ten: "Khen thưởng thi đua",
    duong_dan: "/hr/kpi-thuong",
    nhom: "Nhân sự",
    phan: 5,
    icon: Trophy,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Mức thưởng hạng 1-2-3 theo tháng/quý (chỉ giám đốc nhập).",
  },
  {
    ten: "Đánh giá tái ký",
    duong_dan: "/hr/danh-gia-tai-ky",
    nhom: "Nhân sự",
    phan: 6,
    icon: BarChart3,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Đánh giá trước khi hợp đồng hết hạn: ký tiếp, không thời hạn, gia hạn thử việc hay không tái ký.",
  },
  {
    ten: "Giờ tăng ca",
    duong_dan: "/hr/tang-ca",
    nhom: "Nhân sự",
    phan: 7,
    icon: Clock,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Giờ làm thêm đã xác nhận, có giới hạn theo luật.",
  },
  {
    ten: "Thưởng, hoa hồng",
    duong_dan: "/hr/thuong-hoa-hong",
    nhom: "Nhân sự",
    phan: 7,
    icon: Wallet,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Thưởng, hoa hồng, phụ cấp khác tự cộng vào bảng lương.",
  },
  {
    ten: "Báo cáo và biểu mẫu",
    duong_dan: "/bao-cao",
    nhom: "Quản trị",
    icon: FileBarChart,
    chiVaiTro: CHI_QUAN_LY,
    moTa: "Báo cáo tổng hợp và biểu mẫu.",
  },
  {
    ten: "Setup luồng phiếu",
    duong_dan: "/ky-thuat/luong-phieu",
    nhom: "Quản trị",
    icon: ClipboardCheck,
    chiVaiTro: ["ky_thuat"],
    moTa: "Chỉnh bước duyệt, người duyệt, điều kiện hiện ô, nhóm mã và thông báo của từng loại phiếu; có lịch sử sửa.",
  },
  {
    ten: "Kỹ thuật",
    duong_dan: "/ky-thuat",
    nhom: "Quản trị",
    icon: Activity,
    chiVaiTro: ["ky_thuat"],
    moTa: "Tình trạng hệ thống và số dòng dữ liệu. Chỉ tài khoản Kỹ thuật xem được.",
  },
];

/** Đường dẫn menu khớp trang hiện tại nhất (dài nhất): /ky-thuat/luong-phieu chỉ làm sáng "Setup luồng phiếu", không làm sáng cả "Kỹ thuật". */
export function duongDanDangChon(
  pathname: string,
  menu: readonly { duong_dan: string }[],
): string | null {
  let tot: string | null = null;
  for (const m of menu) {
    if (
      (pathname === m.duong_dan || pathname.startsWith(m.duong_dan + "/")) &&
      (tot === null || m.duong_dan.length > tot.length)
    )
      tot = m.duong_dan;
  }
  return tot;
}

export function locMenuTheoVaiTro(
  vaiTro: VaiTro | null,
  boMucDiDong = false,
): MucMenu[] {
  return menuChinh.filter(
    (m) =>
      !m.an &&
      (!m.chiVaiTro || (vaiTro && m.chiVaiTro.includes(vaiTro))) &&
      !(boMucDiDong && m.chiDiDong),
  );
}

/** Gom mục menu theo nhóm, giữ thứ tự xuất hiện đầu tiên của nhóm. */
export function gomTheoNhom(
  menu: MucMenu[],
): { nhom: string; muc: MucMenu[] }[] {
  const ra: { nhom: string; muc: MucMenu[] }[] = [];
  for (const m of menu) {
    const g = ra.find((x) => x.nhom === m.nhom);
    if (g) g.muc.push(m);
    else ra.push({ nhom: m.nhom, muc: [m] });
  }
  return ra;
}

/** 10 nhóm menu Nhân sự theo mẫu chị Lâm (30/10/2026). */
export const NHOM_NHAN_SU: readonly { so: number; ten: string }[] = [
  { so: 1, ten: "Tuyển dụng" },
  { so: 2, ten: "Onboarding và thử việc" },
  { so: 3, ten: "Hồ sơ nhân sự" },
  { so: 4, ten: "Đào tạo" },
  { so: 5, ten: "Hiệu suất" },
  { so: 6, ten: "Thăng tiến" },
  { so: 7, ten: "Công lương" },
  { so: 8, ten: "Lịch" },
  { so: 9, ten: "Offboarding" },
  { so: 10, ten: "Báo cáo tổng" },
];

/** Màn chưa có: hiện nhãn "Sắp có" ở đúng nhóm, chưa bấm vào được. */
export const SAP_CO_NHAN_SU: readonly { phan: number; ten: string }[] = [];

export type NhomNhanSu = {
  so: number;
  ten: string;
  muc: MucMenu[];
  sapCo: string[];
};

/** Chia các mục Nhân sự (đã lọc theo vai trò) vào 10 nhóm; trả kèm Trang chủ Nhân sự riêng. Nhóm không có mục nào vẫn có mặt với nhãn "Sắp có". */
export function chiaNhomNhanSu(menu: readonly MucMenu[]): {
  trangChu: MucMenu | null;
  nhom: NhomNhanSu[];
} {
  const ns = menu.filter((m) => m.nhom === "Nhân sự");
  return {
    trangChu: ns.find((m) => m.phan === 0) ?? null,
    nhom: NHOM_NHAN_SU.map((g) => ({
      ...g,
      muc: ns.filter((m) => m.phan === g.so),
      sapCo: SAP_CO_NHAN_SU.filter((x) => x.phan === g.so).map((x) => x.ten),
    })),
  };
}

export const NHAN_VAI_TRO: Record<VaiTro, string> = {
  admin: "Quản trị",
  ky_thuat: "Kỹ thuật",
  nhan_vien: "Nhân viên",
  cho_duyet: "Chờ duyệt",
};
