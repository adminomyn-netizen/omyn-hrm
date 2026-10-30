/** Nghỉ việc và bàn giao: checklist mẫu, điều kiện đóng hồ sơ, cảnh báo thời hạn báo trước. Mọi thời hạn theo Bộ luật Lao động 2019,
 * ghi như trang hrm.vieclamngay.vn đang dùng — "chờ kế toán/luật sư xác nhận", không tự khẳng định. */
export const CHO_XAC_NHAN = "chờ kế toán/luật sư xác nhận";

export type MucMau = { nhom: string; ten: string; batBuoc: boolean };

export const NHOM_BAN_GIAO = {
  congViec: "Bàn giao công việc",
  taiSan: "Bàn giao tài sản",
  taiChinh: "Bàn giao nghĩa vụ tài chính",
} as const;

/** Checklist mặc định khi mở hồ sơ nghỉ việc (người phụ trách sửa/thêm được sau). */
export const CHECKLIST_MAU: readonly MucMau[] = [
  { nhom: NHOM_BAN_GIAO.congViec, ten: "Bàn giao công việc đang làm cho người nhận", batBuoc: true },
  { nhom: NHOM_BAN_GIAO.congViec, ten: "Bàn giao tài liệu, dữ liệu và tài khoản hệ thống", batBuoc: true },
  { nhom: NHOM_BAN_GIAO.taiSan, ten: "Trả đủ tài sản công ty đã cấp", batBuoc: true },
  { nhom: NHOM_BAN_GIAO.taiChinh, ten: "Quyết toán tạm ứng và công nợ với công ty", batBuoc: true },
  { nhom: "Chốt công", ten: "Chốt chấm công đến ngày làm việc cuối cùng", batBuoc: true },
  { nhom: "Chốt lương", ten: `Quyết toán lương, phép còn lại và khoản phải trả (thời hạn thanh toán ${CHO_XAC_NHAN})`, batBuoc: true },
  { nhom: "Chốt BHXH", ten: `Báo giảm lao động và chốt sổ BHXH (thời hạn báo ${CHO_XAC_NHAN})`, batBuoc: true },
  { nhom: "Chấm dứt hợp đồng", ten: "Ký quyết định hoặc biên bản chấm dứt hợp đồng lao động", batBuoc: true },
];

export type MucHoSo = { nhom: string; ten: string; batBuoc: boolean; xong: boolean };
export type HoSoNghi = { pvTrangThai: string; pvNgay: string | null; pvLyDoThat: string | null };

/** Việc còn thiếu trước khi được đóng hồ sơ; rỗng = đóng được. Tài sản còn "Đang giữ" luôn chặn dù checklist đã tick. */
export function dieuKienDongHoSo(h: HoSoNghi, muc: readonly MucHoSo[], taiSanDangGiu: number): string[] {
  const thieu: string[] = [];
  for (const m of muc) if (m.batBuoc && !m.xong) thieu.push(`${m.nhom}: ${m.ten}`);
  if (taiSanDangGiu > 0) thieu.push(`Bàn giao tài sản: còn ${taiSanDangGiu} tài sản đang giữ, chưa trả`);
  if (h.pvTrangThai === "Chưa phỏng vấn") thieu.push("Phỏng vấn thôi việc: chưa thực hiện (hoặc ghi nhận người nghỉ từ chối phỏng vấn)");
  else if (h.pvTrangThai === "Đã phỏng vấn" && (!h.pvNgay || !(h.pvLyDoThat ?? "").trim())) thieu.push("Phỏng vấn thôi việc: thiếu ngày phỏng vấn hoặc lý do thật");
  return thieu;
}

/** Số ngày báo trước theo loại hợp đồng (Điều 35 BLLĐ 2019): không xác định thời hạn 45; xác định thời hạn 30 (từ 12 tháng) hoặc 3 (dưới 12 tháng). Thử việc/khác: không áp dụng. */
export function ngayBaoTruoc(loaiHd: string | null | undefined, tuNgay?: string | null, denNgay?: string | null): number | null {
  if (loaiHd === "Không xác định thời hạn") return 45;
  if (loaiHd === "Xác định thời hạn") {
    if (tuNgay && denNgay) {
      const thang = (Date.parse(`${denNgay}T00:00:00Z`) - Date.parse(`${tuNgay}T00:00:00Z`)) / 86_400_000 / 30;
      if (thang < 12) return 3;
    }
    return 30;
  }
  return null;
}

/** Báo trước thiếu bao nhiêu ngày so với quy định (null = đủ hoặc không áp dụng). */
export function baoTruocThieu(ngayNop: string, ngayCuoi: string, can: number | null): number | null {
  if (can === null) return null;
  const co = Math.round((Date.parse(`${ngayCuoi}T00:00:00Z`) - Date.parse(`${ngayNop}T00:00:00Z`)) / 86_400_000);
  return co >= can ? null : can - co;
}
