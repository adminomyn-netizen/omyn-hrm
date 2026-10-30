import "server-only";
import { dbHr } from "@/lib/hr-db";
import { docNen, docKetQua, homNayHcm, tinhBang } from "@/lib/kpi-data";
import { docKy, kyChua } from "@/lib/kpi";
import { layBienDong } from "@/lib/bien-dong-data";
import { layDuLieuLuongBc } from "@/lib/bao-cao-luong-data";
import { tongTheoKy } from "@/lib/bao-cao-luong";
import { suKienDeNhac } from "@/lib/lich-nhan-su-data";
import { cong } from "@/lib/onboarding";
import { tinhChiSoHr, type DuLieuHr } from "@/lib/chi-so-hr";

const so = (v: unknown) => Number(v ?? 0) || 0;

/** Đọc mọi nguồn cho Báo cáo HR rồi tính 10 nhóm chỉ số. Chỉ gọi sau khi đã kiểm quyền (Quản trị/Kỹ thuật). */
export async function layChiSoHr() {
  const db = dbHr();
  const homNay = homNayHcm();
  const nen = await docNen();
  const kyThang = docKy(kyChua(homNay, "thang"))!;
  const [nv, tin, uv, kenh, yc, onb, nghi, kh, db2, dg, cc, tc, soLieu, ts, tu, ketQuaNam, bang, bienDong, luong, suKien, thuongHh] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, trang_thai, ngay_vao_lam, khoi_id, khoi(ten)").limit(5000),
    db.from("tin_tuyen_dung").select("id, trang_thai, so_luong_can, yeu_cau_id, vi_tri").limit(5000),
    db.from("ung_vien").select("tin_tuyen_dung_id, trang_thai, nguon, ngay_nhan_ho_so, ngay_nhan_viec").limit(20000),
    db.from("dang_tin_kenh").select("tin_tuyen_dung_id, kenh, chi_phi").limit(20000),
    db.from("yeu_cau_tuyen_dung").select("id, trang_thai, tao_luc").limit(5000),
    db.from("theo_doi_onboarding").select("tinh_trang").limit(5000),
    db.from("nghi_viec").select("nhan_vien_id, ngay_lam_viec_cuoi, ly_do, pv_ly_do_that, trang_thai").limit(5000),
    db.from("dao_tao_khoa_hoc").select("nhan_vien_id, trang_thai, ngay_hoan_thanh").limit(20000),
    db.from("chi_so_hr_dinh_bien").select("khoi_id, so_dinh_bien, khoi(ten)").limit(500),
    db.from("danh_gia_hieu_suat").select("nhan_vien_id, xep_loai, created_at").limit(20000),
    db.from("chi_so_hr_chu_chot").select("vi_tri, ke_can_id").limit(1000),
    db.from("thang_chuc_dieu_chuyen").select("loai, ngay_hieu_luc").limit(20000),
    db.from("chi_so_hr_ky").select("thang, doanh_thu, ngan_sach_quy_luong").limit(1000),
    db.from("tai_san_cap_phat").select("nhan_vien_id, ten_tai_san, tinh_trang").limit(20000),
    db.from("tam_ung_nhan_vien").select("nhan_vien_id, so_tien, tinh_trang").limit(20000),
    docKetQua(cong(homNay, -400), homNay),
    tinhBang(nen, kyThang),
    layBienDong(),
    layDuLieuLuongBc(),
    suKienDeNhac(homNay),
    db.from("bang_luong").select("ky_luong_id, luong_chuc_danh, luong_kpi, thuong_khac, hoa_hong").limit(50000),
  ]);

  const du: DuLieuHr = {
    homNay,
    nhanVien: ((nv.data ?? []) as unknown as { id: string; ho_ten: string; trang_thai: string; ngay_vao_lam: string | null; khoi_id: string | null; khoi: { ten: string } | null }[]).map((n) => ({ id: n.id, ten: n.ho_ten, khoi: n.khoi?.ten ?? null, khoiId: n.khoi_id, trangThai: n.trang_thai, ngayVao: n.ngay_vao_lam })),
    tin: ((tin.data ?? []) as { id: string; trang_thai: string; so_luong_can: number; yeu_cau_id: string | null; vi_tri: string }[]).map((t) => ({ id: t.id, trangThai: t.trang_thai, soLuongCan: t.so_luong_can, yeuCauId: t.yeu_cau_id, viTri: t.vi_tri })),
    ungVien: ((uv.data ?? []) as { tin_tuyen_dung_id: string; trang_thai: string; nguon: string | null; ngay_nhan_ho_so: string | null; ngay_nhan_viec: string | null }[]).map((u) => ({ tinId: u.tin_tuyen_dung_id, trangThai: u.trang_thai, nguon: u.nguon, ngayNhanHoSo: u.ngay_nhan_ho_so, ngayNhanViec: u.ngay_nhan_viec })),
    kenh: ((kenh.data ?? []) as { tin_tuyen_dung_id: string; kenh: string; chi_phi: number | null }[]).map((k) => ({ tinId: k.tin_tuyen_dung_id, kenh: k.kenh, chiPhi: so(k.chi_phi) })),
    yeuCau: ((yc.data ?? []) as { id: string; trang_thai: string; tao_luc: string }[]).map((y) => ({ id: y.id, trangThai: y.trang_thai, taoLuc: y.tao_luc })),
    onboarding: ((onb.data ?? []) as { tinh_trang: string }[]).map((o) => ({ tinhTrang: o.tinh_trang })),
    nghi: ((nghi.data ?? []) as { nhan_vien_id: string; ngay_lam_viec_cuoi: string; ly_do: string | null; pv_ly_do_that: string | null; trang_thai: string }[]).map((n) => ({ nhanVienId: n.nhan_vien_id, ngayCuoi: n.ngay_lam_viec_cuoi, lyDo: n.ly_do, lyDoThat: n.pv_ly_do_that, trangThai: n.trang_thai })),
    khoaHoc: ((kh.data ?? []) as { nhan_vien_id: string; trang_thai: string; ngay_hoan_thanh: string | null }[]).map((k) => ({ nhanVienId: k.nhan_vien_id, trangThai: k.trang_thai, ngayHoanThanh: k.ngay_hoan_thanh })),
    dinhBien: ((db2.data ?? []) as unknown as { khoi_id: string; so_dinh_bien: number; khoi: { ten: string } | null }[]).map((b) => ({ khoiId: b.khoi_id, khoi: b.khoi?.ten ?? "—", soNguoi: b.so_dinh_bien })),
    kpi: { chiTieu: nen.chiTieu, ketQua: ketQuaNam, nguoi: nen.nguoi, phong: bang.hangPhong.map((p) => ({ ten: p.ten, diem: p.diem, soNguoi: p.soNguoi })), kyNhan: kyThang.nhan },
    danhGia: ((dg.data ?? []) as { nhan_vien_id: string; xep_loai: string; created_at: string }[]).map((g) => ({ nhanVienId: g.nhan_vien_id, xepLoai: g.xep_loai, luc: g.created_at })),
    chuChot: ((cc.data ?? []) as { vi_tri: string; ke_can_id: string | null }[]).map((c) => ({ viTri: c.vi_tri, keCan: !!c.ke_can_id })),
    thangChuc: ((tc.data ?? []) as { loai: string; ngay_hieu_luc: string }[]).map((t) => ({ loai: t.loai, ngay: t.ngay_hieu_luc })),
    kyLuong: tongTheoKy(luong.ky, luong.dong),
    coCau: ((thuongHh.data ?? []) as Record<string, unknown>[]).map((r) => ({ kyId: String(r.ky_luong_id), coDinh: so(r.luong_chuc_danh), kpi: so(r.luong_kpi), thuong: so(r.thuong_khac) + so(r.hoa_hong) })),
    soLieuKy: ((soLieu.data ?? []) as { thang: string; doanh_thu: number | null; ngan_sach_quy_luong: number | null }[]).map((s) => ({ thang: s.thang.slice(0, 7), doanhThu: s.doanh_thu === null ? null : so(s.doanh_thu), nganSach: s.ngan_sach_quy_luong === null ? null : so(s.ngan_sach_quy_luong) })),
    suKien: suKien.map((e) => ({ ngay: e.ngay, loai: e.loai, tieuDe: e.tieuDe, phu: e.phu })),
    taiSan: ((ts.data ?? []) as { nhan_vien_id: string; ten_tai_san: string; tinh_trang: string }[]).map((t) => ({ nhanVienId: t.nhan_vien_id, ten: t.ten_tai_san, tinhTrang: t.tinh_trang })),
    tamUng: ((tu.data ?? []) as { nhan_vien_id: string; so_tien: number; tinh_trang: string }[]).map((t) => ({ nhanVienId: t.nhan_vien_id, soTien: so(t.so_tien), tinhTrang: t.tinh_trang })),
    bienDong,
  };
  return tinhChiSoHr(du);
}
