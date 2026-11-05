/** Bộ phê duyệt chuyển từ Lark: kiểu ô, kiểm tra phiếu, số phiếu, luồng duyệt nhiều bước. Hàm thuần, không đụng DB (xem phe-duyet-data.ts, app/(app)/phe-duyet/actions.ts). */

import { danhGiaDieuKien, type DieuKien } from "./dieu-kien";

export type KieuTruong = "chu" | "nhieu" | "ngay" | "ngay_gio" | "so" | "tien" | "chon" | "dm" | "nv" | "tep" | "bang" | "cong" | "phieu";

export type Truong = {
  ma: string;
  ten: string;
  kieu: KieuTruong;
  batBuoc?: boolean;
  /** kieu "chon": lựa chọn cố định lấy từ Lark. */
  luaChon?: readonly string[];
  /** kieu "dm": loại danh mục trong pd_danh_muc (sửa được trong app). Danh mục còn trống thì nhập chữ tự do. */
  danhMuc?: string;
  /** kieu "nv": chọn được nhiều người. */
  nhieu?: boolean;
  /** Chỉ hiện (và chỉ bắt buộc) khi ô `truong` đang mang một trong các giá trị `la`. */
  hien?: { truong: string; la: readonly string[] };
  /** kieu "bang": các cột của mỗi dòng. */
  con?: readonly Truong[];
  /** kieu "cong": tổng cột `cot` của bảng `bang` (tự tính, không cho nhập). */
  tong?: { bang: string; cot: string };
  /** kieu "tien": tự tính = max(0, ô `tu` − ô `tru`), không cho nhập (vd tiền thừa/thiếu khi hoàn ứng). */
  hieu?: { tu: string; tru: string };
  /** kieu "so": tự tính số giờ giữa hai ô ngày giờ (`tu` → `den`), làm tròn 2 số lẻ, không cho nhập (vd khoảng thời gian làm thêm giờ). */
  soGio?: { tu: string; den: string };
  /** kieu "chu": tự điền số tiền bằng chữ từ ô tiền `tien` (tự tính ở máy chủ). */
  bangChuTu?: string;
  /** Ô ngày/giờ này không được trước ô `khongTruoc`. */
  khongTruoc?: string;
  /** kieu "phieu": chỉ nối tới phiếu thuộc các loại này. */
  loaiPhieuNoi?: readonly string[];
  goiY?: string;
  /** Ghi chú về chỗ em suy ra thay Lark (hiện ở trang cấu hình). */
  suyRa?: string;
};

export type MauPhieu = {
  ma: string;
  ten: string;
  moTa: string;
  nhomMacDinh: string;
  /** Mã biểu mẫu gốc trong Lark + chuỗi kiểu các bước (AND/OR/CC), chỉ để đối chiếu khi cấu hình ma trận người duyệt. */
  lark: { ma: string; buoc: string };
  truong: readonly Truong[];
};

export type DuLieu = Record<string, unknown>;

/** Kiểm tra chéo giữa các ô theo mã phiếu (hàm không đi qua được ranh giới máy chủ → giao diện nên không để trong mẫu). Trả lỗi theo mã ô. */
const KIEM_CHEO: Record<string, (sach: DuLieu) => Record<string, string>> = {
  "de-nghi-hoan-ung": (d): Record<string, string> => {
    const a = d.da_tam_ung, b = d.thuc_te_chi;
    if (typeof a !== "number" || typeof b !== "number") return {};
    if (d.can_thanh_toan_them === "Có" && b <= a) return { can_thanh_toan_them: "Chi thực tế không lớn hơn số đã tạm ứng nên không có khoản thiếu. Hãy chọn “Không”." };
    if (d.can_thanh_toan_them === "Không" && b > a) return { can_thanh_toan_them: "Chi thực tế lớn hơn số đã tạm ứng, còn thiếu. Hãy chọn “Có” để xin thanh toán bổ sung." };
    return {};
  },
};

