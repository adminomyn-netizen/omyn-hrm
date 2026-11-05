// Tính lương theo Quy chế lương OMYN 2026 (plan Phụ lục D). HÀM THUẦN, số nguyên đồng, làm tròn NỬA LÊN ở từng khoản.
// Công tính theo NỬA CÔNG (số nguyên) để không dùng số thực cho phép chia. Mọi tham số lấy từ bảng tham_so_luong (đổi được, có xác nhận).
// KHÔNG import "server-only": dùng được cả ở máy chủ, trình duyệt và test.

export type ThamSo = Record<string, number>;

export type DauVaoLuong = {
  luongThoaThuan: number; // gộp: lương chức danh + KPI khoán
  tyLeKpi: number; // % KPI nền trong lương thỏa thuận (Ban điều hành = 0)
  thuViec: boolean;
  congChuan: number; // ngày
  congHuong: number; // ngày (bước 0,5)
  ngayLam: number; // ngày đi làm thực tế (tính tiền ăn)
  tyLeHtKpi: number; // % hoàn thành KPI, tối đa 120
  phuCap: number;
  phuCapMienThue: boolean;
  anCa: boolean;
  dongBh: boolean;
  soNguoiPhuThuoc: number;
  gioOtThuong: number;
  gioOtNghiTuan: number;
  gioOtLe: number;
  hoaHong: number;
  thuongKhac: number;
  khauTruKhac: number;
};

export type KetQuaLuong = {
  luongChucDanh: number;
  luongKpi: number;
  phuCapThuc: number;
  tienAn: number;
  tienOt: number;
  tongThuNhap: number;
  bhXh: number;
  bhYt: number;
  bhTn: number;
  giamTru: number;
  thuNhapTinhThue: number;
  thueTncn: number;
  thucLinh: number;
  bhCty: number;
};

/** a × b ÷ c làm tròn nửa lên, toàn bộ bằng số nguyên (không qua số thực). */
export function chiaTron(a: number, b: number, c: number): number {
  if (c === 0) return 0;
  const tu = a * b;
  const dau = tu < 0 ? -1 : 1;
  return dau * Math.floor((2 * Math.abs(tu) + c) / (2 * c));
}

const nua = (ngay: number) => Math.round(ngay * 2); // ngày → nửa ngày (nguyên)
const bp = (phanTram: number) => Math.round(phanTram * 100); // % → điểm cơ bản (1,5% = 150)

function thueLuyTien(thuNhap: number, p: ThamSo): number {
  const bac = [p.thue_bac_1_den, p.thue_bac_2_den, p.thue_bac_3_den, p.thue_bac_4_den];
  const suat = [p.thue_ty_le_1, p.thue_ty_le_2, p.thue_ty_le_3, p.thue_ty_le_4, p.thue_ty_le_5];
  let con = thuNhap;
  let truoc = 0;
  let thue = 0;
  for (let i = 0; i < 5 && con > 0; i++) {
    const tran = i < 4 ? bac[i] - truoc : con;
    const phan = Math.min(con, tran);
    thue += chiaTron(phan, bp(suat[i]), 10000);
    con -= phan;
    truoc = i < 4 ? bac[i] : truoc;
  }
  return thue;
}

/** Thuế lũy tiến tách theo từng bậc (cùng phép chia tròn với `thueLuyTien`) để hiển thị: bậc nào chịu bao nhiêu thu nhập và bao nhiêu thuế. Chỉ trả các bậc có phát sinh. */
export type BacThue = { bac: number; tu: number; den: number | null; phan: number; suat: number; thue: number };
export function chiTietBacThue(thuNhap: number, p: ThamSo): BacThue[] {
  const bac = [p.thue_bac_1_den, p.thue_bac_2_den, p.thue_bac_3_den, p.thue_bac_4_den];
  const suat = [p.thue_ty_le_1, p.thue_ty_le_2, p.thue_ty_le_3, p.thue_ty_le_4, p.thue_ty_le_5];
  const ra: BacThue[] = [];
  let con = thuNhap;
  let truoc = 0;
  for (let i = 0; i < 5 && con > 0; i++) {
    const tran = i < 4 ? bac[i] - truoc : con;
    const phan = Math.min(con, tran);
    ra.push({ bac: i + 1, tu: truoc, den: i < 4 ? bac[i] : null, phan, suat: suat[i], thue: chiaTron(phan, bp(suat[i]), 10000) });
    con -= phan;
    truoc = i < 4 ? bac[i] : truoc;
  }
  return ra;
}

