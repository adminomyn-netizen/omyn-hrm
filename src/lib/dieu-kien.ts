// Điều kiện rẽ nhánh của luồng duyệt (chép từ nhánh có điều kiện của Lark). Hàm thuần, dùng cả máy chủ và giao diện.
import type { DuLieu } from "./phe-duyet";

export type ToanTu = "la" | "khac" | ">=" | ">" | "<" | "<=";
export type DieuKien =
  | { t: string; s: ToanTu; v: (string | number)[] }
  | { and: DieuKien[] }
  | { or: DieuKien[] }
  | { khong: DieuKien };

const laSo = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const chuanChu = (x: unknown) => String(x ?? "").trim().toLowerCase();
const bang = (g: unknown, x: unknown) => (laSo(g) && laSo(x) ? g === x : chuanChu(g) === chuanChu(x));

/** Điều kiện có đúng với dữ liệu phiếu không. Ô chưa có giá trị thì mọi so sánh đều sai (riêng "khác" thì đúng). */
export function danhGiaDieuKien(dk: DieuKien | null | undefined, du: DuLieu): boolean {
  if (!dk) return true;
  if ("and" in dk) return dk.and.every((x) => danhGiaDieuKien(x, du));
  if ("or" in dk) return dk.or.some((x) => danhGiaDieuKien(x, du));
  if ("khong" in dk) return !danhGiaDieuKien(dk.khong, du);
  const g = du[dk.t];
  switch (dk.s) {
    case "la": return dk.v.some((x) => bang(g, x));
    case "khac": return !dk.v.some((x) => bang(g, x));
    default: {
      const so = dk.v[0];
      if (!laSo(g) || !laSo(so)) return false;
      return dk.s === ">=" ? g >= so : dk.s === ">" ? g > so : dk.s === "<" ? g < so : g <= so;
    }
  }
}

/** Đọc một giá trị jsonb lấy từ DB thành điều kiện hợp lệ (sai dạng thì bỏ, không làm hỏng luồng). */
export function docDieuKien(x: unknown): DieuKien | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (Array.isArray(o.and)) { const a = o.and.map(docDieuKien); return a.every(Boolean) ? { and: a as DieuKien[] } : null; }
  if (Array.isArray(o.or)) { const a = o.or.map(docDieuKien); return a.every(Boolean) ? { or: a as DieuKien[] } : null; }
  if (o.khong) { const k = docDieuKien(o.khong); return k ? { khong: k } : null; }
  if (typeof o.t === "string" && typeof o.s === "string" && Array.isArray(o.v) && ["la", "khac", ">=", ">", "<", "<="].includes(o.s)) return { t: o.t, s: o.s as ToanTu, v: o.v as (string | number)[] };
  return null;
}

/** Khoá đặc biệt: tên khối/đơn vị của người nộp phiếu (máy chủ điền lúc nộp; điều kiện "Requester belongs to …" của Lark). */
export const KHOA_DON_VI_NGUOI_NOP = "@don_vi_nguoi_nop";
export const KHOA_CHUC_DANH_NGUOI_NOP = "@chuc_danh_nguoi_nop";
/** Cấp của người nộp trong chuỗi quản lý: 0 = cao nhất (không có quản lý), 1 = dưới 1 cấp… */
export const KHOA_CAP_NGUOI_NOP = "@cap_nguoi_nop";
/** Số ngày nghỉ theo lịch, tính cả ngày đầu và ngày cuối (phiếu đăng ký vắng mặt). */
export const KHOA_SO_NGAY_NGHI = "@so_ngay_nghi";

const NHAN_KHOA: Record<string, string> = { [KHOA_CHUC_DANH_NGUOI_NOP]: "Người nộp là", [KHOA_CAP_NGUOI_NOP]: "Cấp người nộp (0 = cao nhất)", [KHOA_SO_NGAY_NGHI]: "Số ngày nghỉ" };

/** Các khoá đặc biệt (không phải ô của phiếu) để đánh giá điều kiện: máy chủ điền lúc nộp từ hồ sơ người nộp và dữ liệu phiếu. */
export function khoaDacBiet(
  du: Record<string, unknown>,
  nguoiNop: { id: string; chucDanh: string | null; quanLyId: string | null } | null,
  tatCa: readonly { id: string; quanLyId: string | null }[],
  tenKhoi: string,
): Record<string, unknown> {
  let cap = 0;
  const theo = new Map(tatCa.map((n) => [n.id, n]));
  const thay = new Set<string>();
  for (let q = nguoiNop?.quanLyId ?? null; q && theo.has(q) && !thay.has(q) && cap < 20; q = theo.get(q)!.quanLyId) { thay.add(q); cap++; }
  const ngay = (x: unknown) => (typeof x === "string" && /^\d{4}-\d{2}-\d{2}/.test(x) ? Date.parse(x.slice(0, 10) + "T00:00:00Z") : NaN);
  const tu = ngay(du.nghi_tu), den = ngay(du.nghi_den);
  const ra: Record<string, unknown> = {
    [KHOA_DON_VI_NGUOI_NOP]: tenKhoi,
    [KHOA_CHUC_DANH_NGUOI_NOP]: nguoiNop?.chucDanh ?? "",
    [KHOA_CAP_NGUOI_NOP]: cap,
  };
  if (Number.isFinite(tu) && Number.isFinite(den) && den >= tu) ra[KHOA_SO_NGAY_NGHI] = Math.round((den - tu) / 86_400_000) + 1;
  return ra;
}

const TEN_TOAN_TU: Record<ToanTu, string> = { la: "là", khac: "khác", ">=": "từ", ">": "lớn hơn", "<": "nhỏ hơn", "<=": "tối đa" };

/** Mô tả điều kiện bằng tiếng Việt cho màn cấu hình ("Đơn vị làm việc là AVI và Số tiền từ 10.000.000 đ"). `ten` đổi mã ô thành tên ô. */
export function moTaDieuKien(dk: DieuKien | null | undefined, ten: (ma: string) => string = (m) => m): string {
  if (!dk) return "";
  if ("and" in dk) return dk.and.map((x) => moTaDieuKien(x, ten)).filter(Boolean).join(" và ");
  if ("or" in dk) return "(" + dk.or.map((x) => moTaDieuKien(x, ten)).join(" hoặc ") + ")";
  if ("khong" in dk) return "không (" + moTaDieuKien(dk.khong, ten) + ")";
  const gt = dk.v.map((x) => (typeof x === "number" ? x.toLocaleString("vi-VN") + " đ" : String(x))).join(" hoặc ");
  if (dk.t === KHOA_DON_VI_NGUOI_NOP) return `Người nộp ${dk.s === "khac" ? "không thuộc" : "thuộc"} ${gt}`;
  const gtSo = dk.v.map((x) => String(x)).join(" hoặc ");
  if (NHAN_KHOA[dk.t]) return `${NHAN_KHOA[dk.t]} ${TEN_TOAN_TU[dk.s]} ${dk.t === KHOA_SO_NGAY_NGHI || dk.t === KHOA_CAP_NGUOI_NOP ? gtSo : gt}`;
  return `${ten(dk.t)} ${TEN_TOAN_TU[dk.s]} ${gt}`;
}
