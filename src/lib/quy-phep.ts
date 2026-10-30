/** Quỹ phép năm: 12 ngày/năm, cứ đủ 5 năm làm việc thêm 1 ngày (Điều 113-114 BLLĐ 2019) — mốc này chờ kế toán/luật sư xác nhận.
 * Chỉ CỘNG thêm theo thâm niên, không cắt theo tỷ lệ tháng làm việc để không chặn nhầm người đang có đơn nghỉ. */
export const PHEP_CO_BAN = 12;
export const NAM_MOI_NGAY_THEM = 5;
export const GHI_CHU_QUY_PHEP = "Mỗi 5 năm làm việc tăng thêm 1 ngày phép (chờ kế toán/luật sư xác nhận).";

/** Số năm làm việc tròn tính tới 31/12 của `nam`. Không có ngày vào làm → 0. */
export function namLamViecDen(ngayVao: string | null | undefined, nam: number): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngayVao ?? "");
  if (!m) return 0;
  return Math.max(0, nam - Number(m[1])); // tính theo năm lịch: vào làm bất kỳ ngày nào của năm X thì tới 31/12 năm X+5 là đủ 5 năm
}

export function phepNamDuoc(ngayVao: string | null | undefined, nam: number): number {
  return PHEP_CO_BAN + Math.floor(namLamViecDen(ngayVao, nam) / NAM_MOI_NGAY_THEM);
}
