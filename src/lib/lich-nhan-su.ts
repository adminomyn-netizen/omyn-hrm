/** Lịch nhân sự: gom mọi mốc cần nhớ trong một tháng (hợp đồng hết hạn, hết thử việc, sinh nhật, nghỉ phép, đánh giá, báo cáo nhà nước, báo tăng/giảm BHXH).
 * Hàm thuần: nhận dữ liệu đã đọc, trả về danh sách sự kiện theo ngày. Mốc 30 ngày báo BHXH và hạn báo cáo ghi "chờ kế toán/luật sư xác nhận". */

export type LoaiSuKien = "hop-dong" | "thu-viec" | "sinh-nhat" | "nghi-phep" | "danh-gia" | "bao-cao" | "bhxh";
export type SuKien = { ngay: string; loai: LoaiSuKien; tieuDe: string; phu?: string; href?: string; nhanVienId?: string };

export const TEN_LOAI: Record<LoaiSuKien, string> = {
  "hop-dong": "Hợp đồng", "thu-viec": "Thử việc", "sinh-nhat": "Sinh nhật", "nghi-phep": "Nghỉ phép", "danh-gia": "Đánh giá", "bao-cao": "Báo cáo nhà nước", bhxh: "BHXH",
};
export const NGAY_BAO_BHXH = 30;
const CHO = "chờ kế toán/luật sư xác nhận";

const MS = 86_400_000;
export const congNgay = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * MS).toISOString().slice(0, 10);
const hai = (n: number) => String(n).padStart(2, "0");
export const dauThang = (nam: number, thang: number) => `${nam}-${hai(thang)}-01`;
export const cuoiThang = (nam: number, thang: number) => new Date(Date.UTC(nam, thang, 0)).toISOString().slice(0, 10);
const trong = (d: string, tu: string, den: string) => d >= tu && d <= den;

export type NhanSuL = { id: string; ho_ten: string; trang_thai: string; ngay_vao_lam: string | null; ngay_sinh: string | null };
export type HdL = { nhan_vien_id: string | null; loai: string; tu_ngay: string; den_ngay: string | null; trang_thai: string };
export type NghiL = { nhan_vien_id: string; loai: string; tu_ngay: string; den_ngay: string };
export type BaoCaoL = { ten: string; co_quan: string | null; chu_ky: string; han_ngay: number | null; han_thang: number | null; han_mot_lan: string | null; dang_bat: boolean };
export type NghiViecL = { nhan_vien_id: string; ngay_lam_viec_cuoi: string; trang_thai: string };
export type DuLieuLich = { nhanSu: NhanSuL[]; hopDong: HdL[]; nghiPhep: NghiL[]; baoCao: BaoCaoL[]; nghiViec: NghiViecL[] };

/** Các hạn của một mục báo cáo rơi vào tháng đó. Chu kỳ chưa nhập hạn thì không có hạn nào. */
export function hanBaoCaoTrongThang(b: BaoCaoL, nam: number, thang: number): string[] {
  if (!b.dang_bat) return [];
  const gan = (n: number, m: number) => { const cuoi = Number(cuoiThang(nam, m).slice(8)); return `${nam}-${hai(m)}-${hai(Math.min(n, cuoi))}`; };
  if (b.chu_ky === "Một lần") return b.han_mot_lan && b.han_mot_lan.slice(0, 7) === `${nam}-${hai(thang)}` ? [b.han_mot_lan] : [];
  if (!b.han_ngay) return [];
  if (b.chu_ky === "Hằng tháng") return [gan(b.han_ngay, thang)];
  const t0 = b.han_thang;
  if (!t0) return [];
  if (b.chu_ky === "Hằng năm") return t0 === thang ? [gan(b.han_ngay, thang)] : [];
  const moc = b.chu_ky === "Hằng quý" ? [0, 3, 6, 9] : [0, 6]; // lặp mỗi quý/6 tháng kể từ tháng đã nhập
  return moc.some((k) => ((t0 - 1 + k) % 12) + 1 === thang) ? [gan(b.han_ngay, thang)] : [];
}

