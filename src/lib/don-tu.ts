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
export const CA_VAO = "08:00:00";
export const CA_RA = "17:00:00";
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

/** Giờ vào sau mốc này bị ghi "Đi muộn" khi chấm công (cùng mốc ở Chấm công). */
export const GIO_COI_LA_DI_MUON = "08:15:00";
/** Giờ ra sau mốc này (quá cuối ca 1 tiếng) là check out muộn cần giải trình. */
export const NGUONG_RA_MUON = "18:00:00";

export type SaiPham = { ma: "vao_tre" | "ra_som" | "ra_muon" | "chua_ra"; nhan: string };
const hhmmss = (g: string | null | undefined) => (g ? (g.length === 5 ? `${g}:00` : g.slice(0, 8)) : null);

/** Sai phạm chấm công của MỘT ngày: vào trễ, check out sớm hơn cuối ca, check out muộn quá 1 tiếng, hoặc chưa check out (ngày đã qua). */
export function phatHienSaiPham(c: { gio_vao: string | null; gio_ra: string | null }, ngay: string, homNay: string): SaiPham[] {
  const vao = hhmmss(c.gio_vao);
  const ra = hhmmss(c.gio_ra);
  const ds: SaiPham[] = [];
  if (vao && vao > GIO_COI_LA_DI_MUON) ds.push({ ma: "vao_tre", nhan: "Vào trễ" });
  if (ra && ra < CA_RA) ds.push({ ma: "ra_som", nhan: "Check out sớm" });
  if (ra && ra > NGUONG_RA_MUON) ds.push({ ma: "ra_muon", nhan: "Check out muộn quá 1 tiếng" });
  if (!ra && ngay < homNay) ds.push({ ma: "chua_ra", nhan: "Chưa check out" });
  return ds;
}

/** Các loại nghỉ cho phép chọn một buổi / theo khoảng giờ trong ngày. */
export const LOAI_NGHI_THEO_GIO: readonly LoiDonNghi[] = ["Nghỉ phép năm", "Nghỉ không lương", "Nghỉ ốm"];
type LoiDonNghi = "Nghỉ phép năm" | "Nghỉ không lương" | "Nghỉ ốm";

const phut = (g: string) => Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5));
/** Số ngày nghỉ của một đơn: theo giờ thì tối đa 4 tiếng tính nửa ngày, lâu hơn tính một ngày; không theo giờ thì đếm ngày (trừ Chủ nhật). */
export function soNgayNghi(tu: string, den: string, gioTu?: string | null, gioDen?: string | null) {
  if (gioTu && gioDen) {
    if (new Date(`${tu}T00:00:00Z`).getUTCDay() === 0) return 0;
    return phut(gioDen) - phut(gioTu) <= 240 ? 0.5 : 1;
  }
  return demNgayPhep(tu, den);
}

/** Dạng chữ của khoảng giờ "HH:MM" từ giá trị time của DB. */
export const gioNgan = (g: string | null | undefined) => (g ? g.slice(0, 5) : "");
