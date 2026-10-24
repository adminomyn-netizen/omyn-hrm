import { soNgayNghi } from "@/lib/don-tu";

/** Mã công của một ngày trong bảng chấm công tháng (theo phần mềm chấm công mẫu, thêm CĐ và V).
 * X đủ ngày · N nửa ngày · CT công tác · P nghỉ phép năm · L nghỉ lễ · O nghỉ ốm · KP nghỉ không lương · CĐ nghỉ chế độ (thai sản…) · V vắng không đơn · "" không tính (Chủ nhật, chưa đến ngày, chưa vào làm). */
export type MaCong = "X" | "N" | "CT" | "P" | "L" | "O" | "KP" | "CĐ" | "V" | "";

export type OCong = {
  ma: MaCong;
  /** Số công được hưởng lương trong ngày (0 – 1). */
  cong: number;
  /** Phần công làm việc thực tế trong ngày (X, CT, nửa buổi đi làm của ngày nghỉ nửa ngày); ngày nghỉ phép/lễ không tính. */
  congLam: number;
  ghiChu?: string;
};

export type DonDaDuyet = { loai: string; tu_ngay: string; den_ngay: string; gio_tu?: string | null; gio_den?: string | null };

export type DauVaoCongNgay = {
  /** YYYY-MM-DD */
  ngay: string;
  /** Hôm nay theo giờ HCM, YYYY-MM-DD. Ngày sau hôm nay chưa có công. */
  homNay: string;
  laNgayLe: boolean;
  /** Có giờ vào trong chấm công ngày đó. */
  coChamCong: boolean;
  /** Người không phải chấm công (Tổng giám đốc, Giám đốc): ngày làm việc đã qua mặc định đủ công. */
  mienChamCong?: boolean;
  /** Ngày vào làm (YYYY-MM-DD); trước ngày này không tính công. */
  ngayVaoLam?: string | null;
  /** Các đơn ĐÃ DUYỆT của người đó có phủ ngày này. */
  don: DonDaDuyet[];
};

const KHONG: OCong = { ma: "", cong: 0, congLam: 0 };
const NGHI_CO_LUONG = new Set(["Nghỉ phép năm"]);
const LOAI_NGHI = ["Nghỉ phép năm", "Nghỉ không lương", "Nghỉ ốm"] as const;
const MA_NGHI: Record<(typeof LOAI_NGHI)[number], MaCong> = { "Nghỉ phép năm": "P", "Nghỉ không lương": "KP", "Nghỉ ốm": "O" };

/** Mã công + số công của MỘT ngày. Một nơi duy nhất, bảng chấm công tháng và lập bảng lương cùng dùng.
 * Thứ tự ưu tiên: Chủ nhật / chưa vào làm / chưa tới ngày → nghỉ lễ → nghỉ chế độ → nghỉ cả ngày → nghỉ nửa ngày → công tác → remote/ngoài công ty → có chấm công → vắng. */
