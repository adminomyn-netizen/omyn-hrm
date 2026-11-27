/** Đọc bảng đơn lẻ dán từ Excel (tách bằng Tab) hoặc file CSV xuất từ sàn. Hàm thuần, không chạm DB. */
export type TrangThaiDonLe = "Đang xử lý" | "Đã giao" | "Hoàn trả" | "Huỷ";
/** Một dòng hàng của đơn trong file (sàn xuất mỗi sản phẩm một dòng, lặp lại mã đơn). */
export type HangDoc = { dong: number; sku: string | null; tenSp: string | null; soLuong: number; donGia: number | null };
export type DonLeDoc = { dong: number; ngay: string; maDon: string; tenKhach: string | null; dienThoai: string | null; giaTri: number; trangThai: TrangThaiDonLe; /** Chữ trạng thái GỐC trong file (mã của sàn), null nếu file không có cột trạng thái. */ trangThaiSan: string | null; hang: HangDoc[] };
export type LoiDong = { dong: number; loi: string };

const bo = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Tên cột chấp nhận (đã bỏ dấu, chữ thường) cho từng trường. */
const COT: Record<"ngay" | "maDon" | "ten" | "sdt" | "tien" | "trangThai" | "sku" | "tenSp" | "soLuong" | "donGia", string[]> = {
  ngay: ["ngay", "ngay dat hang", "ngay tao don", "ngay dat", "order date", "order creation time", "created time", "thoi gian tao don"],
  maDon: ["ma don", "ma don hang", "order id", "order no", "so don", "ma van don" ],
  ten: ["ten khach", "khach hang", "ten khach hang", "nguoi mua", "ten nguoi nhan", "buyer", "buyer username", "recipient"],
  sdt: ["sdt", "so dien thoai", "dien thoai", "phone", "phone number", "so dt"],
  tien: ["tien khach tra", "tong tien", "tong thanh toan", "tong gia tri don hang", "gia tri don", "gia tri", "so tien", "total", "order amount", "total amount", "tong tien thanh toan"],
  trangThai: ["trang thai", "trang thai don hang", "status", "order status"],
  sku: ["ma san pham", "ma sp", "sku", "seller sku", "sku reference no", "sku id", "sku san pham", "ma hang"],
  tenSp: ["ten san pham", "san pham", "product name", "ten hang", "ten hang hoa", "ten san pham ten phan loai"],
  soLuong: ["so luong", "sl", "quantity", "qty"],
  donGia: ["don gia", "gia ban", "gia", "unit price", "price", "original price", "gia goc", "deal price", "gia san pham"],
};

export function tachBang(text: string): string[][] {
  const dong = text.replace(/^﻿/, "").split(/\r?\n/).filter((d) => d.trim() !== "");
  if (!dong.length) return [];
  const dau = dong[0];
  const phay = (dau.match(/,/g) ?? []).length, cham = (dau.match(/;/g) ?? []).length, tab = (dau.match(/\t/g) ?? []).length;
  const ngan = tab > 0 && tab >= phay && tab >= cham ? "\t" : cham > phay ? ";" : ",";
  return dong.map((d) => {
    const o: string[] = []; let cur = ""; let trongNgoac = false;
    for (let i = 0; i < d.length; i++) {
      const c = d[i];
      if (c === '"') { if (trongNgoac && d[i + 1] === '"') { cur += '"'; i++; } else trongNgoac = !trongNgoac; }
      else if (c === ngan && !trongNgoac) { o.push(cur.trim()); cur = ""; }
      else cur += c;
    }
    o.push(cur.trim());
    return o;
  });
}

