import { nenLaQuanTri } from "@/lib/chuc-danh";

export type DongNhap = { maNhanVien: string; hoTen: string; chucDanh: string; khoiTen: string; email: string; ngayVaoLam: unknown; trangThai: string };
export type DongHopLe = { ma_nhan_vien: string | null; ho_ten: string; chuc_danh: string | null; khoi_id: string; email: string | null; ngay_vao_lam: string; trang_thai: "Đang làm" | "Thử việc" | "Đã nghỉ" };
export type LoiDong = { dong: number; thongBao: string };

/** Bỏ dấu, hạ chữ thường, gộp khoảng trắng — để so tên cột/khối không phụ thuộc cách gõ. */
export const chuanHoa = (s: unknown) =>
  String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();

/** Tên cột (đã chuẩn hoá) → trường. Chấp nhận vài cách gọi quen thuộc. */
export const COT_NHAN_VIEN: Record<string, keyof DongNhap> = {
  "ho va ten": "hoTen", "ho ten": "hoTen",
  "ma nhan vien": "maNhanVien", "ma nv": "maNhanVien",
  "chuc vu": "chucDanh", "chuc danh": "chucDanh",
  "khoi": "khoiTen", "phong ban": "khoiTen", "bo phan": "khoiTen",
  "email": "email",
  "ngay vao lam": "ngayVaoLam",
  "trang thai": "trangThai",
};

/** Ngày từ ô Excel: Date, số seri Excel, "dd/mm/yyyy" hoặc "yyyy-mm-dd" → "yyyy-mm-dd"; không hiểu được thì null. */
export function docNgay(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
  const s = String(v ?? "").trim();
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  let y: number, mo: number, d: number;
  if (m) [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else return null;
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d || y < 1990 || y > 2100) return null;
  return t.toISOString().slice(0, 10);
}

const TRANG_THAI = new Map([["dang lam", "Đang làm"], ["thu viec", "Thử việc"], ["da nghi", "Đã nghỉ"]] as const);

/** Kiểm tra các dòng của tệp (thuần, không đụng DB). `khoi` = danh mục khối; `daCo` = mã NV/email đã có trong DB; `laKyThuat` = người nhập được gán vị trí tự có quyền Quản trị. */
export function kiemTraDongNhap(
  dong: DongNhap[],
  khoi: { id: string; ten: string }[],
  daCo: { ma: Set<string>; email: Set<string> },
  laKyThuat: boolean,
): { hopLe: DongHopLe[]; loi: LoiDong[] } {
  const khoiTheoTen = new Map(khoi.map((k) => [chuanHoa(k.ten), k]));
  const hopLe: DongHopLe[] = [];
  const loi: LoiDong[] = [];
  const maTrongTep = new Set<string>();
  const emailTrongTep = new Set<string>();
  dong.forEach((d, i) => {
    const so = i + 2; // dòng 1 là tiêu đề
    const bao = (thongBao: string) => loi.push({ dong: so, thongBao });
    const hoTen = d.hoTen.trim();
    if (hoTen.length < 2) return bao("Thiếu họ và tên.");
    const k = khoiTheoTen.get(chuanHoa(d.khoiTen));
    if (!d.khoiTen.trim()) return bao("Thiếu khối.");
    if (!k) return bao(`Khối "${d.khoiTen.trim()}" chưa có trong hệ thống (tạo ở mục Khối và phòng ban hoặc sửa lại tên).`);
    const ngay = docNgay(d.ngayVaoLam);
    if (!ngay) return bao("Ngày vào làm trống hoặc sai định dạng (dùng dd/mm/yyyy).");
    const tt = d.trangThai.trim() ? TRANG_THAI.get(chuanHoa(d.trangThai) as never) : "Đang làm";
    if (!tt) return bao(`Trạng thái "${d.trangThai.trim()}" không hợp lệ (Đang làm, Thử việc hoặc Đã nghỉ).`);
    const email = d.email.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bao(`Email "${d.email.trim()}" không hợp lệ.`);
    const ma = d.maNhanVien.trim();
    if (ma && (maTrongTep.has(ma.toLowerCase()) || daCo.ma.has(ma.toLowerCase()))) return bao(`Mã nhân viên "${ma}" bị trùng.`);
    if (email && (emailTrongTep.has(email) || daCo.email.has(email))) return bao(`Email "${email}" bị trùng.`);
    if (!laKyThuat && nenLaQuanTri(d.chucDanh.trim(), k.ten)) return bao("Vị trí này (Hành chính nhân sự, Tổng giám đốc, Giám đốc…) tự có quyền Quản trị nên chỉ tài khoản Kỹ thuật được nhập.");
    if (ma) maTrongTep.add(ma.toLowerCase());
    if (email) emailTrongTep.add(email);
    hopLe.push({ ma_nhan_vien: ma || null, ho_ten: hoTen, chuc_danh: d.chucDanh.trim() || null, khoi_id: k.id, email: email || null, ngay_vao_lam: ngay, trang_thai: tt as DongHopLe["trang_thai"] });
  });
  return { hopLe, loi };
}
