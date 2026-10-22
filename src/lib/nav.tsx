import type { VaiTro } from "@/lib/auth";

export type MucMenu = {
  ten: string;
  duong_dan: string;
  nhom: string;
  // không khai = mọi vai trò đều thấy
  chiVaiTro?: VaiTro[];
};

const CHI_QUAN_LY: ("admin" | "ky_thuat")[] = ["admin", "ky_thuat"];

export const menuChinh: MucMenu[] = [
  { ten: "Tổng quan", duong_dan: "/dashboard", nhom: "Chung", chiVaiTro: CHI_QUAN_LY },
  { ten: "Hồ sơ nhân sự", duong_dan: "/nhan-su", nhom: "Con người", chiVaiTro: CHI_QUAN_LY },
  { ten: "Chấm công", duong_dan: "/cham-cong", nhom: "Hằng ngày" },
  { ten: "Đơn từ và phê duyệt", duong_dan: "/don-tu", nhom: "Hằng ngày" },
  { ten: "Bảng lương", duong_dan: "/luong", nhom: "Tiền lương", chiVaiTro: CHI_QUAN_LY },
  { ten: "Tuyển dụng", duong_dan: "/tuyen-dung", nhom: "Con người", chiVaiTro: CHI_QUAN_LY },
  { ten: "Đánh giá hiệu suất", duong_dan: "/danh-gia", nhom: "Con người", chiVaiTro: CHI_QUAN_LY },
  { ten: "Báo cáo và biểu mẫu", duong_dan: "/bao-cao", nhom: "Quản trị", chiVaiTro: CHI_QUAN_LY },
  { ten: "Kỹ thuật", duong_dan: "/ky-thuat", nhom: "Quản trị", chiVaiTro: ["ky_thuat", "admin"] },
  { ten: "Cài đặt và phân quyền", duong_dan: "/cai-dat", nhom: "Quản trị", chiVaiTro: ["admin"] },
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