export function suKienThang(d: DuLieuLich, nam: number, thang: number): SuKien[] {
  const tu = dauThang(nam, thang), den = cuoiThang(nam, thang);
  const ra: SuKien[] = [];
  const ten = new Map(d.nhanSu.map((n) => [n.id, n.ho_ten]));
  const dangLam = d.nhanSu.filter((n) => n.trang_thai !== "Đã nghỉ");
  const hoTen = (id: string | null) => (id ? ten.get(id) ?? "—" : "—");

  for (const h of d.hopDong) {
    if (!h.den_ngay || !h.nhan_vien_id || h.trang_thai !== "Đang hiệu lực") continue;
    if (trong(h.den_ngay, tu, den)) ra.push({ ngay: h.den_ngay, loai: h.loai === "Thử việc" ? "thu-viec" : "hop-dong", tieuDe: `${h.loai === "Thử việc" ? "Hết thử việc" : "Hợp đồng hết hạn"}: ${hoTen(h.nhan_vien_id)}`, phu: h.loai, href: `/nhan-su/${h.nhan_vien_id}`, nhanVienId: h.nhan_vien_id });
    const dg = congNgay(h.den_ngay, -45);
    if (h.loai !== "Thử việc" && trong(dg, tu, den)) ra.push({ ngay: dg, loai: "danh-gia", tieuDe: `Đánh giá tái ký: ${hoTen(h.nhan_vien_id)}`, phu: "45 ngày trước khi hợp đồng hết hạn", href: `/nhan-su/${h.nhan_vien_id}`, nhanVienId: h.nhan_vien_id });
  }
  const coHdThuViec = new Set(d.hopDong.filter((h) => h.loai === "Thử việc" && h.den_ngay).map((h) => h.nhan_vien_id));
  for (const n of dangLam) {
    if (n.trang_thai === "Thử việc" && n.ngay_vao_lam) {
      const het = congNgay(n.ngay_vao_lam, 60);
      if (!coHdThuViec.has(n.id) && trong(het, tu, den)) ra.push({ ngay: het, loai: "thu-viec", tieuDe: `Hết thử việc (60 ngày): ${n.ho_ten}`, phu: "tính từ ngày vào làm", href: `/nhan-su/${n.id}`, nhanVienId: n.id });
      for (const k of [30, 60]) { const m = congNgay(n.ngay_vao_lam, k); if (trong(m, tu, den)) ra.push({ ngay: m, loai: "danh-gia", tieuDe: `Đánh giá thử việc ${k} ngày: ${n.ho_ten}`, href: "/hr/onboarding", nhanVienId: n.id }); }
    }
    if (n.ngay_sinh) { const sn = `${nam}-${n.ngay_sinh.slice(5)}`; if (trong(sn, tu, den) && /^\d{4}-\d{2}-\d{2}$/.test(sn)) ra.push({ ngay: sn, loai: "sinh-nhat", tieuDe: `Sinh nhật: ${n.ho_ten}`, nhanVienId: n.id }); }
    if (n.ngay_vao_lam) { const b = congNgay(n.ngay_vao_lam, NGAY_BAO_BHXH); if (trong(b, tu, den) && n.ngay_vao_lam >= congNgay(tu, -400)) ra.push({ ngay: b, loai: "bhxh", tieuDe: `Hạn báo tăng lao động BHXH: ${n.ho_ten}`, phu: `${NGAY_BAO_BHXH} ngày từ ngày vào làm (${CHO})`, href: `/nhan-su/${n.id}`, nhanVienId: n.id }); }
  }
  for (const v of d.nghiViec) {
    if (v.trang_thai === "Huỷ") continue;
    const b = congNgay(v.ngay_lam_viec_cuoi, NGAY_BAO_BHXH);
    if (trong(b, tu, den)) ra.push({ ngay: b, loai: "bhxh", tieuDe: `Hạn báo giảm lao động BHXH: ${hoTen(v.nhan_vien_id)}`, phu: `${NGAY_BAO_BHXH} ngày từ ngày nghỉ (${CHO})`, href: "/nghi-viec", nhanVienId: v.nhan_vien_id });
  }
  for (const p of d.nghiPhep) {
    for (let t = Math.max(Date.parse(`${p.tu_ngay}T00:00:00Z`), Date.parse(`${tu}T00:00:00Z`)); t <= Math.min(Date.parse(`${p.den_ngay}T00:00:00Z`), Date.parse(`${den}T00:00:00Z`)); t += MS) {
      const ngay = new Date(t).toISOString().slice(0, 10);
      if (new Date(t).getUTCDay() !== 0) ra.push({ ngay, loai: "nghi-phep", tieuDe: `${hoTen(p.nhan_vien_id)} nghỉ`, phu: p.loai, nhanVienId: p.nhan_vien_id });
    }
  }
  for (const b of d.baoCao) for (const ngay of hanBaoCaoTrongThang(b, nam, thang)) ra.push({ ngay, loai: "bao-cao", tieuDe: `Hạn nộp: ${b.ten}`, phu: [b.co_quan, CHO].filter(Boolean).join(" · "), href: "/hr/han-bao-cao-nha-nuoc" });
  return ra.sort((a, b) => a.ngay.localeCompare(b.ngay) || a.loai.localeCompare(b.loai));
}

export type TinLich = { khung: string; tieuDe: string; noiDung: string; url: string };
const NGAY_NHAC_HAN_LICH = new Set([7, 3, 1, 0]);

/** Nhắc sáng cho HCNS: sinh nhật HÔM NAY, và hạn nộp báo cáo/BHXH còn đúng 7, 3, 1 hoặc 0 ngày. Không có gì thì không nhắc. */
export function tinLichHomNay(ev: readonly SuKien[], hom: string): TinLich | null {
  const dong: string[] = [];
  for (const s of ev) {
    if (s.loai === "sinh-nhat" && s.ngay === hom) dong.push(s.tieuDe);
    else if (s.loai === "bao-cao" || s.loai === "bhxh") {
      const con = Math.round((Date.parse(`${s.ngay}T00:00:00Z`) - Date.parse(`${hom}T00:00:00Z`)) / MS);
      if (NGAY_NHAC_HAN_LICH.has(con)) dong.push(`${s.tieuDe} (${con === 0 ? "hôm nay" : `còn ${con} ngày`})`);
    }
  }
  if (dong.length === 0) return null;
  return { khung: `lich_nhan_su_${hom}`, tieuDe: `Lịch nhân sự hôm nay: ${dong.length} mốc`, noiDung: dong.slice(0, 4).join("; ") + (dong.length > 4 ? `; và ${dong.length - 4} mốc khác` : ""), url: "/lich-nhan-su" };
}
