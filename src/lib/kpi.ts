/** Tính điểm KPI & xếp hạng thi đua (chị Lâm 30/10). Hàm thuần, không đụng DB: dữ liệu vào là dòng đã đọc, ra là điểm/hạng.
 *
 * Quy tắc đã chốt:
 *  - Mỗi chỉ tiêu có mục tiêu NGÀY, áp cho mọi khối (khoiId = null) hoặc riêng một khối.
 *  - % đạt một ngày = thực tế / mục tiêu, trần 120%. Chỉ tiêu "càng thấp càng tốt" đảo ngược: mục tiêu / thực tế (thực tế 0 = 120%).
 *  - Mẫu số của một chỉ tiêu = số ngày trong kỳ CÓ ÍT NHẤT MỘT NGƯỜI báo cho chỉ tiêu đó (ngày không ai báo = ngày nghỉ, không phạt ai);
 *    người không báo trong ngày đó tính 0%.
 *  - Điểm người = trung bình có trọng số các chỉ tiêu áp cho họ (chỉ tiêu chưa có ngày nào trong kỳ thì bỏ qua). Điểm phòng = trung bình điểm các thành viên có điểm.
 *  - Hạng kiểu thi đấu: bằng điểm thì đồng hạng, người sau nhảy hạng (1, 1, 3). */

export const TRAN_PHAN_TRAM = 1.2;

export type Chieu = "Càng cao càng tốt" | "Càng thấp càng tốt";
export type ChiTieu = { id: string; khoiId: string | null; ten: string; mucTieuNgay: number; trongSo: number; chieu: Chieu };
export type KetQuaNgay = { nhanVienId: string; chiTieuId: string; ngay: string; thucTe: number };
export type NguoiKpi = { id: string; hoTen: string; khoiId: string | null };
export type DiemNguoi = { nhanVienId: string; diem: number };
export type DiemChiTieu = { chiTieuId: string; ten: string; diem: number; soNgay: number };
export type XepHang<T> = T & { hang: number };

const lamTron = (n: number) => Math.round(n * 10) / 10;

/** Tỉ lệ đạt một lần báo (0..1,2). */
export function tiLeDat(thucTe: number, mucTieu: number, chieu: Chieu): number {
  if (!(mucTieu > 0) || !Number.isFinite(thucTe) || thucTe < 0) return 0;
  if (chieu === "Càng thấp càng tốt") return thucTe === 0 ? TRAN_PHAN_TRAM : Math.min(TRAN_PHAN_TRAM, mucTieu / thucTe);
  return Math.min(TRAN_PHAN_TRAM, thucTe / mucTieu);
}

/** Chỉ tiêu nào áp cho người thuộc `khoiId`. */
export const chiTieuApCho = <T extends ChiTieu>(cts: readonly T[], khoiId: string | null) => cts.filter((c) => c.khoiId === null || c.khoiId === khoiId);

/** Các ngày trong kỳ có ít nhất một người báo, theo từng chỉ tiêu. */
function ngayCoBao(kq: readonly KetQuaNgay[]) {
  const m = new Map<string, Set<string>>();
  for (const r of kq) (m.get(r.chiTieuId) ?? m.set(r.chiTieuId, new Set()).get(r.chiTieuId)!).add(r.ngay);
  return m;
}

/** Điểm (0..120) của từng người trong `nguoi`, tính trên kết quả `kq` đã lọc đúng kỳ. Người không có chỉ tiêu nào áp dụng/có ngày báo thì không có điểm. */
export function diemCacNguoi(nguoi: readonly NguoiKpi[], cts: readonly ChiTieu[], kq: readonly KetQuaNgay[]): Map<string, { diem: number; chiTiet: DiemChiTieu[] }> {
  const ngay = ngayCoBao(kq);
  const theoNguoiCt = new Map<string, number>(); // `${nv}|${ct}` -> tổng tỉ lệ đạt
  const ctTheoId = new Map(cts.map((c) => [c.id, c]));
  for (const r of kq) {
    const c = ctTheoId.get(r.chiTieuId);
    if (!c) continue;
    const k = `${r.nhanVienId}|${r.chiTieuId}`;
    theoNguoiCt.set(k, (theoNguoiCt.get(k) ?? 0) + tiLeDat(r.thucTe, c.mucTieuNgay, c.chieu));
  }
  const ra = new Map<string, { diem: number; chiTiet: DiemChiTieu[] }>();
  for (const n of nguoi) {
    const chiTiet: DiemChiTieu[] = [];
    let tong = 0, trong = 0;
    for (const c of chiTieuApCho(cts, n.khoiId)) {
      const soNgay = ngay.get(c.id)?.size ?? 0;
      if (soNgay === 0) continue;
      const d = ((theoNguoiCt.get(`${n.id}|${c.id}`) ?? 0) / soNgay) * 100;
      chiTiet.push({ chiTieuId: c.id, ten: c.ten, diem: lamTron(d), soNgay });
      tong += d * c.trongSo; trong += c.trongSo;
    }
    if (trong > 0) ra.set(n.id, { diem: lamTron(tong / trong), chiTiet });
  }
  return ra;
}

