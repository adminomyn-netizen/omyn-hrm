/** Tăng ca: tách khoảng thời gian thành từng ngày + loại ngày (thường / nghỉ tuần / lễ) và kiểm giới hạn giờ.
 * Công ty làm thứ Hai–thứ Bảy, Chủ nhật là ngày nghỉ tuần (cùng quy ước demNgayPhep). Giới hạn lấy từ tham_so_luong, chờ kế toán/luật sư xác nhận. */

export type LoaiNgayTangCa = "Ngày thường" | "Ngày nghỉ tuần" | "Ngày lễ";
export type DoanTangCa = { ngay: string; soGio: number; loaiNgay: LoaiNgayTangCa };

const MS_PHUT = 60_000;
const phut = (iso: string) => Date.parse(`${iso}:00Z`) / MS_PHUT; // "YYYY-MM-DDTHH:mm" coi như giờ địa phương, chỉ để trừ nhau

export function loaiNgay(ngay: string, ngayLe: ReadonlySet<string>): LoaiNgayTangCa {
  if (ngayLe.has(ngay)) return "Ngày lễ";
  return new Date(`${ngay}T00:00:00Z`).getUTCDay() === 0 ? "Ngày nghỉ tuần" : "Ngày thường";
}

/** Tách [tu, den] (YYYY-MM-DDTHH:mm) qua nửa đêm thành từng ngày; làm tròn giờ về 0,5. Không hợp lệ (den <= tu) → []. */
export function tachTangCa(tu: string, den: string, ngayLe: ReadonlySet<string>): DoanTangCa[] {
  const a = phut(tu), b = phut(den);
  if (!(b > a)) return [];
  const ra: DoanTangCa[] = [];
  let cur = a;
  while (cur < b) {
    const ngay = new Date(cur * MS_PHUT).toISOString().slice(0, 10);
    const nuaDem = Date.parse(`${ngay}T00:00:00Z`) / MS_PHUT + 1440;
    const het = Math.min(b, nuaDem);
    const gio = Math.round(((het - cur) / 60) * 2) / 2;
    if (gio > 0) ra.push({ ngay, soGio: gio, loaiNgay: loaiNgay(ngay, ngayLe) });
    cur = het;
  }
  return ra;
}

export type GioiHanTangCa = { thang: number; nam: number; ngayTong: number };
export const GIOI_HAN_MAC_DINH: GioiHanTangCa = { thang: 40, nam: 200, ngayTong: 12 };
export type GioDaCo = { thang: Readonly<Record<string, number>>; nam: number; theoNgay: Readonly<Record<string, number>> };

/** Giờ tăng ca mới có làm vượt giới hạn không. `gioChuanNgay`: giờ làm bình thường mỗi ngày (mặc định 8) để kiểm tổng giờ/ngày. */
export function viPhamGioiHan(moi: readonly DoanTangCa[], co: GioDaCo, gh: GioiHanTangCa, gioChuanNgay = 8): string[] {
  const loi: string[] = [];
  const thangThem: Record<string, number> = {};
  let namThem = 0;
  for (const d of moi) {
    const t = d.ngay.slice(0, 7);
    thangThem[t] = (thangThem[t] ?? 0) + d.soGio;
    namThem += d.soGio;
    const trongNgay = (co.theoNgay[d.ngay] ?? 0) + d.soGio;
    // ngày nghỉ tuần/lễ không có giờ làm chuẩn nên chỉ tính giờ tăng ca
    const tong = (d.loaiNgay === "Ngày thường" ? gioChuanNgay : 0) + trongNgay;
    if (tong > gh.ngayTong) loi.push(`Ngày ${d.ngay.split("-").reverse().join("/")}: tổng giờ làm và tăng ca ${tong} giờ, vượt ${gh.ngayTong} giờ/ngày.`);
  }
  for (const [t, them] of Object.entries(thangThem)) {
    const tong = (co.thang[t] ?? 0) + them;
    if (tong > gh.thang) loi.push(`Tháng ${t.slice(5)}/${t.slice(0, 4)}: tăng ca ${tong} giờ, vượt ${gh.thang} giờ/tháng.`);
  }
  if (co.nam + namThem > gh.nam) loi.push(`Cả năm: tăng ca ${co.nam + namThem} giờ, vượt ${gh.nam} giờ/năm.`);
  return loi;
}

/** Tổng giờ theo loại ngày trong một tháng, để đổ vào bảng lương (gio_ot_thuong / gio_ot_nghi_tuan / gio_ot_le). */
export function tongGioTheoLoai(ds: readonly { so_gio: number | string; loai_ngay: string }[]) {
  const t = { thuong: 0, nghiTuan: 0, le: 0 };
  for (const d of ds) {
    const g = Number(d.so_gio);
    if (d.loai_ngay === "Ngày lễ") t.le += g;
    else if (d.loai_ngay === "Ngày nghỉ tuần") t.nghiTuan += g;
    else t.thuong += g;
  }
  return t;
}
