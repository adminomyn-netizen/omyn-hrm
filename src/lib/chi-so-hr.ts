/** Báo cáo HR: 10 nhóm, 29 chỉ số, tên tiếng Việt. Hàm thuần, không chạm DB.
 * Chỉ số chưa có dữ liệu để tính thì `giaTri` = null kèm `canNhap` (cần nhập gì, ở đâu), không bịa số. */
import { tinhBaoCaoTuyenDung } from "@/lib/tuyen-dung";
import { diemCacNguoi, type ChiTieu, type KetQuaNgay, type NguoiKpi } from "@/lib/kpi";
import type { KetQuaBienDong } from "@/lib/bien-dong";
import type { TongKy } from "@/lib/bao-cao-luong";

export type Bang = { cot: string[]; dong: string[][] };
export type ChiSo = {
  ma: string;
  ten: string;
  /** Con số chính; null = chưa có dữ liệu. */
  giaTri: string | null;
  phu?: string;
  bang?: Bang;
  /** Khi giaTri null (hoặc thiếu một nửa): cần nhập gì. */
  canNhap?: string;
  href?: string;
  hrefNhan?: string;
};
export type NhomChiSo = { so: number; ten: string; chiSo: ChiSo[] };

export type DuLieuHr = {
  homNay: string;
  nhanVien: { id: string; ten: string; khoi: string | null; khoiId: string | null; trangThai: string; ngayVao: string | null }[];
  tin: { id: string; trangThai: string; soLuongCan: number; yeuCauId: string | null; viTri: string }[];
  ungVien: { tinId: string; trangThai: string; nguon: string | null; ngayNhanHoSo: string | null; ngayNhanViec: string | null }[];
  kenh: { tinId: string; kenh: string; chiPhi: number }[];
  yeuCau: { id: string; trangThai: string; taoLuc: string }[];
  onboarding: { tinhTrang: string }[];
  nghi: { nhanVienId: string; ngayCuoi: string; lyDo: string | null; lyDoThat: string | null; trangThai: string }[];
  khoaHoc: { nhanVienId: string; trangThai: string; ngayHoanThanh: string | null }[];
  dinhBien: { khoiId: string; khoi: string; soNguoi: number }[];
  kpi: { chiTieu: ChiTieu[]; ketQua: KetQuaNgay[]; nguoi: NguoiKpi[]; phong: { ten: string; diem: number; soNguoi: number }[]; kyNhan: string };
  danhGia: { nhanVienId: string; xepLoai: string; luc: string }[];
  chuChot: { viTri: string; keCan: boolean }[];
  thangChuc: { loai: string; ngay: string }[];
  kyLuong: TongKy[];
  coCau: { kyId: string; coDinh: number; kpi: number; thuong: number }[];
  soLieuKy: { thang: string; doanhThu: number | null; nganSach: number | null }[];
  suKien: { ngay: string; loai: string; tieuDe: string; phu?: string }[];
  taiSan: { nhanVienId: string; ten: string; tinhTrang: string }[];
  tamUng: { nhanVienId: string; soTien: number; tinhTrang: string }[];
  bienDong: KetQuaBienDong;
};

