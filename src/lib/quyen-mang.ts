/** Các mảng nghiệp vụ mở cho nhân viên theo khối (xem hoặc nhập). Phần thuần, dùng được cả ở menu phía trình duyệt. */
export type Quyen = "xem" | "nhap";
export type QuyenMang = Partial<Record<string, Quyen>>;

export const MANG: readonly { ma: string; ten: string }[] = [
  { ma: "marketing", ten: "Marketing & Thương hiệu" },
  { ma: "kinh-doanh", ten: "Kinh doanh" },
  { ma: "san-pham", ten: "Sản phẩm & Giá" },
  { ma: "phap-ly", ten: "Pháp lý & Hồ sơ" },
  { ma: "tai-chinh-kho", ten: "Tài chính & Kho" },
  { ma: "chien-luoc", ten: "Chiến lược" },
];

/** Tên nhóm (menu và HR_MUC.nhom) → mã mảng. Nhóm không có ở đây chỉ Quản trị/Kỹ thuật dùng. */
export const MANG_THEO_NHOM: Record<string, string> = Object.fromEntries(MANG.map((m) => [m.ten, m.ma]));

/** Từ Trưởng bộ phận trở lên (chủ app chốt: chỉ họ được xoá bản ghi). Thực tập sinh chỉ xem. */
const TU_TRUONG_BO_PHAN = ["tổng giám đốc", "phó tổng giám đốc", "giám đốc", "phó giám đốc", "trưởng bộ phận"];
export const tuTruongBoPhan = (chucDanh: string | null | undefined) => TU_TRUONG_BO_PHAN.includes((chucDanh ?? "").trim().toLowerCase());
export const laThucTapSinh = (chucDanh: string | null | undefined) => (chucDanh ?? "").trim().toLowerCase() === "thực tập sinh";

/** Quyền thật trên một mảng sau khi tính cả chức vụ: thực tập sinh bị hạ xuống chỉ xem. */
export function quyenSauChucVu(q: Quyen | undefined, chucDanh: string | null | undefined): Quyen | null {
  if (!q) return null;
  return q === "nhap" && laThucTapSinh(chucDanh) ? "xem" : q;
}

/** Đường dẫn /hr/<ma> → mã sổ; đường dẫn khác (vd /ton-kho) → null. */
export const maSoTuDuongDan = (duongDan: string) => (duongDan.startsWith("/hr/") ? duongDan.slice(4).split("/")[0] : null);