export function congMotNgay(v: DauVaoCongNgay): OCong {
  const thu = new Date(`${v.ngay}T00:00:00Z`).getUTCDay();
  if (thu === 0) return KHONG;
  if (v.ngayVaoLam && v.ngay < v.ngayVaoLam) return KHONG;
  if (v.laNgayLe) return { ma: "L", cong: 1, congLam: 0, ghiChu: "Nghỉ lễ" };
  if (v.ngay > v.homNay) return KHONG;

  const phuNgay = v.don.filter((d) => d.tu_ngay <= v.ngay && v.ngay <= d.den_ngay);

  if (phuNgay.some((d) => d.loai === "Nghỉ chế độ")) return { ma: "CĐ", cong: 0, congLam: 0, ghiChu: "Nghỉ chế độ" };

  const nghi = phuNgay.filter((d) => (LOAI_NGHI as readonly string[]).includes(d.loai));
  // Đơn nghỉ cả ngày (không khai giờ, hoặc theo giờ nhưng quá 4 tiếng = tính một ngày).
  const caNgay = nghi.find((d) => soNgayNghi(d.tu_ngay, d.den_ngay, d.gio_tu, d.gio_den) >= 1 || (!d.gio_tu && !d.gio_den));
  if (caNgay) {
    const ma = MA_NGHI[caNgay.loai as (typeof LOAI_NGHI)[number]];
    return { ma, cong: NGHI_CO_LUONG.has(caNgay.loai) ? 1 : 0, congLam: 0, ghiChu: caNgay.loai };
  }
  // Nghỉ nửa ngày: nửa nghỉ (phép thì có lương) + nửa còn lại chỉ tính khi có đi làm (có chấm công, hoặc miễn chấm công).
  const nuaNgay = nghi.find((d) => soNgayNghi(d.tu_ngay, d.den_ngay, d.gio_tu, d.gio_den) === 0.5);
  if (nuaNgay) {
    const diLam = v.coChamCong || !!v.mienChamCong;
    return { ma: "N", cong: (NGHI_CO_LUONG.has(nuaNgay.loai) ? 0.5 : 0) + (diLam ? 0.5 : 0), congLam: diLam ? 0.5 : 0, ghiChu: `${nuaNgay.loai} nửa ngày` };
  }

  if (phuNgay.some((d) => d.loai === "Công tác")) return { ma: "CT", cong: 1, congLam: 1, ghiChu: "Công tác" };
  const lamNgoai = phuNgay.find((d) => d.loai === "Làm remote" || d.loai === "Chấm công ngoài công ty");
  if (lamNgoai) return { ma: "X", cong: 1, congLam: 1, ghiChu: lamNgoai.loai };
  if (v.coChamCong) return { ma: "X", cong: 1, congLam: 1 };
  if (v.mienChamCong) return { ma: "X", cong: 1, congLam: 1, ghiChu: "Miễn chấm công" };
  // Hôm nay chưa chấm công thì chưa kết luận vắng (người đó còn có thể vào làm).
  if (v.ngay === v.homNay) return KHONG;
  return { ma: "V", cong: 0, congLam: 0, ghiChu: "Vắng, không có đơn" };
}

export type TongHopCong = Record<Exclude<MaCong, "">, number> & { congHuong: number; congLam: number };

/** Gộp các ô công của một tháng. `N` đếm số ngày nghỉ nửa ngày; `congHuong` là tổng công hưởng lương. */
export function tongHopCong(o: OCong[]): TongHopCong {
  const t: TongHopCong = { X: 0, N: 0, CT: 0, P: 0, L: 0, O: 0, KP: 0, CĐ: 0, V: 0, congHuong: 0, congLam: 0 };
  for (const c of o) {
    if (c.ma) t[c.ma]++;
    t.congHuong += c.cong;
    t.congLam += c.congLam;
  }
  return t;
}

/** Số ngày của tháng (1–12). */
export const soNgayCuaThang = (nam: number, thang: number) => new Date(Date.UTC(nam, thang, 0)).getUTCDate();
export const ngayIso = (nam: number, thang: number, ngay: number) => `${nam}-${String(thang).padStart(2, "0")}-${String(ngay).padStart(2, "0")}`;

/** Các mã dùng ở chú thích: mã, tên, có tính lương không. */
export const CHU_THICH_CONG: { ma: Exclude<MaCong, "">; ten: string; coLuong: string }[] = [
  { ma: "X", ten: "Đi làm đủ ngày (gồm remote / chấm công ngoài công ty đã duyệt)", coLuong: "Có lương" },
  { ma: "N", ten: "Nghỉ nửa ngày (một buổi hoặc ≤ 4 tiếng)", coLuong: "Nửa ngày làm; nửa nghỉ có lương nếu là phép năm" },
  { ma: "CT", ten: "Công tác (đơn đã duyệt)", coLuong: "Có lương" },
  { ma: "P", ten: "Nghỉ phép năm", coLuong: "Có lương" },
  { ma: "L", ten: "Nghỉ lễ", coLuong: "Có lương" },
  { ma: "O", ten: "Nghỉ ốm", coLuong: "Không lương công ty (BHXH chi trả nếu đủ điều kiện)" },
  { ma: "KP", ten: "Nghỉ không lương", coLuong: "Không lương" },
  { ma: "CĐ", ten: "Nghỉ chế độ (thai sản…)", coLuong: "Không lương công ty (BHXH chi trả)" },
  { ma: "V", ten: "Vắng, không có đơn", coLuong: "Không lương" },
];