export function tinhLuong(v: DauVaoLuong, p: ThamSo): KetQuaLuong {
  const nuaChuan = Math.max(1, nua(v.congChuan));
  const nuaHuong = Math.min(Math.max(0, nua(v.congHuong)), nuaChuan); // trần 100%

  // 1) Lương thỏa thuận sau thử việc, tách KPI nền và lương chức danh
  const thoaThuan = v.thuViec ? chiaTron(v.luongThoaThuan, bp(p.thu_viec_ty_le), 10000) : v.luongThoaThuan;
  const kpiNen = chiaTron(thoaThuan, v.tyLeKpi, 100);
  const lcd = thoaThuan - kpiNen;

  // 2) Các khoản thu nhập
  const luongChucDanh = chiaTron(lcd, nuaHuong, nuaChuan);
  const luongKpi = chiaTron(kpiNen, Math.min(Math.max(0, v.tyLeHtKpi), 120), 100);
  const phuCapThuc = chiaTron(v.phuCap, nuaHuong, nuaChuan);
  const tienAn = v.anCa ? chiaTron(p.tien_an_ngay, nua(v.ngayLam), 2) : 0;

  // Tăng ca: LCD ÷ công chuẩn ÷ 8 × giờ × hệ số. Giờ tính theo nửa giờ để chia nguyên.
  const gh = [nua(v.gioOtThuong), nua(v.gioOtNghiTuan), nua(v.gioOtLe)];
  const he = [p.ot_thuong, p.ot_nghi_tuan, p.ot_le];
  const tongHeSo = gh.reduce((t, g, i) => t + g * he[i], 0);
  const tongGioThuong = gh.reduce((t, g) => t + g * 100, 0);
  const mau = 800 * nuaChuan;
  const tienOt = chiaTron(lcd, tongHeSo, mau);
  const otChiuThue = chiaTron(lcd, tongGioThuong, mau); // phần tương đương giờ thường; phần vượt (150/200/300% − 100%) được miễn thuế

  const tongThuNhap = luongChucDanh + luongKpi + phuCapThuc + tienAn + tienOt + v.hoaHong + v.thuongKhac;

  // 3) Bảo hiểm: trên lương chức danh trong HĐLĐ (không KPI/hoa hồng/ăn/phụ cấp); thử việc chưa đóng
  const coBh = v.dongBh && !v.thuViec;
  const nenXhYt = Math.min(lcd, p.tran_dong_bhxh_bhyt);
  const nenTn = Math.min(lcd, p.tran_dong_bhtn);
  const bhXh = coBh ? chiaTron(nenXhYt, bp(p.bhxh_nld), 10000) : 0;
  const bhYt = coBh ? chiaTron(nenXhYt, bp(p.bhyt_nld), 10000) : 0;
  const bhTn = coBh ? chiaTron(nenTn, bp(p.bhtn_nld), 10000) : 0;
  const bhCty = coBh
    ? chiaTron(nenXhYt, bp(p.bhxh_cty), 10000) + chiaTron(nenXhYt, bp(p.bhyt_cty), 10000) + chiaTron(nenTn, bp(p.bhtn_cty), 10000) + chiaTron(nenXhYt, bp(p.kpcd_cty), 10000)
    : 0;
  const bhNld = bhXh + bhYt + bhTn;

  // 4) Thuế TNCN
  const mienAn = Math.min(tienAn, p.mien_thue_tien_an);
  const mienPhuCap = v.phuCapMienThue ? phuCapThuc : 0;
  const mienOt = Math.max(0, tienOt - otChiuThue);
  const thuNhapChiuThue = Math.max(0, tongThuNhap - mienAn - mienPhuCap - mienOt);
  const giamTru = v.thuViec ? 0 : p.giam_tru_ban_than + p.giam_tru_phu_thuoc * v.soNguoiPhuThuoc;

  let thuNhapTinhThue: number;
  let thueTncn: number;
  if (v.thuViec) {
    // thử việc / hợp đồng ngắn: khấu trừ 10% khi từ 2.000.000 đ/lần (Quy chế Điều 15.4), không giảm trừ
    thuNhapTinhThue = thuNhapChiuThue;
    thueTncn = thuNhapChiuThue >= p.khau_tru_vang_lai_nguong ? chiaTron(thuNhapChiuThue, bp(p.khau_tru_vang_lai_ty_le), 10000) : 0;
  } else {
    thuNhapTinhThue = Math.max(0, thuNhapChiuThue - bhNld - giamTru);
    thueTncn = thueLuyTien(thuNhapTinhThue, p);
  }

  const thucLinh = tongThuNhap - bhNld - thueTncn - v.khauTruKhac;
  return { luongChucDanh, luongKpi, phuCapThuc, tienAn, tienOt, tongThuNhap, bhXh, bhYt, bhTn, giamTru, thuNhapTinhThue, thueTncn, thucLinh, bhCty };
}