/** Điểm từng phòng (khối) = trung bình điểm thành viên có điểm. */
export function diemCacPhong(nguoi: readonly NguoiKpi[], diem: ReadonlyMap<string, { diem: number }>): Map<string, { diem: number; soNguoi: number }> {
  const gom = new Map<string, number[]>();
  for (const n of nguoi) {
    const d = diem.get(n.id);
    if (!d || !n.khoiId) continue;
    (gom.get(n.khoiId) ?? gom.set(n.khoiId, []).get(n.khoiId)!).push(d.diem);
  }
  return new Map([...gom].map(([k, ds]) => [k, { diem: lamTron(ds.reduce((a, b) => a + b, 0) / ds.length), soNguoi: ds.length }]));
}

/** Sắp theo điểm giảm dần (cùng điểm thì theo tên), gán hạng kiểu thi đấu. */
export function xepHang<T extends { diem: number; ten: string }>(ds: readonly T[]): XepHang<T>[] {
  const s = [...ds].sort((a, b) => b.diem - a.diem || a.ten.localeCompare(b.ten, "vi"));
  let hang = 0;
  return s.map((x, i) => { if (i === 0 || x.diem !== s[i - 1].diem) hang = i + 1; return { ...x, hang }; });
}

export type LoaiKy = "ngay" | "thang" | "quy";
export type Ky = { loai: LoaiKy; tu: string; den: string; nhan: string; ma: string };

const hai = (n: number) => String(n).padStart(2, "0");
const ngayCuoiThang = (nam: number, thang: number) => new Date(Date.UTC(nam, thang, 0)).getUTCDate();

/** Kỳ từ mã: `2026-10-30` (ngày), `2026-10` (tháng), `2026-Q4` (quý). Sai định dạng thì null. */
export function docKy(ma: string): Ky | null {
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ma);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > ngayCuoiThang(y, mo)) return null;
    return { loai: "ngay", tu: ma, den: ma, nhan: `${hai(d)}/${hai(mo)}/${y}`, ma };
  }
  m = /^(\d{4})-(\d{2})$/.exec(ma);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]);
    if (mo < 1 || mo > 12) return null;
    return { loai: "thang", tu: `${y}-${hai(mo)}-01`, den: `${y}-${hai(mo)}-${hai(ngayCuoiThang(y, mo))}`, nhan: `Tháng ${mo}/${y}`, ma };
  }
  m = /^(\d{4})-Q([1-4])$/.exec(ma);
  if (m) {
    const y = Number(m[1]), q = Number(m[2]), mo1 = (q - 1) * 3 + 1, mo3 = mo1 + 2;
    return { loai: "quy", tu: `${y}-${hai(mo1)}-01`, den: `${y}-${hai(mo3)}-${hai(ngayCuoiThang(y, mo3))}`, nhan: `Quý ${q}/${y}`, ma };
  }
  return null;
}

/** Mã kỳ chứa ngày `ngay` (YYYY-MM-DD) theo loại. */
export function kyChua(ngay: string, loai: LoaiKy): string {
  if (loai === "ngay") return ngay;
  const y = ngay.slice(0, 4), mo = Number(ngay.slice(5, 7));
  return loai === "thang" ? `${y}-${hai(mo)}` : `${y}-Q${Math.ceil(mo / 3)}`;
}

/** Ngày nhập hợp lệ: đúng định dạng, không ở tương lai (múi giờ do nơi gọi truyền vào `homNay`) và không quá 31 ngày về trước. */
export function ngayNhapHopLe(ngay: string, homNay: string): boolean {
  if (!docKy(ngay) || !/^\d{4}-\d{2}-\d{2}$/.test(ngay) || ngay > homNay) return false;
  return (Date.parse(`${homNay}T00:00:00Z`) - Date.parse(`${ngay}T00:00:00Z`)) / 864e5 <= 31;
}

const truNgay = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);

/** Các kỳ hay xem nhất, tính từ `homNay`: hôm nay/hôm qua, tháng này/trước, quý này/trước. */
export function kyGanDay(homNay: string): { nhan: string; ma: string }[] {
  const thangTruoc = kyChua(truNgay(`${homNay.slice(0, 7)}-01`, 1), "thang");
  const quyTruoc = kyChua(truNgay(`${homNay.slice(0, 4)}-${hai((Math.ceil(Number(homNay.slice(5, 7)) / 3) - 1) * 3 + 1)}-01`, 1), "quy");
  return [
    { nhan: "Hôm nay", ma: homNay }, { nhan: "Hôm qua", ma: truNgay(homNay, 1) },
    { nhan: "Tháng này", ma: kyChua(homNay, "thang") }, { nhan: "Tháng trước", ma: thangTruoc },
    { nhan: "Quý này", ma: kyChua(homNay, "quy") }, { nhan: "Quý trước", ma: quyTruoc },
  ];
}