const TIEN = (v: number) => `${Math.round(v).toLocaleString("vi-VN")} đ`;
const PT = (v: number | null, chuSo = 1) => (v === null ? "—" : `${v.toLocaleString("vi-VN", { maximumFractionDigits: chuSo })}%`);
const pt = (tu: number, mau: number) => (mau > 0 ? Math.round((tu / mau) * 1000) / 10 : null);
const ngayMs = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`);
const NGAY = 86_400_000;
const cong = (d: string, n: number) => new Date(ngayMs(d) + n * NGAY).toISOString().slice(0, 10);
const dmy = (d: string) => d.slice(0, 10).split("-").reverse().join("/");
const tb = (ds: number[]) => (ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null);

/** Gộp 4 mức đánh giá hiện có vào 3 hạng: A = Xuất sắc + Tốt, B = Đạt, C = Cần cải thiện (chờ chị Lâm xác nhận cách gộp). */
export const HANG_HIEU_SUAT: Record<string, "A" | "B" | "C"> = { "Xuất sắc": "A", "Tốt": "A", "Đạt": "B", "Cần cải thiện": "C" };

const trong = (ma: string, ten: string, canNhap: string, href?: string, hrefNhan?: string): ChiSo => ({ ma, ten, giaTri: null, canNhap, href, hrefNhan });

export function tinhChiSoHr(d: DuLieuHr): NhomChiSo[] {
  const dangLam = d.nhanVien.filter((n) => n.trangThai !== "Đã nghỉ");
  const tenNv = new Map(d.nhanVien.map((n) => [n.id, n.ten]));

  // ─── 1. Tuyển dụng ───
  const tuyen = tinhBaoCaoTuyenDung({
    tin: d.tin.map((t) => ({ id: t.id, vi_tri: t.viTri, so_luong_can: t.soLuongCan, yeu_cau_id: t.yeuCauId })),
    ungVien: d.ungVien.map((u) => ({ tin_tuyen_dung_id: u.tinId, trang_thai: u.trangThai, nguon: u.nguon, ngay_nhan_viec: u.ngayNhanViec })),
    kenh: d.kenh.map((k) => ({ tin_tuyen_dung_id: k.tinId, kenh: k.kenh, chi_phi: k.chiPhi })),
    yeuCau: d.yeuCau.map((y) => ({ id: y.id, trang_thai: y.trangThai, tao_luc: y.taoLuc })),
  });
  const tinMo = d.tin.filter((t) => t.trangThai !== "Đã đóng");
  const nhanViecTheoTin = (id: string) => d.ungVien.filter((u) => u.tinId === id && u.trangThai === "Nhận việc").length;
  const conThieu = tinMo.reduce((a, t) => a + Math.max(t.soLuongCan - nhanViecTheoTin(t.id), 0), 0);
  const ngayTuyen = d.ungVien.filter((u) => u.trangThai === "Nhận việc" && u.ngayNhanHoSo && u.ngayNhanViec).map((u) => Math.max(0, Math.round((ngayMs(u.ngayNhanViec!) - ngayMs(u.ngayNhanHoSo!)) / NGAY)));
  const tbTuyen = tb(ngayTuyen);
  const nhom1: ChiSo[] = [
    d.tin.length === 0
      ? trong("so-vi-tri-mo", "Số vị trí đang mở", "Tạo tin tuyển dụng (vị trí, số lượng cần) ở màn Tuyển dụng.", "/tuyen-dung", "Mở Tuyển dụng")
      : { ma: "so-vi-tri-mo", ten: "Số vị trí đang mở", giaTri: String(tinMo.length), phu: `Còn thiếu ${conThieu} người so với số cần`, bang: tinMo.length ? { cot: ["Vị trí", "Cần", "Đã nhận việc"], dong: tinMo.map((t) => [t.viTri, String(t.soLuongCan), String(nhanViecTheoTin(t.id))]) } : undefined },
    tuyen.ngayLapDayTb === null
      ? trong("thoi-gian-trong", "Thời gian trống vị trí", "Tạo yêu cầu tuyển dụng, gắn tin vào yêu cầu và ghi ngày nhận việc của ứng viên (từ lúc có yêu cầu đến khi có người nhận việc).", "/tuyen-dung", "Mở Tuyển dụng")
      : { ma: "thoi-gian-trong", ten: "Thời gian trống vị trí", giaTri: `${tuyen.ngayLapDayTb} ngày`, phu: "Từ lúc có yêu cầu đến ngày nhận việc đầu tiên" },
    tbTuyen === null
      ? trong("thoi-gian-tuyen", "Thời gian tuyển trung bình", "Ghi ngày nhận hồ sơ và ngày nhận việc của từng ứng viên đã nhận việc.", "/tuyen-dung", "Mở Tuyển dụng")
      : { ma: "thoi-gian-tuyen", ten: "Thời gian tuyển trung bình", giaTri: `${Math.round(tbTuyen)} ngày`, phu: `Từ nhận hồ sơ đến nhận việc, ${ngayTuyen.length} người` },
    tuyen.chiPhiMoiNguoi === null
      ? trong("chi-phi-tuyen", "Chi phí tuyển dụng / nhân sự", d.kenh.length ? "Chưa có ứng viên nào ở bước Nhận việc để chia chi phí." : "Ghi chi phí từng kênh đăng tin ở màn Tuyển dụng.", "/tuyen-dung", "Mở Tuyển dụng")
      : { ma: "chi-phi-tuyen", ten: "Chi phí tuyển dụng / nhân sự", giaTri: TIEN(tuyen.chiPhiMoiNguoi), phu: `Tổng ${TIEN(tuyen.tongChiPhi)} cho ${tuyen.soNhanViec} người nhận việc` },
    d.ungVien.length === 0
      ? trong("kenh-tuyen", "Hiệu quả kênh tuyển dụng", "Ghi nguồn của từng ứng viên (TopCV, Facebook, giới thiệu…).", "/tuyen-dung", "Mở Tuyển dụng")
      : {
          ma: "kenh-tuyen", ten: "Hiệu quả kênh tuyển dụng", giaTri: `${tuyen.theoNguon.length} nguồn`,
          bang: { cot: ["Nguồn", "Ứng viên", "Nhận việc", "Tỷ lệ nhận việc"], dong: tuyen.theoNguon.map((n) => [n.nguon, String(n.so), String(n.nhanViec), PT(pt(n.nhanViec, n.so))]) },
        },
  ];

  // ─── 2. Onboarding và thử việc ───
  const tv = (t: string) => d.onboarding.filter((o) => o.tinhTrang === t).length;
  const daKetThuc = tv("Đạt, lên chính thức") + tv("Không đạt") + tv("Nghỉ giữa chừng");
  const homNay = d.homNay;
  const hanChot = cong(homNay, -90);
  const ngayNghi = new Map<string, string>();
  for (const n of d.nghi) if (n.trangThai === "Đã đóng") { const c = ngayNghi.get(n.nhanVienId); if (!c || n.ngayCuoi > c) ngayNghi.set(n.nhanVienId, n.ngayCuoi); }
  const dotVao = d.nhanVien.filter((n) => n.ngayVao && n.ngayVao <= hanChot && n.ngayVao >= cong(hanChot, -365));
  const nghiSom = dotVao.filter((n) => { const g = ngayNghi.get(n.id); return !!g && ngayMs(g) - ngayMs(n.ngayVao!) <= 90 * NGAY; });
  const nhom2: ChiSo[] = [
    daKetThuc === 0
      ? trong("dat-thu-viec", "Tỷ lệ đạt thử việc", "Cập nhật tình trạng thử việc (Đạt / Không đạt / Nghỉ giữa chừng) ở màn Onboarding.", "/hr/onboarding", "Mở Onboarding")
      : { ma: "dat-thu-viec", ten: "Tỷ lệ đạt thử việc", giaTri: PT(pt(tv("Đạt, lên chính thức"), daKetThuc)), phu: `${tv("Đạt, lên chính thức")} đạt / ${daKetThuc} người đã kết thúc thử việc` },
    dotVao.length === 0
      ? trong("nghi-som-90", "Tỷ lệ nghỉ việc sớm trong 90 ngày", "Cần ngày vào làm của nhân sự đã vào từ hơn 90 ngày, và hồ sơ nghỉ việc đã đóng có ngày làm việc cuối.", "/nhan-su", "Mở Hồ sơ nhân sự")
      : { ma: "nghi-som-90", ten: "Tỷ lệ nghỉ việc sớm trong 90 ngày", giaTri: PT(pt(nghiSom.length, dotVao.length)), phu: `${nghiSom.length} người nghỉ trong 90 ngày đầu / ${dotVao.length} người vào trong 12 tháng tới mốc ${dmy(hanChot)}` },
  ];

  // ─── 3. Hồ sơ nhân sự ───
  const theoKhoi = [...new Set(dangLam.map((n) => n.khoi ?? "Chưa gán khối"))].sort((a, b) => a.localeCompare(b, "vi"));
  const demKhoi = (k: string) => dangLam.filter((n) => (n.khoi ?? "Chưa gán khối") === k).length;
  const soVoi = d.dinhBien.map((b) => {
    const co = dangLam.filter((n) => n.khoiId === b.khoiId).length;
    return { ...b, co, chenh: co - b.soNguoi };
  });
  const nhom3: ChiSo[] = [
    dangLam.length === 0
      ? trong("so-nguoi-phong", "Tổng nhân sự theo phòng ban", "Thêm nhân sự ở màn Hồ sơ nhân sự.", "/nhan-su", "Mở Hồ sơ nhân sự")
      : { ma: "so-nguoi-phong", ten: "Tổng nhân sự theo phòng ban", giaTri: `${dangLam.length} người`, bang: { cot: ["Phòng ban", "Số người"], dong: theoKhoi.map((k) => [k, String(demKhoi(k))]) } },
    soVoi.length === 0
      ? trong("dinh-bien", "Định biên và thực tế nhân sự", "Nhập số người định biên của từng khối.", "/hr/dinh-bien", "Nhập định biên")
      : {
          ma: "dinh-bien", ten: "Định biên và thực tế nhân sự", giaTri: `${soVoi.reduce((a, b) => a + b.co, 0)} / ${soVoi.reduce((a, b) => a + b.soNguoi, 0)}`,
          phu: "Thực tế / định biên của các khối đã khai báo",
          bang: { cot: ["Khối", "Định biên", "Thực tế", "Chênh lệch"], dong: soVoi.map((b) => [b.khoi, String(b.soNguoi), String(b.co), `${b.chenh > 0 ? "+" : ""}${b.chenh}`]) },
          canNhap: soVoi.length < new Set(d.nhanVien.map((n) => n.khoiId).filter(Boolean)).size ? "Một số khối chưa có định biên." : undefined, href: "/hr/dinh-bien", hrefNhan: "Nhập định biên",
        },
  ];

  // ─── 4. Đào tạo ───
  const kh = d.khoaHoc;
  const hoanThanh = kh.filter((k) => k.trangThai === "Đã hoàn thành");
  const truoc = (ngay: string) => ({ tu: cong(ngay, -30), den: cong(ngay, -1) });
  const sau = (ngay: string) => ({ tu: cong(ngay, 1), den: cong(ngay, 30) });
  const diemKhoang = (id: string, tu: string, den: string) => {
    const nguoi = d.kpi.nguoi.filter((n) => n.id === id);
    if (!nguoi.length) return null;
    const kq = d.kpi.ketQua.filter((r) => r.nhanVienId === id && r.ngay >= tu && r.ngay <= den);
    if (!kq.length) return null;
    return diemCacNguoi(nguoi, d.kpi.chiTieu, kq).get(id)?.diem ?? null;
  };
  const chenhKpi: number[] = [];
  for (const k of hoanThanh) {
    if (!k.ngayHoanThanh || cong(k.ngayHoanThanh, 30) > homNay) continue;
    const a = truoc(k.ngayHoanThanh), b = sau(k.ngayHoanThanh);
    const x = diemKhoang(k.nhanVienId, a.tu, a.den), y = diemKhoang(k.nhanVienId, b.tu, b.den);
    if (x !== null && y !== null) chenhKpi.push(y - x);
  }
  const nhom4: ChiSo[] = [
    kh.length === 0
      ? trong("hoan-thanh-dao-tao", "Tỷ lệ hoàn thành lộ trình đào tạo", "Ghi khoá học của từng người ở màn Khoá học và chứng chỉ.", "/hr/khoa-hoc-chung-chi", "Mở Khoá học và chứng chỉ")
      : { ma: "hoan-thanh-dao-tao", ten: "Tỷ lệ hoàn thành lộ trình đào tạo", giaTri: PT(pt(hoanThanh.length, kh.length)), phu: `${hoanThanh.length} hoàn thành / ${kh.length} khoá đã ghi` },
    chenhKpi.length === 0
      ? trong("hieu-qua-dao-tao", "Hiệu quả đào tạo: KPI trước và sau đào tạo", "Cần khoá học đã hoàn thành có ngày hoàn thành quá 30 ngày, và người học có kết quả KPI ở 30 ngày trước lẫn 30 ngày sau.", "/hr/khoa-hoc-chung-chi", "Mở Khoá học và chứng chỉ")
      : { ma: "hieu-qua-dao-tao", ten: "Hiệu quả đào tạo: KPI trước và sau đào tạo", giaTri: `${tb(chenhKpi)! >= 0 ? "+" : ""}${(Math.round(tb(chenhKpi)! * 10) / 10).toLocaleString("vi-VN")} điểm`, phu: `Điểm KPI 30 ngày sau trừ 30 ngày trước, trung bình ${chenhKpi.length} lượt học` },
  ];

  // ─── 5. Hiệu suất ───
  const moiNhat = new Map<string, { xepLoai: string; luc: string }>();
  for (const g of [...d.danhGia].sort((a, b) => a.luc.localeCompare(b.luc))) moiNhat.set(g.nhanVienId, { xepLoai: g.xepLoai, luc: g.luc });
  const phanLoai = { A: 0, B: 0, C: 0 };
  for (const g of moiNhat.values()) { const h = HANG_HIEU_SUAT[g.xepLoai]; if (h) phanLoai[h]++; }
  const tongPl = phanLoai.A + phanLoai.B + phanLoai.C;
  const thapLienTiep = [...new Set(d.danhGia.map((g) => g.nhanVienId))].filter((id) => {
    const ds = d.danhGia.filter((g) => g.nhanVienId === id).sort((a, b) => b.luc.localeCompare(a.luc));
    return ds.length >= 2 && HANG_HIEU_SUAT[ds[0].xepLoai] === "C" && HANG_HIEU_SUAT[ds[1].xepLoai] === "C";
  });
  const nhom5: ChiSo[] = [
    d.kpi.phong.length === 0
      ? trong("kpi-phong", "Tỷ lệ hoàn thành KPI theo phòng ban", "Nhập kết quả KPI hằng ngày của từng người ở màn Thi đua KPI.", "/kpi", "Mở Thi đua KPI")
      : { ma: "kpi-phong", ten: "Tỷ lệ hoàn thành KPI theo phòng ban", giaTri: PT(tb(d.kpi.phong.map((p) => p.diem)), 0), phu: `${d.kpi.kyNhan}, trung bình các phòng`, bang: { cot: ["Phòng ban", "Điểm KPI", "Số người"], dong: d.kpi.phong.map((p) => [p.ten, PT(p.diem, 0), String(p.soNguoi)]) } },
    tongPl === 0
      ? trong("phan-loai-hs", "Phân loại hiệu suất A / B / C", "Chấm đánh giá hiệu suất từng người ở màn Đánh giá hiệu suất.", "/danh-gia", "Mở Đánh giá hiệu suất")
      : { ma: "phan-loai-hs", ten: "Phân loại hiệu suất A / B / C", giaTri: `A ${phanLoai.A} · B ${phanLoai.B} · C ${phanLoai.C}`, phu: "Theo đánh giá gần nhất của từng người. A = Xuất sắc và Tốt, B = Đạt, C = Cần cải thiện (cách gộp chờ chị Lâm xác nhận)", bang: { cot: ["Hạng", "Số người", "Tỷ lệ"], dong: (["A", "B", "C"] as const).map((h) => [h, String(phanLoai[h]), PT(pt(phanLoai[h], tongPl))]) } },
    d.danhGia.length === 0
      ? trong("hieu-suat-thap", "Nhân sự hiệu suất thấp liên tiếp", "Cần ít nhất hai kỳ đánh giá hiệu suất của cùng một người.", "/danh-gia", "Mở Đánh giá hiệu suất")
      : { ma: "hieu-suat-thap", ten: "Nhân sự hiệu suất thấp liên tiếp", giaTri: `${thapLienTiep.length} người`, phu: "Hạng C ở hai kỳ đánh giá gần nhất", bang: thapLienTiep.length ? { cot: ["Nhân sự"], dong: thapLienTiep.map((id) => [tenNv.get(id) ?? "—"]) } : undefined },
  ];

  // ─── 6. Thăng tiến ───
  const coKeCan = d.chuChot.filter((c) => c.keCan).length;
  const namTruoc = cong(homNay, -365);
  const luotTT = d.thangChuc.filter((t) => ["Thăng chức", "Bổ nhiệm"].includes(t.loai) && t.ngay >= namTruoc && t.ngay <= homNay);
  const nhom6: ChiSo[] = [
    d.chuChot.length === 0
      ? trong("ke-can", "Tỷ lệ vị trí chủ chốt có kế cận", "Khai báo các vị trí chủ chốt, người đang giữ và người kế cận.", "/hr/vi-tri-chu-chot", "Nhập vị trí chủ chốt")
      : { ma: "ke-can", ten: "Tỷ lệ vị trí chủ chốt có kế cận", giaTri: PT(pt(coKeCan, d.chuChot.length)), phu: `${coKeCan} / ${d.chuChot.length} vị trí đã có người kế cận` },
    d.thangChuc.length === 0
      ? trong("thang-chuc", "Số lượt thăng chức, nâng bậc", "Ghi mỗi lần thăng chức, điều chuyển ở màn Lịch sử thăng chức và điều chuyển.", "/hr/thang-chuc-dieu-chuyen", "Mở Lịch sử thăng chức")
      : { ma: "thang-chuc", ten: "Số lượt thăng chức, nâng bậc", giaTri: `${luotTT.length} lượt`, phu: `12 tháng gần nhất (thăng chức và bổ nhiệm), chiếm ${PT(pt(luotTT.length, dangLam.length))} số người đang làm` },
  ];

  // ─── 7. Công lương ───
  const kyCoNguoi = d.kyLuong.filter((k) => k.soNguoi > 0);
  const kyMoi = kyCoNguoi[kyCoNguoi.length - 1];
  const thangKy = kyMoi ? `${kyMoi.nam}-${String(kyMoi.thang).padStart(2, "0")}` : null;
  const soLieu = thangKy ? d.soLieuKy.find((s) => s.thang === thangKy) : undefined;
  const cc = kyMoi ? d.coCau.filter((c) => c.kyId === kyMoi.id).reduce((a, c) => ({ coDinh: a.coDinh + c.coDinh, kpi: a.kpi + c.kpi, thuong: a.thuong + c.thuong }), { coDinh: 0, kpi: 0, thuong: 0 }) : null;
  const tongCc = cc ? cc.coDinh + cc.kpi + cc.thuong : 0;
  const CAN_LUONG = "Lập bảng lương một kỳ ở màn Bảng lương.";
  const nhom7: ChiSo[] = [
    !kyMoi
      ? trong("quy-luong-ns", "Quỹ lương thực tế và ngân sách", `${CAN_LUONG} Nhập thêm ngân sách quỹ lương của tháng.`, "/hr/doanh-thu-ngan-sach", "Nhập ngân sách")
      : { ma: "quy-luong-ns", ten: "Quỹ lương thực tế và ngân sách", giaTri: TIEN(kyMoi.tongThuNhap), phu: soLieu?.nganSach ? `${kyMoi.ten}: ngân sách ${TIEN(soLieu.nganSach)}, ${kyMoi.tongThuNhap <= soLieu.nganSach ? "còn" : "vượt"} ${TIEN(Math.abs(soLieu.nganSach - kyMoi.tongThuNhap))}` : `${kyMoi.ten}: chưa có ngân sách để so sánh`, canNhap: soLieu?.nganSach ? undefined : `Nhập ngân sách quỹ lương của tháng ${thangKy}.`, href: "/hr/doanh-thu-ngan-sach", hrefNhan: "Nhập ngân sách" },
    !kyMoi || !soLieu?.doanhThu
      ? trong("luong-doanh-thu", "Tỷ lệ quỹ lương / doanh thu", `${!kyMoi ? `${CAN_LUONG} ` : ""}Nhập doanh thu của tháng${thangKy ? ` ${thangKy}` : ""}.`, "/hr/doanh-thu-ngan-sach", "Nhập doanh thu")
      : { ma: "luong-doanh-thu", ten: "Tỷ lệ quỹ lương / doanh thu", giaTri: PT(pt(kyMoi.tongThuNhap, soLieu.doanhThu)), phu: `${kyMoi.ten}: quỹ lương ${TIEN(kyMoi.tongThuNhap)} / doanh thu ${TIEN(soLieu.doanhThu)}` },
    !kyMoi || tongCc <= 0
      ? trong("co-cau-thu-nhap", "Cơ cấu thu nhập: cố định / KPI / thưởng", CAN_LUONG, "/luong", "Mở Bảng lương")
      : { ma: "co-cau-thu-nhap", ten: "Cơ cấu thu nhập: cố định / KPI / thưởng", giaTri: `${PT(pt(cc!.coDinh, tongCc), 0)} / ${PT(pt(cc!.kpi, tongCc), 0)} / ${PT(pt(cc!.thuong, tongCc), 0)}`, phu: `${kyMoi.ten}. Thưởng gồm thưởng khác và hoa hồng; chưa tính phụ cấp, tăng ca`, bang: { cot: ["Khoản", "Số tiền", "Tỷ lệ"], dong: [["Cố định", cc!.coDinh], ["KPI", cc!.kpi], ["Thưởng", cc!.thuong]].map(([k, v]) => [String(k), TIEN(v as number), PT(pt(v as number, tongCc))]) } },
    !kyMoi
      ? trong("chi-phi-binh-quan", "Chi phí nhân sự bình quân", CAN_LUONG, "/luong", "Mở Bảng lương")
      : { ma: "chi-phi-binh-quan", ten: "Chi phí nhân sự bình quân", giaTri: TIEN(kyMoi.chiPhiCty / kyMoi.soNguoi), phu: `${kyMoi.ten}: chi phí công ty ${TIEN(kyMoi.chiPhiCty)} / ${kyMoi.soNguoi} người` },
    !kyMoi || !soLieu?.doanhThu
      ? trong("doanh-thu-binh-quan", "Doanh thu bình quân / nhân sự", `${!kyMoi ? `${CAN_LUONG} ` : ""}Nhập doanh thu của tháng${thangKy ? ` ${thangKy}` : ""}.`, "/hr/doanh-thu-ngan-sach", "Nhập doanh thu")
      : { ma: "doanh-thu-binh-quan", ten: "Doanh thu bình quân / nhân sự", giaTri: TIEN(soLieu.doanhThu / kyMoi.soNguoi), phu: `${kyMoi.ten}: doanh thu ${TIEN(soLieu.doanhThu)} / ${kyMoi.soNguoi} người trong bảng lương` },
  ];

  // ─── 8. Lịch ───
  const han60 = cong(homNay, 60);
  const ev = (loai: string) => d.suKien.filter((e) => e.loai === loai && e.ngay >= homNay && e.ngay <= han60);
  const bangEv = (ds: typeof d.suKien): Bang => ({ cot: ["Ngày", "Nội dung"], dong: ds.map((e) => [dmy(e.ngay), e.phu ? `${e.tieuDe} (${e.phu})` : e.tieuDe]) });
  const hd = ev("hop-dong"), thu = ev("thu-viec"), dg = ev("danh-gia");
  const nhom8: ChiSo[] = [
    { ma: "hop-dong-den-han", ten: "Hợp đồng lao động đến hạn", giaTri: `${hd.length} hợp đồng`, phu: "Hết hạn trong 60 ngày tới (tính tới hết tháng sau)", bang: hd.length ? bangEv(hd) : undefined, canNhap: undefined, href: "/hr/hop-dong-lao-dong", hrefNhan: "Mở Hợp đồng lao động" },
    { ma: "het-thu-viec", ten: "Nhân sự hết hạn thử việc", giaTri: `${thu.length} người`, phu: "Hết thử việc trong 60 ngày tới (tính tới hết tháng sau)", bang: thu.length ? bangEv(thu) : undefined },
    { ma: "lich-danh-gia", ten: "Lịch đánh giá định kỳ", giaTri: `${dg.length} lượt`, phu: "Đánh giá thử việc 30/60 ngày và đánh giá tái ký (45 ngày trước hết hạn hợp đồng)", bang: dg.length ? bangEv(dg) : undefined, href: "/lich-nhan-su", hrefNhan: "Mở Lịch nhân sự" },
  ];

  // ─── 9. Offboarding ───
  const nghiThat = d.nghi.filter((n) => n.trangThai !== "Huỷ");
  const lyDo = new Map<string, number>();
  for (const n of nghiThat) { const k = (n.lyDoThat?.trim() || n.lyDo?.trim() || "Chưa ghi lý do"); lyDo.set(k, (lyDo.get(k) ?? 0) + 1); }
  const dsLyDo = [...lyDo].sort((a, b) => b[1] - a[1]);
  const daNghiIds = new Set(d.nhanVien.filter((n) => n.trangThai === "Đã nghỉ").map((n) => n.id));
  const nghiChuaDong = new Set(d.nghi.filter((n) => n.trangThai === "Đang bàn giao").map((n) => n.nhanVienId));
  const taiSanGiu = d.taiSan.filter((t) => t.tinhTrang === "Đang giữ" && (daNghiIds.has(t.nhanVienId) || nghiChuaDong.has(t.nhanVienId)));
  const tamUngGiu = d.tamUng.filter((t) => t.tinhTrang === "Chưa thu hồi" && (daNghiIds.has(t.nhanVienId) || nghiChuaDong.has(t.nhanVienId)));
  const tongTamUng = tamUngGiu.reduce((a, t) => a + t.soTien, 0);
  const nhom9: ChiSo[] = [
    nghiThat.length === 0
      ? trong("ly-do-nghi", "Phân tích lý do nghỉ việc", "Mở hồ sơ nghỉ việc và ghi lý do (lý do thật ghi ở phỏng vấn thôi việc).", "/nghi-viec", "Mở Nghỉ việc và bàn giao")
      : { ma: "ly-do-nghi", ten: "Phân tích lý do nghỉ việc", giaTri: `${nghiThat.length} lượt nghỉ`, phu: "Ưu tiên lý do thật từ phỏng vấn thôi việc, không có thì lấy lý do ghi trên đơn", bang: { cot: ["Lý do", "Số lượt", "Tỷ lệ"], dong: dsLyDo.map(([k, v]) => [k, String(v), PT(pt(v, nghiThat.length))]) } },
    d.taiSan.length === 0 && d.tamUng.length === 0
      ? trong("tai-san-tam-ung", "Tài sản và tạm ứng chưa thu hồi", "Ghi tài sản đã cấp ở màn Tài sản cấp phát và các khoản tạm ứng ở màn Tạm ứng nhân viên.", "/hr/tam-ung", "Nhập tạm ứng")
      : {
          ma: "tai-san-tam-ung", ten: "Tài sản và tạm ứng chưa thu hồi", giaTri: `${taiSanGiu.length} tài sản · ${TIEN(tongTamUng)}`, phu: "Của người đã nghỉ hoặc đang bàn giao",
          bang: taiSanGiu.length + tamUngGiu.length ? { cot: ["Nhân sự", "Khoản chưa thu hồi"], dong: [...taiSanGiu.map((t) => [tenNv.get(t.nhanVienId) ?? "—", `Tài sản: ${t.ten}`]), ...tamUngGiu.map((t) => [tenNv.get(t.nhanVienId) ?? "—", `Tạm ứng: ${TIEN(t.soTien)}`])] } : undefined,
          canNhap: d.tamUng.length === 0 ? "Chưa có khoản tạm ứng nào được ghi, nên phần tạm ứng đang là 0." : undefined, href: "/hr/tam-ung", hrefNhan: "Nhập tạm ứng",
        },
  ];

  // ─── 10. Báo cáo tổng ───
  const bd = d.bienDong;
  const coBienDong = bd.thang.some((t) => t.vao > 0 || t.ra > 0 || t.cuoiKy > 0);
  const gioi = [...moiNhat].filter(([, g]) => HANG_HIEU_SUAT[g.xepLoai] === "A").map(([id]) => id);
  const gioiNghi = gioi.filter((id) => { const g = ngayNghi.get(id); return !!g && g >= namTruoc && g <= homNay; });
  const nhom10: ChiSo[] = [
    !coBienDong
      ? trong("bien-dong", "Biến động nhân sự: tuyển mới / nghỉ việc / tăng giảm thuần", "Cần ngày vào làm của nhân sự và hồ sơ nghỉ việc đã đóng.", "/bien-dong-nhan-su", "Mở Biến động nhân sự")
      : { ma: "bien-dong", ten: "Biến động nhân sự: tuyển mới / nghỉ việc / tăng giảm thuần", giaTri: `${bd.tongVao} / ${bd.tongRa} / ${bd.tongVao - bd.tongRa >= 0 ? "+" : ""}${bd.tongVao - bd.tongRa}`, phu: "12 tháng gần nhất", href: "/bien-dong-nhan-su", hrefNhan: "Xem từng tháng", canNhap: bd.thieuNgayNghi ? `${bd.thieuNgayNghi} người đã nghỉ nhưng chưa có hồ sơ nghỉ việc đã đóng nên chưa tính.` : undefined },
    !coBienDong
      ? trong("ty-le-nghi", "Tỷ lệ nghỉ việc theo phòng ban", "Cần ngày vào làm của nhân sự và hồ sơ nghỉ việc đã đóng.", "/ty-le-nghi-viec", "Mở Tỷ lệ nghỉ việc")
      : { ma: "ty-le-nghi", ten: "Tỷ lệ nghỉ việc theo phòng ban", giaTri: PT(bd.tyLeNam), phu: "Tỷ lệ chung 12 tháng gần nhất", bang: { cot: ["Phòng ban", "Đang làm", "Nghỉ trong kỳ", "Tỷ lệ"], dong: bd.theoKhoi.map((k) => [k.khoi, String(k.dangLam), String(k.raTrongKy), PT(k.tyLe)]) }, href: "/ty-le-nghi-viec", hrefNhan: "Xem chi tiết" },
    gioi.length === 0
      ? trong("nghi-gioi", "Tỷ lệ nghỉ việc nhân sự giỏi", "Cần đánh giá hiệu suất hạng A (Xuất sắc, Tốt) và hồ sơ nghỉ việc đã đóng.", "/danh-gia", "Mở Đánh giá hiệu suất")
      : { ma: "nghi-gioi", ten: "Tỷ lệ nghỉ việc nhân sự giỏi", giaTri: PT(pt(gioiNghi.length, gioi.length)), phu: `${gioiNghi.length} nghỉ trong 12 tháng / ${gioi.length} người từng được xếp hạng A (kể cả đã nghỉ)` },
  ];

  return [
    { so: 1, ten: "Tuyển dụng", chiSo: nhom1 },
    { so: 2, ten: "Onboarding và thử việc", chiSo: nhom2 },
    { so: 3, ten: "Hồ sơ nhân sự", chiSo: nhom3 },
    { so: 4, ten: "Đào tạo", chiSo: nhom4 },
    { so: 5, ten: "Hiệu suất", chiSo: nhom5 },
    { so: 6, ten: "Thăng tiến", chiSo: nhom6 },
    { so: 7, ten: "Công lương", chiSo: nhom7 },
    { so: 8, ten: "Lịch", chiSo: nhom8 },
    { so: 9, ten: "Offboarding", chiSo: nhom9 },
    { so: 10, ten: "Báo cáo tổng", chiSo: nhom10 },
  ];
}
