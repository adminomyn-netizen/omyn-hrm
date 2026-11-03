/** Tồn kho từng sản phẩm tính từ phiếu nhập xuất: nhập + điều chỉnh tăng − xuất − điều chỉnh giảm. Hàm thuần, không chạm DB. */
export type DongKho = { sanPhamId: string; loai: string; soLuong: number; ngay?: string };
export type SanPhamKho = { id: string; ma: string; ten: string; tonToiThieu?: number | null };
export type TonKho = { id: string; ma: string; ten: string; nhap: number; xuat: number; dieuChinh: number; ton: number; sapHet: boolean };

export function tinhTonKho(sp: readonly SanPhamKho[], dong: readonly DongKho[]): TonKho[] {
  return sp
    .map((s) => {
      const ds = dong.filter((d) => d.sanPhamId === s.id);
      const tong = (loai: string) => ds.filter((d) => d.loai === loai).reduce((a, d) => a + d.soLuong, 0);
      const nhap = tong("Nhập"), xuat = tong("Xuất"), dieuChinh = tong("Điều chỉnh tăng") - tong("Điều chỉnh giảm");
      const ton = nhap + dieuChinh - xuat;
      return { id: s.id, ma: s.ma, ten: s.ten, nhap, xuat, dieuChinh, ton, sapHet: s.tonToiThieu != null && ton <= s.tonToiThieu };
    })
    .filter((t) => t.nhap || t.xuat || t.dieuChinh)
    .sort((a, b) => a.ma.localeCompare(b.ma, "vi"));
}

export type DongKiemKe = { sanPhamId: string; ngay: string; thucTe: number };
export type ChenhKiemKe = { sanPhamId: string; ngay: string; thucTe: number; soSach: number; chenh: number };

/** Tồn trên sổ của một sản phẩm tính đến hết ngày `ngay` (chỉ tính dòng có ngày; dòng thiếu ngày bỏ qua). */
export function tonDenNgay(dong: readonly DongKho[], sanPhamId: string, ngay: string): number {
  const ds = dong.filter((d) => d.sanPhamId === sanPhamId && d.ngay !== undefined && d.ngay <= ngay);
  const tong = (loai: string) => ds.filter((d) => d.loai === loai).reduce((a, d) => a + d.soLuong, 0);
  return tong("Nhập") + tong("Điều chỉnh tăng") - tong("Xuất") - tong("Điều chỉnh giảm");
}

/** Lần kiểm kê GẦN NHẤT của mỗi sản phẩm: số đếm thực tế so với tồn trên sổ tính đến ngày kiểm kê (chênh = thực tế − sổ). Lệch nhiều nhất xếp trước. */
export function chenhLechKiemKe(dong: readonly DongKho[], kiemKe: readonly DongKiemKe[]): ChenhKiemKe[] {
  const moiNhat = new Map<string, DongKiemKe>();
  for (const k of kiemKe) {
    const cu = moiNhat.get(k.sanPhamId);
    if (!cu || k.ngay > cu.ngay) moiNhat.set(k.sanPhamId, k);
  }
  return [...moiNhat.values()]
    .map((k) => {
      const soSach = tonDenNgay(dong, k.sanPhamId, k.ngay);
      return { sanPhamId: k.sanPhamId, ngay: k.ngay, thucTe: k.thucTe, soSach, chenh: k.thucTe - soSach };
    })
    .sort((a, b) => Math.abs(b.chenh) - Math.abs(a.chenh));
}

export type LoHang = { id: string; sanPhamId: string; soLo: string; hanDung: string; soLuongNhap: number | null; trangThai: string };
export type DongKhoLo = DongKho & { soLo?: string | null };
export type MucHan = "Quá hạn" | "Trong 30 ngày" | "Trong 90 ngày" | "Còn lâu";
export type LoTon = { id: string; sanPhamId: string; soLo: string; hanDung: string; conLai: number; ngayCon: number; muc: MucHan; trangThai: string };
const soNgayGiua = (tu: string, den: string) => Math.round((Date.parse(den) - Date.parse(tu)) / 864e5);

/**
 * Tồn từng lô = phiếu NHẬP của lô (cùng sản phẩm + số lô; nếu chưa có phiếu nhập nào của lô thì lấy "số lượng nhập" ghi ở lô) + điều chỉnh tăng − xuất − điều chỉnh giảm cùng lô.
 * Phiếu không ghi số lô không tính vào lô nào. Chỉ lô "Còn trong kho" mới được xét cảnh báo và gợi ý xuất; lô còn lại 0 hoặc âm bỏ qua.
 */