/* ───────── Cơ chế KPI theo vị trí, chấm theo THÁNG (mẫu chị Phượng 17/11) ─────────
 * Mỗi vị trí (= chức danh trong hồ sơ, so khớp không phân biệt hoa thường/khoảng trắng) có các nhóm công việc, mỗi nhóm một tỷ trọng %
 * (tổng nên là 100). Ban lãnh đạo chấm "% hoàn thành" 0–100 cho từng nhóm; điểm tháng = Σ (% hoàn thành × tỷ trọng) / 100, tối đa 100.
 * Nhóm chưa chấm không bị tính 0: hiện "chưa chấm" và điểm chỉ cộng các nhóm đã chấm. */

export type NhomKpi = { id: string; ten: string; noiDung: string; tyTrong: number };
export type ChamNhom = { nhomId: string; tyLe: number; tyTrong: number };
export type DiemThang = { diem: number | null; daCham: number; tong: number };

/** Chức danh để so khớp: bỏ khoảng trắng thừa, chữ thường, chuẩn dựng sẵn. */
export const chuanChucDanh = (s: string | null | undefined) => (s ?? "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

/** Tổng tỷ trọng các nhóm của một vị trí (nên bằng 100). */
export const tongTyTrong = (nhom: readonly { tyTrong: number }[]) => lamTron(nhom.reduce((a, n) => a + n.tyTrong, 0));

/** Điểm tháng của một người từ các nhóm đã chấm; `tongNhom` là số nhóm của vị trí. Chưa chấm nhóm nào thì không có điểm. */
export function diemThangCuaNguoi(cham: readonly ChamNhom[], tongNhom: number): DiemThang {
  if (cham.length === 0) return { diem: null, daCham: 0, tong: tongNhom };
  const diem = cham.reduce((a, c) => a + (c.tyLe * c.tyTrong) / 100, 0);
  return { diem: lamTron(Math.min(100, diem)), daCham: cham.length, tong: tongNhom };
}

/** Cơ chế áp cho một người: cơ chế riêng của chính người đó (nhanVienId) được ưu tiên; không có thì cơ chế chung của chức danh (nhanVienId để trống). */
export function coCheCuaNguoi<T extends { ten: string; nhanVienId: string | null }>(coChe: readonly T[], nv: { id: string; chucDanh: string | null | undefined }): T | undefined {
  return coChe.find((c) => c.nhanVienId === nv.id) ?? coChe.find((c) => !c.nhanVienId && chuanChucDanh(c.ten) === chuanChucDanh(nv.chucDanh));
}

/** Thang điểm → mức hưởng KPI (mẫu chị Phượng 17/11, mục 2 "Thang điểm và mức hưởng KPI"): 90–100 = 100%, 80–89 = 80%, 70–79 = 60%, 50–69 = 40%, dưới 50 = 0%.
 * Điểm có số lẻ nên lấy theo mốc dưới: 89,5 vẫn thuộc nhóm 80–89. */
export const THANG_MUC_HUONG: readonly { tu: number; den: number | null; nhan: string; huong: number }[] = [
  { tu: 90, den: 100, nhan: "90 – 100 điểm", huong: 100 },
  { tu: 80, den: 89, nhan: "80 – 89 điểm", huong: 80 },
  { tu: 70, den: 79, nhan: "70 – 79 điểm", huong: 60 },
  { tu: 50, den: 69, nhan: "50 – 69 điểm", huong: 40 },
  { tu: 0, den: null, nhan: "Dưới 50 điểm", huong: 0 },
];
export function mucHuongKpi(diem: number): number {
  return (THANG_MUC_HUONG.find((b) => diem >= b.tu) ?? THANG_MUC_HUONG[THANG_MUC_HUONG.length - 1]).huong;
}

/** Tháng chấm hợp lệ: `YYYY-MM`, không ở tương lai, và chỉ tháng này hoặc 2 tháng trước (để chấm chậm và sửa). */
export function thangNhapHopLe(thang: string, homNay: string): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(thang);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return false;
  const soThang = (y: number, mo: number) => y * 12 + mo;
  const cach = soThang(Number(homNay.slice(0, 4)), Number(homNay.slice(5, 7))) - soThang(Number(m[1]), Number(m[2]));
  return cach >= 0 && cach <= 2;
}

/** Ba tháng cho phép chấm, từ mới tới cũ, kèm nhãn. */
export function thangGanDay(homNay: string): { nhan: string; ma: string }[] {
  const y = Number(homNay.slice(0, 4)), mo = Number(homNay.slice(5, 7));
  return [0, 1, 2].map((i) => {
    const t = y * 12 + (mo - 1) - i;
    const ny = Math.floor(t / 12), nm = (t % 12) + 1;
    return { nhan: i === 0 ? "Tháng này" : i === 1 ? "Tháng trước" : `Tháng ${nm}/${ny}`, ma: `${ny}-${hai(nm)}` };
  });
}