/** Giá trị ô tự tính theo hiệu hai ô tiền; thiếu một trong hai ô thì chưa tính được. */
export function giaTriHieu(t: Truong, du: DuLieu): number | undefined {
  if (!t.hieu) return undefined;
  const a = du[t.hieu.tu], b = du[t.hieu.tru];
  if (typeof a !== "number" || typeof b !== "number") return undefined;
  return Math.max(0, a - b);
}

/** Số giờ giữa hai ô ngày giờ dạng "2026-11-05T08:00"; thiếu một ô, sai dạng hoặc đến trước từ thì chưa tính được. */
export function giaTriSoGio(t: Truong, du: DuLieu): number | undefined {
  if (!t.soGio) return undefined;
  const a = du[t.soGio.tu], b = du[t.soGio.den];
  const doc = (x: unknown) => (typeof x === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(x) ? Date.parse(`${x.slice(0, 16)}:00Z`) : NaN);
  const ms = doc(b) - doc(a);
  if (!Number.isFinite(ms) || ms < 0) return undefined;
  return Math.round((ms / 3600000) * 100) / 100;
}

// ---------------------------------------------------------------- số phiếu

export const NHOM_MA_MAC_DINH = ["HR", "FIN", "MKT", "ADM"] as const;

/** "2026-10-30" → "2610" (năm 2 số + tháng 2 số). */
export function thangMa(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(ngay);
  if (!m) throw new Error("Ngày không hợp lệ");
  return m[1].slice(2) + m[2];
}

export const soPhieuText = (nhom: string, ngay: string, so: number) => `${nhom}-${thangMa(ngay)}-${String(so).padStart(4, "0")}`;

/** Người dùng gõ vào ô tìm kiếm có phải (một phần) số phiếu không: "HR-2610-0001", "hr-2610", "fin-2610-12". */
export function laSoPhieu(q: string): boolean {
  return /^[a-z]{2,6}-\d{4}(-\d{1,4})?$/i.test(q.trim());
}

// ---------------------------------------------------------------- tiền bằng chữ

const CH = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function docBaSo(n: number, daiTruoc: boolean): string {
  const tram = Math.floor(n / 100), chuc = Math.floor((n % 100) / 10), dv = n % 10;
  const p: string[] = [];
  if (tram > 0 || daiTruoc) p.push(CH[tram], "trăm");
  if (chuc > 1) p.push(CH[chuc], "mươi");
  else if (chuc === 1) p.push("mười");
  else if (dv > 0 && (tram > 0 || daiTruoc)) p.push("lẻ");
  if (dv > 0) p.push(dv === 1 && chuc > 1 ? "mốt" : dv === 5 && chuc > 0 ? "lăm" : dv === 4 && chuc > 1 ? "tư" : CH[dv]);
  return p.join(" ");
}