export function tinhTonLo(lo: readonly LoHang[], dong: readonly DongKhoLo[], homNay: string): LoTon[] {
  return lo
    .filter((l) => l.trangThai === "Còn trong kho")
    .map((l) => {
      const ds = dong.filter((d) => d.sanPhamId === l.sanPhamId && d.soLo?.trim() === l.soLo.trim());
      const tong = (loai: string) => ds.filter((d) => d.loai === loai).reduce((a, d) => a + d.soLuong, 0);
      const nhapPhieu = tong("Nhập");
      const conLai = (nhapPhieu > 0 ? nhapPhieu : l.soLuongNhap ?? 0) + tong("Điều chỉnh tăng") - tong("Xuất") - tong("Điều chỉnh giảm");
      const ngayCon = soNgayGiua(homNay, l.hanDung);
      const muc: MucHan = ngayCon < 0 ? "Quá hạn" : ngayCon <= 30 ? "Trong 30 ngày" : ngayCon <= 90 ? "Trong 90 ngày" : "Còn lâu";
      return { id: l.id, sanPhamId: l.sanPhamId, soLo: l.soLo, hanDung: l.hanDung, conLai, ngayCon, muc, trangThai: l.trangThai };
    })
    .filter((l) => l.conLai > 0)
    .sort((a, b) => (a.hanDung < b.hanDung ? -1 : a.hanDung > b.hanDung ? 1 : 0));
}

/** Gợi ý xuất trước (FEFO): với mỗi sản phẩm, lô CÒN HẠN có hạn gần nhất và còn hàng. Lô quá hạn không gợi ý bán (xử lý ở mục huỷ/trả). */
export function goiYXuatTruoc(lo: readonly LoTon[]): Map<string, LoTon> {
  const m = new Map<string, LoTon>();
  for (const l of lo) if (l.ngayCon >= 0 && !m.has(l.sanPhamId)) m.set(l.sanPhamId, l);
  return m;
}

export type DongKhoLyDo = DongKho & { lyDo?: string | null };
export type XuatNhapTon = { id: string; ma: string; ten: string; tonDau: number; nhap: number; tang: number; xuat: number; giam: number; tonCuoi: number };
export type TheoLyDo = { lyDo: string; tang: number; giam: number };

const gop = (ds: readonly DongKho[]) => {
  const t = (loai: string) => ds.filter((d) => d.loai === loai).reduce((a, d) => a + d.soLuong, 0);
  return { nhap: t("Nhập"), tang: t("Điều chỉnh tăng"), xuat: t("Xuất"), giam: t("Điều chỉnh giảm") };
};

/**
 * Báo cáo xuất-nhập-tồn một kỳ [tu, den] (gồm cả hai đầu): tồn đầu = mọi phiếu trước `tu`, tồn cuối = tồn đầu + nhập + tăng − xuất − giảm.
 * Dòng thiếu ngày bị bỏ qua. Sản phẩm không có số liệu nào trong và trước kỳ thì không hiện.
 */
export function xuatNhapTon(sp: readonly SanPhamKho[], dong: readonly DongKho[], tu: string, den: string): { dong: XuatNhapTon[]; tong: Omit<XuatNhapTon, "id" | "ma" | "ten"> } {
  const co = dong.filter((d) => d.ngay !== undefined && d.ngay <= den);
  const ra = sp
    .map((s) => {
      const truoc = gop(co.filter((d) => d.sanPhamId === s.id && (d.ngay as string) < tu));
      const trong = gop(co.filter((d) => d.sanPhamId === s.id && (d.ngay as string) >= tu));
      const tonDau = truoc.nhap + truoc.tang - truoc.xuat - truoc.giam;
      return { id: s.id, ma: s.ma, ten: s.ten, tonDau, nhap: trong.nhap, tang: trong.tang, xuat: trong.xuat, giam: trong.giam, tonCuoi: tonDau + trong.nhap + trong.tang - trong.xuat - trong.giam };
    })
    .filter((r) => r.tonDau || r.nhap || r.tang || r.xuat || r.giam)
    .sort((a, b) => a.ma.localeCompare(b.ma, "vi"));
  const c = (k: "tonDau" | "nhap" | "tang" | "xuat" | "giam" | "tonCuoi") => ra.reduce((a, r) => a + r[k], 0);
  return { dong: ra, tong: { tonDau: c("tonDau"), nhap: c("nhap"), tang: c("tang"), xuat: c("xuat"), giam: c("giam"), tonCuoi: c("tonCuoi") } };
}

/** Điều chỉnh trong kỳ gom theo lý do (thiếu lý do ghi "Chưa ghi lý do"); nhiều nhất xếp trước. */
export function dieuChinhTheoLyDo(dong: readonly DongKhoLyDo[], tu: string, den: string): TheoLyDo[] {
  const m = new Map<string, TheoLyDo>();
  for (const d of dong) {
    if (d.ngay === undefined || d.ngay < tu || d.ngay > den) continue;
    if (d.loai !== "Điều chỉnh tăng" && d.loai !== "Điều chỉnh giảm") continue;
    const k = d.lyDo?.trim() || "Chưa ghi lý do";
    const r = m.get(k) ?? { lyDo: k, tang: 0, giam: 0 };
    if (d.loai === "Điều chỉnh tăng") r.tang += d.soLuong; else r.giam += d.soLuong;
    m.set(k, r);
  }
  return [...m.values()].sort((a, b) => b.tang + b.giam - (a.tang + a.giam));
}
