/** Các loại đơn và quy tắc dùng chung cho form (client) và Server Action. */
export const LOAI_DON = [
  "Đi trễ",
  "Về sớm",
  "Nghỉ phép năm",
  "Nghỉ không lương",
  "Nghỉ ốm",
  "Nghỉ chế độ",
  "Giải trình công",
  "Làm remote",
  "Công tác",
  "Chấm công ngoài công ty",
  "Tạm ứng lương",
] as const;
export type LoaiDon = (typeof LOAI_DON)[number];

/** Loại đơn gắn với việc chấm công — người không phải chấm công (Tổng giám đốc, Giám đốc, Kỹ thuật) không nộp loại này. */
export const LOAI_DON_CHAM_CONG: readonly LoaiDon[] = ["Đi trễ", "Về sớm", "Giải trình công", "Chấm công ngoài công ty"];

/** Mỗi người 12 ngày phép năm trong một năm dương lịch. */
export const PHEP_NAM_MOI_NAM = 12;

/** Số ngày nghỉ tính phép: mọi ngày từ `tu` đến `den` (gồm hai đầu), TRỪ Chủ nhật (công ty làm thứ Hai–thứ Bảy, 24 công/tháng). */
export function demNgayPhep(tu: string, den: string) {
  let dem = 0;
  for (let t = Date.parse(`${tu}T00:00:00Z`); t <= Date.parse(`${den}T00:00:00Z`); t += 864e5) if (new Date(t).getUTCDay() !== 0) dem++;
  return dem;
}

/** Các loại đơn một người được nộp. */
export const loaiDonChoPhep = (canChamCong: boolean) => LOAI_DON.filter((l) => canChamCong || !LOAI_DON_CHAM_CONG.includes(l));

/** Ca hành chính đã quy định: giải trình công được duyệt thì giờ chấm công của ngày đó trở về đúng ca này. */
export const CA_VAO = "08:30:00";
export const CA_RA = "17:30:00";
/** Một đơn giải trình công chỉ trải tối đa chừng này ngày (tránh sửa hàng loạt ngoài ý muốn). */
export const GIAI_TRINH_TOI_DA_NGAY = 31;

/** Các ngày làm việc (bỏ Chủ nhật) từ `tu` đến `den`, không quá `toiDa` (hôm nay HCM). */
export function ngayLamViec(tu: string, den: string, toiDa: string) {
  const ra: string[] = [];
  for (let t = Date.parse(`${tu}T00:00:00Z`); t <= Date.parse(`${den}T00:00:00Z`); t += 864e5) {
    const iso = new Date(t).toISOString().slice(0, 10);
    if (new Date(t).getUTCDay() !== 0 && iso <= toiDa) ra.push(iso);
  }
  return ra;
}