/** 1500000 → "Một triệu năm trăm nghìn đồng". Không phải số nguyên không âm → "". */
export function tienBangChu(so: number): string {
  if (!Number.isInteger(so) || so < 0 || so > 9_999_999_999_999_999) return "";
  if (so === 0) return "Không đồng";
  const donVi = ["", " nghìn", " triệu", " tỷ"];
  const doc = (n: number): string => {
    if (n >= 1e9) {
      const ty = Math.floor(n / 1e9), du = n % 1e9;
      return `${doc(ty)} tỷ${du ? " " + doc(du) : ""}`;
    }
    const nhom = [n % 1000, Math.floor(n / 1000) % 1000, Math.floor(n / 1e6) % 1000];
    const dau = nhom.findLastIndex((g) => g > 0);
    const out: string[] = [];
    for (let i = dau; i >= 0; i--) if (nhom[i] > 0) out.push(docBaSo(nhom[i], i !== dau) + donVi[i]);
    return out.join(" ");
  };
  const s = doc(so) + " đồng";
  return s[0].toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------- kiểm tra phiếu

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NGAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const NGAY_GIO = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d$/;

function ngayHopLe(y: number, m: number, d: number) {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Ô có đang hiện với dữ liệu hiện tại không (ô cha ẩn thì ô con cũng ẩn do chỉ xét cùng mức). */
export function truongDangHien(t: Truong, du: DuLieu): boolean {
  if (!t.hien) return true;
  const v = du[t.hien.truong];
  return typeof v === "string" && t.hien.la.includes(v);
}

export type NguCanhKiemTra = {
  danhMuc: Readonly<Record<string, readonly string[]>>;
  /** Số tệp đã đính kèm theo mã ô tệp. */
  soTep: Readonly<Record<string, number>>;
};

export type KetQuaKiemTra = { loi: Record<string, string>; sach: DuLieu };

function kiemMotO(t: Truong, tho: unknown, khoa: string, du: DuLieu, ctx: NguCanhKiemTra, loi: Record<string, string>): unknown {
  const trong = tho === undefined || tho === null || (typeof tho === "string" && tho.trim() === "") || (Array.isArray(tho) && tho.length === 0);
  const baoBat = () => { if (t.batBuoc) loi[khoa] = `Cần nhập “${t.ten}”.`; return undefined; };
  switch (t.kieu) {
    case "chu":
    case "nhieu": {
      if (trong) return baoBat();
      const s = String(tho).trim();
      if (s.length > (t.kieu === "chu" ? 300 : 4000)) { loi[khoa] = `“${t.ten}” quá dài.`; return undefined; }
      return s;
    }
    case "ngay": {
      if (trong) return baoBat();
      const m = NGAY.exec(String(tho));
      if (!m || !ngayHopLe(+m[1], +m[2], +m[3])) { loi[khoa] = `“${t.ten}” không phải ngày hợp lệ.`; return undefined; }
      return String(tho);
    }
    case "ngay_gio": {
      if (trong) return baoBat();
      const m = NGAY_GIO.exec(String(tho));
      if (!m || !ngayHopLe(+m[1], +m[2], +m[3])) { loi[khoa] = `“${t.ten}” không phải ngày giờ hợp lệ.`; return undefined; }
      return String(tho);
    }
    case "so":
    case "tien": {
      if (trong) return baoBat();
      const n = typeof tho === "number" ? tho : Number(String(tho).replace(/[.,\s]/g, ""));
      const toiDa = t.kieu === "tien" ? 1e13 : 1e6;
      if (!Number.isInteger(n) || n < 0 || n > toiDa) { loi[khoa] = `“${t.ten}” phải là số nguyên từ 0 đến ${toiDa.toLocaleString("vi-VN")}.`; return undefined; }
      return n;
    }
    case "chon": {
      if (trong) return baoBat();
      if (typeof tho !== "string" || !t.luaChon?.includes(tho)) { loi[khoa] = `“${t.ten}”: chọn một mục trong danh sách.`; return undefined; }
      return tho;
    }
    case "dm": {
      if (trong) return baoBat();
      const ds = ctx.danhMuc[t.danhMuc ?? ""] ?? [];
      if (typeof tho !== "string" || tho.length > 200) { loi[khoa] = `“${t.ten}” không hợp lệ.`; return undefined; }
      if (ds.length > 0 && !ds.includes(tho)) { loi[khoa] = `“${t.ten}”: chọn một mục trong danh sách.`; return undefined; }
      return tho;
    }
    case "nv": {
      if (trong) return baoBat();
      const ds = Array.isArray(tho) ? tho : [tho];
      if (!t.nhieu && ds.length > 1) { loi[khoa] = `“${t.ten}” chỉ chọn một người.`; return undefined; }
      if (ds.length > 50 || ds.some((x) => typeof x !== "string" || !UUID.test(x))) { loi[khoa] = `“${t.ten}” không hợp lệ.`; return undefined; }
      return t.nhieu ? [...new Set(ds as string[])] : (ds[0] as string);
    }
    case "phieu": {
      if (trong) return baoBat();
      if (typeof tho !== "string" || !UUID.test(tho)) { loi[khoa] = `“${t.ten}” không hợp lệ.`; return undefined; }
      return tho;
    }
    case "tep": {
      if (t.batBuoc && !(ctx.soTep[t.ma] > 0)) loi[khoa] = `Cần đính kèm “${t.ten}”.`;
      return undefined;
    }
    case "bang": {
      const dong = Array.isArray(tho) ? tho : [];
      if (dong.length === 0) return baoBat();
      if (dong.length > 100) { loi[khoa] = `“${t.ten}” tối đa 100 dòng.`; return undefined; }
      return dong.map((d, i) => {
        const r = (d && typeof d === "object" ? d : {}) as DuLieu;
        const ra: DuLieu = {};
        for (const c of t.con ?? []) {
          if (!truongDangHien(c, r)) continue;
          const v = kiemMotO(c, r[c.ma], `${t.ma}.${i}.${c.ma}`, r, ctx, loi);
          if (v !== undefined) ra[c.ma] = v;
        }
        return ra;
      });
    }
    case "cong":
      return undefined; // tính sau khi đã có bảng
  }
}

/** Kiểm tra và làm sạch dữ liệu một phiếu: chỉ giữ ô đang hiện, ép kiểu, tự tính ô cộng và tiền bằng chữ. */
export function kiemTraPhieu(mau: MauPhieu, du: DuLieu, ctx: NguCanhKiemTra): KetQuaKiemTra {
  const loi: Record<string, string> = {};
  const sach: DuLieu = {};
  const hien = (t: Truong) => truongDangHien(t, du);
  for (const t of mau.truong) {
    if (!hien(t) || t.kieu === "cong" || t.bangChuTu || t.hieu || t.soGio) continue;
    const v = kiemMotO(t, du[t.ma], t.ma, du, ctx, loi);
    if (v !== undefined) sach[t.ma] = v;
  }
  for (const t of mau.truong) {
    if (!hien(t)) continue;
    if (t.kieu === "cong" && t.tong) {
      const dong = (sach[t.tong.bang] as DuLieu[] | undefined) ?? [];
      sach[t.ma] = dong.reduce((s, d) => s + (typeof d[t.tong!.cot] === "number" ? (d[t.tong!.cot] as number) : 0), 0);
    }
    if (t.soGio) {
      const g = giaTriSoGio(t, sach);
      if (g !== undefined) sach[t.ma] = g;
    }
    if (t.hieu) {
      const h = giaTriHieu(t, sach);
      if (h !== undefined) sach[t.ma] = h;
    }
    if (t.bangChuTu) {
      const tien = sach[t.bangChuTu];
      if (typeof tien === "number") sach[t.ma] = tienBangChu(tien);
      else if (t.batBuoc && !loi[t.bangChuTu]) loi[t.ma] = `Cần nhập số tiền để có “${t.ten}”.`;
    }
    if (t.khongTruoc && typeof sach[t.ma] === "string" && typeof sach[t.khongTruoc] === "string" && (sach[t.ma] as string) < (sach[t.khongTruoc] as string)) {
      loi[t.ma] = `“${t.ten}” không được trước “${mau.truong.find((x) => x.ma === t.khongTruoc)?.ten ?? "ô trên"}”.`;
    }
  }
  const cheo = KIEM_CHEO[mau.ma];
  if (cheo) for (const [ma, m] of Object.entries(cheo(sach))) if (!loi[ma]) loi[ma] = m;
  return { loi, sach };
}


// ---------------------------------------------------------------- ghi đè cấu hình ô (màn Setup luồng phiếu)

export type CheDoHien = "Mặc định" | "Luôn hiện" | "Theo điều kiện" | "Ẩn";
export type GhiDeO = { truong: string; batBuoc: "Mặc định" | "Bắt buộc" | "Không bắt buộc"; cheDoHien: CheDoHien; hienTruong: string | null; hienGiaTri: string[] | null };

/** Mẫu phiếu sau khi áp các ghi đè của Kỹ thuật lên từng ô cấp trên cùng. Ẩn = ô không hiện và không bắt buộc. */
export function apDungGhiDe(mau: MauPhieu, ds: readonly GhiDeO[]): MauPhieu {
  if (ds.length === 0) return mau;
  const theo = new Map(ds.map((g) => [g.truong, g]));
  return {
    ...mau,
    truong: mau.truong.map((t) => {
      const g = theo.get(t.ma);
      if (!g) return t;
      const n: Truong = { ...t };
      if (g.batBuoc !== "Mặc định") n.batBuoc = g.batBuoc === "Bắt buộc";
      if (g.cheDoHien === "Luôn hiện") delete n.hien;
      else if (g.cheDoHien === "Ẩn") n.hien = { truong: "__an__", la: [] };
      else if (g.cheDoHien === "Theo điều kiện" && g.hienTruong && g.hienGiaTri?.length) n.hien = { truong: g.hienTruong, la: g.hienGiaTri };
      return n;
    }),
  };
}

/** Ô nào được dùng làm ô điều khiển điều kiện hiện của ô khác: chỉ ô chọn/danh mục cấp trên cùng, không phải chính nó. */
export const oDieuKhienDuoc = (mau: MauPhieu, truong: string) => mau.truong.filter((t) => (t.kieu === "chon" || t.kieu === "dm") && t.ma !== truong);

// ---------------------------------------------------------------- luồng duyệt

export type KieuBuoc = "AND" | "OR" | "CC";
export type LoaiNguoiDuyet = "Quản lý trực tiếp" | "Quản lý cấp trên" | "Chức danh" | "Nhân viên" | "Giám đốc" | "Kỹ thuật" | "Người nộp" | "Người trong phiếu" | "Tự từ chối";

export type HangLuong = {
  buoc: number;
  tenBuoc: string | null;
  kieu: KieuBuoc;
  loaiNguoi: LoaiNguoiDuyet;
  chucDanh: string | null;
  nhanVienId: string | null;
  dieuKienTruong: string | null;
  dieuKienGiaTri: string | null;
  /** Cây điều kiện của nhánh Lark (lồng nhau, so sánh số tiền, hoặc, nhánh còn lại). */
  dieuKien?: DieuKien | null;
};

/** Các hàng của luồng áp dụng cho phiếu này: hàng có điều kiện chỉ giữ khi ô điều kiện đúng giá trị. */
export function hangApDung(luong: readonly HangLuong[], du: DuLieu): HangLuong[] {
  return luong
    .filter((h) => !h.dieuKienTruong || String(du[h.dieuKienTruong] ?? "") === h.dieuKienGiaTri)
    .filter((h) => danhGiaDieuKien(h.dieuKien, du))
    .slice()
    .sort((a, b) => a.buoc - b.buoc);
}

export type NhanSuDuyet = { id: string; userId: string | null; hoTen: string; chucDanh: string | null; quanLyId: string | null; daNghi?: boolean; quyenGiamDoc?: boolean | null };

export type NguCanhNguoiDuyet = {
  nguoiNop: NhanSuDuyet | null;
  tatCa: readonly NhanSuDuyet[];
  giamDoc: readonly NhanSuDuyet[];
  /** Tài khoản Kỹ thuật (không có hồ sơ nhân sự). */
  kyThuat: readonly { userId: string; ten: string }[];
  /** Dữ liệu phiếu đang nộp (cho kiểu "Người trong phiếu": đọc ô nhân sự của phiếu). */
  duLieu?: DuLieu;
};

export type NguoiDuyet = { nhanVienId: string | null; userId: string | null; ten: string };

/** Một hàng luồng → những người duyệt cụ thể (người nộp không tự duyệt phiếu của mình). */
export function giaiNguoiDuyet(h: HangLuong, c: NguCanhNguoiDuyet): NguoiDuyet[] {
  const song = c.tatCa.filter((n) => !n.daNghi && n.userId); // chưa có tài khoản thì không duyệt được
  const theoId = (id: string | null) => song.find((n) => n.id === id);
  const ra: NhanSuDuyet[] = [];
  switch (h.loaiNguoi) {
    case "Quản lý trực tiếp": {
      const q = theoId(c.nguoiNop?.quanLyId ?? null);
      if (q) ra.push(q);
      break;
    }
    case "Quản lý cấp trên": {
      const q = theoId(c.nguoiNop?.quanLyId ?? null);
      const qq = theoId(q?.quanLyId ?? null);
      if (qq) ra.push(qq);
      break;
    }
    case "Chức danh": {
      const cd = (h.chucDanh ?? "").trim().toLowerCase();
      ra.push(...song.filter((n) => (n.chucDanh ?? "").trim().toLowerCase() === cd));
      break;
    }
    case "Nhân viên": {
      const n = theoId(h.nhanVienId);
      if (n) ra.push(n);
      break;
    }
    case "Giám đốc":
      ra.push(...c.giamDoc.filter((n) => !n.daNghi));
      break;
    case "Người nộp": {
      // Người nộp tự nhận bản sao của chính phiếu mình: không bị loại như người duyệt.
      const n = c.nguoiNop && c.tatCa.find((x) => x.id === c.nguoiNop!.id && x.userId);
      return n ? [{ nhanVienId: n.id, userId: n.userId, ten: n.hoTen }] : [];
    }
    case "Người trong phiếu": {
      const v = c.duLieu?.[h.chucDanh ?? ""];
      const ids = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
      for (const id of ids) { const n = theoId(String(id)); if (n) ra.push(n); }
      break;
    }
    case "Kỹ thuật":
      return c.kyThuat.filter((k) => k.userId !== c.nguoiNop?.userId).map((k) => ({ nhanVienId: null, userId: k.userId, ten: k.ten }));
  }
  return ra.filter((n) => n.id !== c.nguoiNop?.id).map((n) => ({ nhanVienId: n.id, userId: n.userId, ten: n.hoTen }));
}

export type TrangThaiO = "Chờ" | "Đã duyệt" | "Từ chối" | "Bỏ qua" | "Đã xem";
export type O = { id: string; buoc: number; kieu: KieuBuoc; nhanVienId: string | null; userId: string | null; ten: string; trangThai: TrangThaiO; tenBuoc?: string | null };
export type TrangThaiPhieu = "Chờ duyệt" | "Cần bổ sung" | "Đã duyệt" | "Từ chối" | "Đã huỷ";

/** Dựng các ô duyệt lúc nộp phiếu. Hàng không có ai để duyệt → ghi 1 ô "Bỏ qua" (không chặn luồng). */
export function dungCacO(hang: readonly HangLuong[], c: NguCanhNguoiDuyet): Omit<O, "id">[] {
  const ra: Omit<O, "id">[] = [];
  for (const h of hang) {
    const ds = giaiNguoiDuyet(h, c);
    if (ds.length === 0) {
      ra.push({ buoc: h.buoc, kieu: h.kieu, nhanVienId: null, userId: null, ten: `(chưa có người: ${h.loaiNguoi}${h.chucDanh ? " " + h.chucDanh : ""})`, trangThai: "Bỏ qua", tenBuoc: h.tenBuoc });
      continue;
    }
    for (const n of ds) ra.push({ buoc: h.buoc, kieu: h.kieu, nhanVienId: n.nhanVienId, userId: n.userId, ten: n.ten, trangThai: "Chờ", tenBuoc: h.tenBuoc });
  }
  return ra;
}

export type KetQuaChuyen = {
  o: O[];
  trangThai: TrangThaiPhieu;
  /** Bước đang chờ duyệt (0 khi đã xong). */
  buocHienTai: number;
  /** Ô cần báo (người duyệt của bước vừa tới; người nhận bản sao). */
  canBao: { cho: O[]; banSao: O[] };
};

const coViec = (o: O) => o.kieu !== "CC" && o.trangThai === "Chờ";

/** Đưa phiếu tới bước kế tiếp còn việc (bỏ qua bước không còn ai duyệt); bản sao (CC) của bước đó được đánh "Đã xem" và báo. */
export function tienToiBuocSau(o0: readonly O[], tuBuoc: number): KetQuaChuyen {
  const o = o0.map((x) => ({ ...x }));
  const cacBuoc = [...new Set(o.map((x) => x.buoc))].sort((a, b) => a - b).filter((b) => b >= tuBuoc);
  const banSao: O[] = [];
  for (const b of cacBuoc) {
    const trongBuoc = o.filter((x) => x.buoc === b);
    for (const x of trongBuoc) if (x.kieu === "CC" && x.trangThai === "Chờ") { x.trangThai = "Đã xem"; banSao.push(x); }
    const cho = trongBuoc.filter(coViec);
    if (cho.length > 0) return { o, trangThai: "Chờ duyệt", buocHienTai: b, canBao: { cho, banSao } };
  }
  return { o, trangThai: "Đã duyệt", buocHienTai: 0, canBao: { cho: [], banSao } };
}

/** Bắt đầu (hoặc nộp lại) phiếu: mọi ô về "Chờ" (trừ ô đã bỏ qua vì không có người) rồi tới bước đầu còn việc. */
export function batDauLuong(o: readonly Omit<O, "id">[] | readonly O[]): KetQuaChuyen {
  const lam = (o as O[]).map((x) => ({ ...x, trangThai: x.trangThai === "Bỏ qua" && x.userId === null && x.nhanVienId === null ? ("Bỏ qua" as const) : ("Chờ" as const) }));
  return tienToiBuocSau(lam, 0);
}

export type HanhDongDuyet = "Duyệt" | "Từ chối" | "Yêu cầu bổ sung";

export type KetQuaXuLy = { loi: string } | (KetQuaChuyen & { loi?: undefined });
export const thanhCong = (r: KetQuaXuLy): r is KetQuaChuyen & { loi?: undefined } => r.loi === undefined;

/** Một người xử lý ô của mình ở bước hiện tại. AND: đủ mọi người mới sang bước sau; OR: một người là đủ; từ chối/yêu cầu bổ sung dừng phiếu. */
export function xuLyO(o0: readonly O[], oId: string, hanhDong: HanhDongDuyet, buocHienTai: number): KetQuaXuLy {
  const o = o0.map((x) => ({ ...x }));
  const x = o.find((y) => y.id === oId);
  if (!x) return { loi: "Không tìm thấy ô duyệt." };
  if (x.kieu === "CC") return { loi: "Bạn chỉ nhận bản sao của phiếu này, không phải duyệt." };
  if (x.trangThai !== "Chờ") return { loi: "Bạn đã xử lý phiếu này rồi." };
  if (x.buoc !== buocHienTai) return { loi: "Phiếu chưa tới bước của bạn." };
  if (hanhDong !== "Duyệt") {
    x.trangThai = hanhDong === "Từ chối" ? "Từ chối" : "Chờ";
    if (hanhDong === "Từ chối") for (const y of o) if (y.id !== x.id && y.trangThai === "Chờ") y.trangThai = "Bỏ qua";
    return { o, trangThai: hanhDong === "Từ chối" ? "Từ chối" : "Cần bổ sung", buocHienTai, canBao: { cho: [], banSao: [] } };
  }
  x.trangThai = "Đã duyệt";
  const cung = o.filter((y) => y.buoc === x.buoc && y.kieu !== "CC");
  if (x.kieu === "OR") for (const y of cung) if (y.trangThai === "Chờ") y.trangThai = "Bỏ qua";
  const conCho = cung.some((y) => y.trangThai === "Chờ");
  if (conCho) return { o, trangThai: "Chờ duyệt", buocHienTai, canBao: { cho: [], banSao: [] } };
  return tienToiBuocSau(o, x.buoc + 1);
}

/** Phiếu này người dùng được làm gì. */
export function quyenTrenPhieu(p: { trangThai: TrangThaiPhieu; nguoiNopId: string | null; buocHienTai: number }, o: readonly O[], nguoi: { nhanVienId: string | null; userId: string }) {
  const oCuaToi = o.filter((x) => x.userId === nguoi.userId || (x.nhanVienId !== null && x.nhanVienId === nguoi.nhanVienId));
  const choToiDuyet = p.trangThai === "Chờ duyệt" ? oCuaToi.find((x) => x.kieu !== "CC" && x.trangThai === "Chờ" && x.buoc === p.buocHienTai) : undefined;
  const laNguoiNop = p.nguoiNopId !== null && p.nguoiNopId === nguoi.nhanVienId;
  return {
    oDuyet: choToiDuyet ?? null,
    suaVaNopLai: laNguoiNop && p.trangThai === "Cần bổ sung",
    huy: laNguoiNop && (p.trangThai === "Chờ duyệt" || p.trangThai === "Cần bổ sung"),
  };
}