export function docNgay(s: string): string | null {
  const t = s.trim().split(/[ T]/)[0];
  let m = t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  let y: number, mo: number, d: number;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** "1.250.000", "1,250,000", "1250000đ", "1 250 000" → 1250000. Có phần lẻ (vd 1250000.50) thì làm tròn. Không đọc được thì null. */
export function docTien(s: string): number | null {
  const t = s.replace(/[đ₫\sA-Za-z]/g, "");
  if (!t || !/^[\d.,]+$/.test(t)) return null;
  const phanLe = t.match(/[.,](\d{1,2})$/);
  const coLe = phanLe && !/^\d{1,3}([.,]\d{3})+$/.test(t);
  const so = coLe ? Number(t.slice(0, t.length - phanLe![0].length).replace(/[.,]/g, "") + "." + phanLe![1]) : Number(t.replace(/[.,]/g, ""));
  return Number.isFinite(so) ? Math.round(so) : null;
}

export function docTrangThai(s: string): TrangThaiDonLe {
  const t = bo(s);
  if (!t) return "Đang xử lý";
  if (/(hoan tien|hoan tra|hoan hang|return|refund|tra hang)/.test(t)) return "Hoàn trả";
  if (/(huy|cancel)/.test(t)) return "Huỷ";
  if (/(hoan thanh|da giao|completed|delivered|thanh cong|da nhan)/.test(t)) return "Đã giao";
  return "Đang xử lý";
}

export const chuanSdt = (s: string | null | undefined) => {
  const d = (s ?? "").replace(/\D/g, "");
  return d.startsWith("84") && d.length >= 11 ? `0${d.slice(2)}` : d;
};

/**
 * Đọc bảng đơn. Dòng đầu là tiêu đề; bắt buộc có cột Mã đơn, Ngày, Tiền (tên cột nhận cả tiếng Việt và tiếng Anh của Shopee/TikTok);
 * Tên khách, SĐT, Trạng thái là tuỳ chọn (không có trạng thái thì Đang xử lý).
 * Có thêm cột sản phẩm (Mã sản phẩm/SKU hoặc Tên sản phẩm) và Số lượng thì mỗi dòng là một dòng hàng và các dòng cùng mã đơn gộp thành một đơn
 * (thông tin đơn lấy ở dòng đầu); khi đó dòng hàng lỗi chỉ bị bỏ và báo ở `canhBao`, đơn vẫn được nhập. Không có cột sản phẩm thì mã đơn trùng trong file chỉ lấy dòng đầu và báo lỗi.
 */
export function docBangDonLe(text: string): { don: DonLeDoc[]; loi: LoiDong[]; canhBao: LoiDong[]; thieuCot: string[] } {
  const bang = tachBang(text);
  if (bang.length === 0) return { don: [], loi: [], canhBao: [], thieuCot: ["file trống"] };
  const tieuDe = bang[0].map(bo);
  const tim = (k: keyof typeof COT) => tieuDe.findIndex((h) => COT[k].includes(h));
  const cot = { ngay: tim("ngay"), maDon: tim("maDon"), ten: tim("ten"), sdt: tim("sdt"), tien: tim("tien"), tt: tim("trangThai"), sku: tim("sku"), tenSp: tim("tenSp"), sl: tim("soLuong"), gia: tim("donGia") };
  const thieuCot = [cot.maDon < 0 && "Mã đơn", cot.ngay < 0 && "Ngày", cot.tien < 0 && "Tiền khách trả"].filter(Boolean) as string[];
  if (thieuCot.length) return { don: [], loi: [], canhBao: [], thieuCot };
  const coHang = cot.sl >= 0 && (cot.sku >= 0 || cot.tenSp >= 0);
  const don: DonLeDoc[] = [], loi: LoiDong[] = [], canhBao: LoiDong[] = [], theoMa = new Map<string, DonLeDoc>();
  const docHang = (r: string[], dong: number): HangDoc | null => {
    const sku = cot.sku >= 0 ? (r[cot.sku] ?? "").trim() : "";
    const tenSp = cot.tenSp >= 0 ? (r[cot.tenSp] ?? "").trim() : "";
    if (!sku && !tenSp) return null;
    const slTho = (r[cot.sl] ?? "").trim();
    const sl = slTho === "" ? 1 : docTien(slTho);
    if (sl === null || sl < 1 || sl > 100000) { canhBao.push({ dong, loi: `Số lượng “${slTho}” không hợp lệ, bỏ dòng hàng này.` }); return null; }
    const gia = cot.gia >= 0 && (r[cot.gia] ?? "").trim() !== "" ? docTien(r[cot.gia]) : null;
    return { dong, sku: sku || null, tenSp: tenSp || null, soLuong: sl, donGia: gia };
  };
  bang.slice(1).forEach((r, i) => {
    const dong = i + 2;
    const maDon = (r[cot.maDon] ?? "").trim();
    if (!maDon) return void loi.push({ dong, loi: "Thiếu mã đơn." });
    const co = theoMa.get(maDon);
    if (co) {
      if (!coHang) return void loi.push({ dong, loi: `Mã đơn ${maDon} trùng với dòng trên trong file.` });
      const h = docHang(r, dong);
      if (h) co.hang.push(h);
      return;
    }
    const ngay = docNgay(r[cot.ngay] ?? "");
    if (!ngay) return void loi.push({ dong, loi: `Ngày “${r[cot.ngay] ?? ""}” không đọc được (dùng dd/mm/yyyy hoặc yyyy-mm-dd).` });
    const giaTri = docTien(r[cot.tien] ?? "");
    if (giaTri === null || giaTri <= 0) return void loi.push({ dong, loi: `Tiền “${r[cot.tien] ?? ""}” không hợp lệ (cần lớn hơn 0).` });
    const sdt = cot.sdt >= 0 ? chuanSdt(r[cot.sdt]) : "";
    const d: DonLeDoc = { dong, ngay, maDon, giaTri, tenKhach: cot.ten >= 0 && r[cot.ten]?.trim() ? r[cot.ten].trim() : null, dienThoai: sdt.length >= 9 ? sdt : null, trangThai: cot.tt >= 0 ? docTrangThai(r[cot.tt] ?? "") : "Đang xử lý", trangThaiSan: cot.tt >= 0 && (r[cot.tt] ?? "").trim() ? (r[cot.tt] ?? "").trim() : null, hang: [] };
    if (coHang) { const h = docHang(r, dong); if (h) d.hang.push(h); }
    theoMa.set(maDon, d); don.push(d);
  });
  return { don, loi, canhBao, thieuCot: [] };
}

export type SanPhamKhop = { id: string; maSp: string; ten: string };

/** Tìm sản phẩm trong danh mục cho một dòng hàng: khớp mã (SKU) trước, rồi khớp tên (bỏ dấu, không phân biệt hoa thường). Không khớp thì null. */
export function khopSanPham(h: Pick<HangDoc, "sku" | "tenSp">, ds: readonly SanPhamKhop[]): string | null {
  const ung = [h.sku, h.tenSp].filter((x): x is string => !!x).map(bo).filter(Boolean);
  for (const u of ung) { const t = ds.find((s) => bo(s.maSp) === u); if (t) return t.id; }
  for (const u of ung) { const t = ds.find((s) => bo(s.ten) === u); if (t) return t.id; }
  return null;
}

/** Đơn giá từng dòng: file có đủ đơn giá thì dùng đúng; thiếu thì chia đều tổng tiền đơn theo số lượng (lãi gộp chỉ gần đúng). */
export function donGiaCacDong(giaTri: number, hang: readonly Pick<HangDoc, "soLuong" | "donGia">[]): number[] {
  if (hang.length && hang.every((h) => h.donGia !== null)) return hang.map((h) => h.donGia as number);
  const tongSl = hang.reduce((a, h) => a + h.soLuong, 0);
  return hang.map(() => (tongSl > 0 ? Math.round(giaTri / tongSl) : 0));
}

/** Giá trị một ô Excel (exceljs) → chữ để dán vào bảng nhập: ngày thành dd/mm/yyyy, công thức lấy kết quả, chữ có định dạng nối lại, tab/xuống dòng trong ô đổi thành khoảng trắng. */
export function oExcelThanhChu(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    const d = String(v.getUTCDate()).padStart(2, "0"), m = String(v.getUTCMonth() + 1).padStart(2, "0");
    return `${d}/${m}/${v.getUTCFullYear()}`;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text?: string }[]).map((x) => x.text ?? "").join("").replace(/[\t\r\n]+/g, " ").trim();
    if ("result" in o) return oExcelThanhChu(o.result);
    if (typeof o.text === "string") return o.text.replace(/[\t\r\n]+/g, " ").trim();
    if (typeof o.error === "string") return "";
    return "";
  }
  return String(v).replace(/[\t\r\n]+/g, " ").trim();
}

/** Các hàng của một trang tính → bảng chữ tab-phân-cách (bỏ hàng trống), cùng định dạng với ô dán từ Excel. */
export function hangExcelThanhBang(hang: readonly (readonly unknown[])[]): string {
  return hang.map((h) => h.map(oExcelThanhChu).join("\t")).filter((d) => d.replace(/\t/g, "").trim() !== "").join("\n");
}