/** Công chuẩn của một tháng = số ngày trong tháng trừ số Chủ nhật (công ty làm thứ Hai–thứ Bảy), nên đổi theo từng tháng (24, 25, 26…).
 *  Cả văn phòng và vận hành dùng chung cách tính (chị Phượng 05/11: công chuẩn không cố định 24). Tham số `cong_chuan_van_phong` chỉ còn là mức dự phòng, không dùng để tính. */
export function congChuanTheoKy(_kieu: "van_phong" | "van_hanh", nam: number, thang: number, _congChuanDuPhong?: number): number {
  const soNgay = new Date(Date.UTC(nam, thang, 0)).getUTCDate();
  let chuNhat = 0;
  for (let d = 1; d <= soNgay; d++) if (new Date(Date.UTC(nam, thang - 1, d)).getUTCDay() === 0) chuNhat++;
  return soNgay - chuNhat;
}

/** Tham số mặc định (bản trong migration 0006) — dùng cho test và khi chưa đọc được từ database. */
export const THAM_SO_MAC_DINH: ThamSo = {
  cong_chuan_van_phong: 24,
  tien_an_ngay: 25000,
  mien_thue_tien_an: 730000,
  thu_viec_ty_le: 85,
  ot_thuong: 150,
  ot_nghi_tuan: 200,
  ot_le: 300,
  bhxh_nld: 8,
  bhyt_nld: 1.5,
  bhtn_nld: 1,
  bhxh_cty: 17.5,
  bhyt_cty: 3,
  bhtn_cty: 1,
  kpcd_cty: 2,
  tran_dong_bhxh_bhyt: 50600000,
  tran_dong_bhtn: 106200000,
  giam_tru_ban_than: 15500000,
  giam_tru_phu_thuoc: 6200000,
  thue_bac_1_den: 10000000,
  thue_bac_2_den: 30000000,
  thue_bac_3_den: 60000000,
  thue_bac_4_den: 100000000,
  thue_ty_le_1: 5,
  thue_ty_le_2: 10,
  thue_ty_le_3: 20,
  thue_ty_le_4: 30,
  thue_ty_le_5: 35,
  khau_tru_vang_lai_ty_le: 10,
  khau_tru_vang_lai_nguong: 2000000,
};

export const DAU_VAO_TRONG: DauVaoLuong = {
  luongThoaThuan: 0,
  tyLeKpi: 10,
  thuViec: false,
  congChuan: 24,
  congHuong: 24,
  ngayLam: 24,
  tyLeHtKpi: 100,
  phuCap: 0,
  phuCapMienThue: true,
  anCa: true,
  dongBh: true,
  soNguoiPhuThuoc: 0,
  gioOtThuong: 0,
  gioOtNghiTuan: 0,
  gioOtLe: 0,
  hoaHong: 0,
  thuongKhac: 0,
  khauTruKhac: 0,
};
