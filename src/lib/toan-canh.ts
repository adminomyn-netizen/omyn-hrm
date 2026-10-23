import "server-only";
import { createAdminClient } from "./supabase/admin";
import { nenLaQuanTri, khongCanChamCong } from "./chuc-danh";
import { LOAI_DON, PHEP_NAM_MOI_NAM, demNgayPhep } from "./don-tu";
import { ngayHomNayHCM } from "./data";
import { tienVN } from "./dinh-dang";

export type ChiSo = { nhan: string; so: string; phu?: string };
export type PhanBo = { nhan: string; so: number }[];
export type ToanCanh = {
  nhom: { ten: string; chiSo: ChiSo[] }[];
  phanBo: { ten: string; donVi: string; dong: PhanBo }[];
  chamCong7Ngay: { ngay: string; so: number }[];
};

const so = (n: number) => n.toLocaleString("vi-VN");
const tyLe = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");
const dem = <T,>(ds: T[], kho: (x: T) => string): PhanBo => {
  const m = new Map<string, number>();
  for (const x of ds) m.set(kho(x), (m.get(kho(x)) ?? 0) + 1);
  return [...m.entries()].map(([nhan, n]) => ({ nhan, so: n })).sort((a, b) => b.so - a.so);
};
const congNgay = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Toàn bộ số liệu công ty + tài khoản + hệ thống cho tài khoản Kỹ thuật (xem được mọi chỉ số, kể cả lương). */
export async function layToanCanhKyThuat(): Promise<ToanCanh> {
  const db = createAdminClient();
  const homNay = ngayHomNayHCM();
  const [nam, thang] = homNay.split("-").map(Number);
  const dauThang = `${nam}-${String(thang).padStart(2, "0")}-01`;
  const dau7 = congNgay(homNay, -6);
  const nhatKy24h = new Date(Date.now() - 864e5).toISOString();

  const [nv, ccThang, don, uv, tin, ky, bl, tham, thoa, dg, khoi, nk, nkTong, ds] = await Promise.all([
    db.from("nhan_vien").select("id, chuc_danh, trang_thai, ngay_vao_lam, user_id, khoi(ten)"),
    db.from("cham_cong").select("nhan_vien_id, ngay, gio_vao, gio_ra, trang_thai").gte("ngay", dauThang),
    db.from("don_tu").select("nhan_vien_id, loai, trang_thai, tu_ngay, den_ngay, created_at"),
    db.from("ung_vien").select("trang_thai, ngay_nhan_ho_so, ngay_phong_van"),
    db.from("tin_tuyen_dung").select("trang_thai, so_luong_can"),
    db.from("ky_luong").select("trang_thai, ten_ky, nam, thang").order("nam", { ascending: false }).order("thang", { ascending: false }),
    db.from("bang_luong").select("ky_luong_id, tong_thu_nhap, thuc_linh, thue_tncn, bh_xh, bh_yt, bh_tn, bh_cty, tien_ot"),
    db.from("tham_so_luong").select("xac_nhan_luc"),
    db.from("luong_thoa_thuan").select("nhan_vien_id, luong_thoa_thuan"),
    db.from("danh_gia_hieu_suat").select("diem, xep_loai"),
    db.from("khoi").select("id", { count: "exact", head: true }),
    db.from("nhat_ky").select("id", { count: "exact", head: true }).gte("thoi_diem", nhatKy24h),
    db.from("nhat_ky").select("id", { count: "exact", head: true }),
    db.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);
  for (const r of [nv, ccThang, don, uv, tin, ky, bl, tham, thoa, dg, khoi, nk, nkTong]) if (r.error) throw r.error;
  if (ds.error) throw ds.error;

  // ── nhân sự
  const hoSo = nv.data!;
  const dangLam = hoSo.filter((n) => n.trang_thai !== "Đã nghỉ");
  const viTri = (n: (typeof hoSo)[number]) => ({ chucDanh: n.chuc_danh, khoi: (n.khoi as { ten?: string } | null)?.ten ?? null });
  const namVaoLam = dangLam.filter((n) => n.ngay_vao_lam);
  const thamNienTb = namVaoLam.length ? namVaoLam.reduce((t, n) => t + (Date.parse(homNay) - Date.parse(n.ngay_vao_lam as string)) / (365.25 * 864e5), 0) / namVaoLam.length : 0;

  // ── tài khoản (vai trò hiệu lực: Quản trị đặt cứng theo vị trí)
  const hoSoTheoUser = new Map(hoSo.filter((n) => n.user_id).map((n) => [n.user_id as string, n]));
  const vaiTroHieuLuc = (u: (typeof ds.data.users)[number]) => {
    const luu = String(u.app_metadata?.vai_tro ?? "");
    if (luu === "ky_thuat") return "Kỹ thuật";
    if (luu === "admin") return "Quản trị";
    if (luu !== "nhan_vien") return "Chờ duyệt";
    const h = hoSoTheoUser.get(u.id);
    return h && h.trang_thai !== "Đã nghỉ" && nenLaQuanTri(h.chuc_danh, viTri(h).khoi) ? "Quản trị" : "Nhân viên";
  };
  const taiKhoan = ds.data.users;
  const theoVaiTro = dem(taiKhoan, vaiTroHieuLuc);
  const dem7 = Date.now() - 7 * 864e5;
  const dangNhap7 = taiKhoan.filter((u) => u.last_sign_in_at && Date.parse(u.last_sign_in_at) >= dem7).length;
  const chuaTungDangNhap = taiKhoan.filter((u) => !u.last_sign_in_at).length;
  const kyThuatIds = new Set(taiKhoan.filter((u) => u.app_metadata?.vai_tro === "ky_thuat").map((u) => u.id));
  const phaiChamCong = dangLam.filter((n) => !khongCanChamCong(n.user_id && kyThuatIds.has(n.user_id) ? "ky_thuat" : null, n.chuc_danh));
  const phaiChamCongIds = new Set(phaiChamCong.map((n) => n.id));

  // ── chấm công
  const cc = ccThang.data!;
  const ccHomNay = cc.filter((c) => c.ngay === homNay);
  const muonHomNay = ccHomNay.filter((c) => c.trang_thai === "Đi muộn").length;
  const muonThang = cc.filter((c) => c.trang_thai === "Đi muộn").length;
  const vangThang = cc.filter((c) => c.trang_thai === "Vắng mặt").length;
  const coMat = cc.filter((c) => c.trang_thai !== "Vắng mặt");
  const phut = coMat.map((c) => c.gio_vao).filter(Boolean).map((g) => Number((g as string).slice(0, 2)) * 60 + Number((g as string).slice(3, 5)));
  const gioVaoTb = phut.length ? Math.round(phut.reduce((a, b) => a + b, 0) / phut.length) : null;
  const chuaRa = ccHomNay.filter((c) => !c.gio_ra).length;
  const nguoiCoCong = new Set(coMat.map((c) => c.nhan_vien_id)).size;
  const chamCong7Ngay = Array.from({ length: 7 }, (_, i) => {
    const ngay = congNgay(dau7, i);
    return { ngay, so: cc.filter((c) => c.ngay === ngay).length };
  });

  // ── đơn từ
  const donDs = don.data!;
  const donCho = donDs.filter((d) => d.trang_thai === "Chờ duyệt").length;
  const donDuyet = donDs.filter((d) => d.trang_thai === "Đã duyệt").length;
  const donTuChoi = donDs.filter((d) => d.trang_thai === "Từ chối").length;
  const donThang = donDs.filter((d) => d.created_at.slice(0, 10) >= dauThang).length;
  const phepDung = donDs
    .filter((d) => d.loai === "Nghỉ phép năm" && d.trang_thai !== "Từ chối" && d.tu_ngay.startsWith(String(nam)))
    .reduce((t, d) => t + demNgayPhep(d.tu_ngay, d.den_ngay), 0);
  const donLauNhat = donDs.filter((d) => d.trang_thai === "Chờ duyệt").map((d) => Math.floor((Date.now() - Date.parse(d.created_at)) / 864e5));

  // ── tuyển dụng
  const uvDs = uv.data!;
  const tinDs = tin.data!;
  const BUOC = ["Mới nộp", "Hẹn phỏng vấn", "Vòng 1", "Vòng 2", "Đề nghị", "Nhận việc"];
  const phePhao = BUOC.map((b) => ({ nhan: b, so: uvDs.filter((u) => u.trang_thai === b).length }));
  const uv30 = uvDs.filter((u) => u.ngay_nhan_ho_so >= congNgay(homNay, -29)).length;
  const sapPv = uvDs.filter((u) => u.ngay_phong_van && u.ngay_phong_van >= homNay).length;
  const tinMo = tinDs.filter((t) => t.trang_thai !== "Đã đóng");

  // ── lương
  const kyDs = ky.data!;
  const kyGanNhat = kyDs[0];
  const dongLuong = bl.data!;
  const cong = (k: "tong_thu_nhap" | "thuc_linh" | "thue_tncn" | "tien_ot") => dongLuong.reduce((t, d) => t + Number(d[k]), 0);
  const bhNld = dongLuong.reduce((t, d) => t + Number(d.bh_xh) + Number(d.bh_yt) + Number(d.bh_tn), 0);
  const chuaThoaThuan = dangLam.filter((n) => !thoa.data!.some((t) => t.nhan_vien_id === n.id)).length;
  const thamChuaXacNhan = tham.data!.filter((t) => !t.xac_nhan_luc).length;
  const luongThoaThuanTb = thoa.data!.length ? Math.round(thoa.data!.reduce((t, x) => t + Number(x.luong_thoa_thuan), 0) / thoa.data!.length) : 0;

  // ── đánh giá
  const dgDs = dg.data!;
  const diemTb = dgDs.length ? dgDs.reduce((t, d) => t + Number(d.diem), 0) / dgDs.length : null;

  const gio = (p: number | null) => (p == null ? "—" : `${String(Math.floor(p / 60)).padStart(2, "0")}:${String(p % 60).padStart(2, "0")}`);
  const dongBang: PhanBo = await Promise.all(
    (["nhan_vien", "khoi", "cham_cong", "don_tu", "ky_luong", "bang_luong", "luong_thoa_thuan", "tham_so_luong", "tin_tuyen_dung", "ung_vien", "danh_gia_hieu_suat", "nhat_ky"] as const).map(async (b) => ({
      nhan: b,
      so: (await db.from(b).select("*", { count: "exact", head: true })).count ?? 0,
    })),
  );

  return {
    nhom: [
      {
        ten: "Nhân sự",
        chiSo: [
          { nhan: "Tổng hồ sơ", so: so(hoSo.length) },
          { nhan: "Đang làm", so: so(hoSo.filter((n) => n.trang_thai === "Đang làm").length) },
          { nhan: "Thử việc", so: so(hoSo.filter((n) => n.trang_thai === "Thử việc").length) },
          { nhan: "Đã nghỉ", so: so(hoSo.filter((n) => n.trang_thai === "Đã nghỉ").length) },
          { nhan: "Vào làm 30 ngày qua", so: so(dangLam.filter((n) => (n.ngay_vao_lam ?? "") >= congNgay(homNay, -29)).length) },
          { nhan: "Thâm niên trung bình", so: `${thamNienTb.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} năm` },
          { nhan: "Số khối", so: so(khoi.count ?? 0) },
          { nhan: "Hồ sơ chưa gắn tài khoản", so: so(dangLam.filter((n) => !n.user_id).length), phu: "Chưa đăng nhập được" },
        ],
      },
      {
        ten: "Tài khoản và đăng nhập",
        chiSo: [
          { nhan: "Tổng tài khoản", so: so(taiKhoan.length) },
          ...["Kỹ thuật", "Quản trị", "Nhân viên", "Chờ duyệt"].map((v) => ({ nhan: v, so: so(theoVaiTro.find((x) => x.nhan === v)?.so ?? 0) })),
          { nhan: "Đăng nhập 7 ngày qua", so: so(dangNhap7), phu: tyLe(dangNhap7, taiKhoan.length) + " tài khoản" },
          { nhan: "Chưa từng đăng nhập", so: so(chuaTungDangNhap) },
        ],
      },
      {
        ten: "Chấm công",
        chiSo: [
          { nhan: "Phải chấm công", so: so(phaiChamCong.length), phu: "Trừ Giám đốc, Tổng giám đốc, Kỹ thuật" },
          { nhan: "Đã chấm công hôm nay", so: `${ccHomNay.filter((c) => phaiChamCongIds.has(c.nhan_vien_id)).length}/${phaiChamCong.length}` },
          { nhan: "Đi muộn hôm nay", so: so(muonHomNay) },
          { nhan: "Vào nhưng chưa ra", so: so(chuaRa) },
          { nhan: "Lượt chấm công tháng này", so: so(cc.length), phu: `${so(nguoiCoCong)} người có mặt` },
          { nhan: "Đi muộn tháng này", so: so(muonThang), phu: `${tyLe(muonThang, cc.length)} lượt` },
          { nhan: "Vắng mặt tháng này", so: so(vangThang) },
          { nhan: "Giờ vào trung bình", so: gio(gioVaoTb) },
        ],
      },
      {
        ten: "Đơn từ",
        chiSo: [
          { nhan: "Chờ duyệt", so: so(donCho), phu: donLauNhat.length ? `Cũ nhất ${Math.max(...donLauNhat)} ngày` : "Không tồn" },
          { nhan: "Đã duyệt", so: so(donDuyet) },
          { nhan: "Từ chối", so: so(donTuChoi) },
          { nhan: "Tổng đơn", so: so(donDs.length) },
          { nhan: "Đơn tạo tháng này", so: so(donThang) },
          { nhan: `Phép năm ${nam} đã dùng/chờ`, so: `${so(phepDung)} ngày`, phu: `Hạn mức ${PHEP_NAM_MOI_NAM} ngày mỗi người` },
        ],
      },
      {
        ten: "Tuyển dụng",
        chiSo: [
          { nhan: "Tin đang mở", so: so(tinMo.length), phu: `${so(tinMo.reduce((t, x) => t + x.so_luong_can, 0))} vị trí cần` },
          { nhan: "Tin đã đóng", so: so(tinDs.length - tinMo.length) },
          { nhan: "Tổng ứng viên", so: so(uvDs.length) },
          { nhan: "Ứng viên mới 30 ngày", so: so(uv30) },
          { nhan: "Lịch phỏng vấn sắp tới", so: so(sapPv) },
          { nhan: "Đã nhận việc", so: so(phePhao[5].so), phu: tyLe(phePhao[5].so, uvDs.length) + " tổng ứng viên" },
        ],
      },
      {
        ten: "Lương",
        chiSo: [
          { nhan: "Số kỳ lương", so: so(kyDs.length), phu: kyGanNhat ? `Gần nhất ${kyGanNhat.ten_ky} · ${kyGanNhat.trang_thai}` : "Chưa có kỳ nào" },
          { nhan: "Dòng bảng lương", so: so(dongLuong.length) },
          { nhan: "Tổng thu nhập (mọi kỳ)", so: tienVN(cong("tong_thu_nhap")) },
          { nhan: "Tổng thực lĩnh (mọi kỳ)", so: tienVN(cong("thuc_linh")) },
          { nhan: "Thuế TNCN", so: tienVN(cong("thue_tncn")) },
          { nhan: "BH người lao động đóng", so: tienVN(bhNld) },
          { nhan: "BH công ty đóng", so: tienVN(dongLuong.reduce((t, d) => t + Number(d.bh_cty), 0)) },
          { nhan: "Tiền làm thêm", so: tienVN(cong("tien_ot")) },
          { nhan: "Có thỏa thuận lương", so: so(thoa.data!.length), phu: `${so(chuaThoaThuan)} người đang làm chưa có` },
          { nhan: "Lương thỏa thuận trung bình", so: tienVN(luongThoaThuanTb) },
          { nhan: "Tham số lương chưa xác nhận", so: `${so(thamChuaXacNhan)}/${so(tham.data!.length)}`, phu: thamChuaXacNhan ? "Cần xác nhận trước khi duyệt kỳ thật" : "Đã xác nhận hết" },
        ],
      },
      {
        ten: "Đánh giá hiệu suất",
        chiSo: [
          { nhan: "Lượt đánh giá", so: so(dgDs.length) },
          { nhan: "Điểm trung bình", so: diemTb == null ? "—" : diemTb.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) },
          { nhan: "Xuất sắc", so: so(dgDs.filter((d) => d.xep_loai === "Xuất sắc").length) },
          { nhan: "Cần cải thiện", so: so(dgDs.filter((d) => d.xep_loai === "Cần cải thiện").length) },
        ],
      },
      {
        ten: "Hệ thống",
        chiSo: [
          { nhan: "Tổng số dòng dữ liệu", so: so(dongBang.reduce((t, b) => t + b.so, 0)) },
          { nhan: "Ghi nhật ký 24 giờ qua", so: so(nk.count ?? 0) },
          { nhan: "Tổng dòng nhật ký", so: so(nkTong.count ?? 0) },
        ],
      },
    ],
    phanBo: [
      { ten: "Nhân sự theo khối", donVi: "người", dong: dem(dangLam, (n) => viTri(n).khoi ?? "Chưa gán khối") },
      { ten: "Nhân sự theo chức vụ", donVi: "người", dong: dem(dangLam, (n) => n.chuc_danh || "Chưa có chức vụ").slice(0, 8) },
      { ten: "Tài khoản theo vai trò", donVi: "tài khoản", dong: theoVaiTro },
      { ten: "Đơn theo loại", donVi: "đơn", dong: LOAI_DON.map((l) => ({ nhan: l, so: donDs.filter((d) => d.loai === l).length })).filter((x) => x.so > 0) },
      { ten: "Ứng viên theo bước", donVi: "người", dong: phePhao },
      { ten: "Xếp loại hiệu suất", donVi: "lượt", dong: dem(dgDs, (d) => d.xep_loai) },
      { ten: "Số dòng theo bảng dữ liệu", donVi: "dòng", dong: dongBang.sort((a, b) => b.so - a.so) },
    ].filter((p) => p.dong.length > 0),
    chamCong7Ngay,
  };
}
