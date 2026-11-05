"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiChoNguoiDung } from "@/lib/push";
import { congChuanTheoKy, tinhLuong, type DauVaoLuong, type ThamSo } from "@/lib/luong/tinh-luong";
import { layBangCongThang } from "@/lib/bang-cong";
import { tongGioTheoLoai } from "@/lib/tang-ca";
import { dbHr } from "@/lib/hr-db";

export type KetQuaLuong = { loi?: string; ok?: boolean; thongBao?: string };
const KHONG_QUYEN: KetQuaLuong = { loi: "Chỉ Quản trị và Kỹ thuật mới được xem và sửa lương." };
const THU_TU = ["mo", "da_lap", "da_kiem", "da_duyet", "da_chi"] as const;
type TrangThaiKy = (typeof THU_TU)[number];

const chuoi = (fd: FormData, k: string, toiDa = 300) => String(fd.get(k) ?? "").trim().slice(0, toiDa);
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
/** Số nguyên không âm từ ô tiền ("12.500.000" → 12500000). */
const tien = (fd: FormData, k: string) => {
  const s = String(fd.get(k) ?? "").replace(/[^\d]/g, "");
  return s ? Math.min(Number(s), 9_000_000_000_000) : 0;
};
/** Số thập phân bước 0,5 (ngày công, giờ). */
const buoc05 = (fd: FormData, k: string, toiDa: number) => {
  const n = Number(String(fd.get(k) ?? "0").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n * 2) / 2, toiDa);
};
const bool = (fd: FormData, k: string) => String(fd.get(k) ?? "") === "1";
const lamMoi = () => {
  revalidatePath("/luong");
  revalidatePath("/dashboard");
};

async function chiQuanTri() {
  const nd = await layNguoiDungHienTai();
  return nd && (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") ? nd : null;
}

async function docThamSo(): Promise<{ p: ThamSo; chuaXacNhan: number }> {
  const { data } = await createAdminClient().from("tham_so_luong").select("khoa, gia_tri, xac_nhan_luc");
  const p: ThamSo = {};
  let chua = 0;
  for (const t of data ?? []) {
    p[t.khoa] = Number(t.gia_tri);
    if (!t.xac_nhan_luc) chua++;
  }
  return { p, chuaXacNhan: chua };
}

type Dong = {
  luong_thoa_thuan: number; ty_le_kpi: number; thu_viec: boolean; cong_chuan: number; cong_huong: number; ngay_lam: number; ty_le_ht_kpi: number;
  phu_cap: number; phu_cap_mien_thue: boolean; an_ca: boolean; dong_bh: boolean; so_nguoi_phu_thuoc: number;
  gio_ot_thuong: number; gio_ot_nghi_tuan: number; gio_ot_le: number; hoa_hong: number; thuong_khac: number; khau_tru_khac: number;
};
const tuDong = (d: Dong): DauVaoLuong => ({
  luongThoaThuan: Number(d.luong_thoa_thuan), tyLeKpi: d.ty_le_kpi, thuViec: d.thu_viec, congChuan: Number(d.cong_chuan), congHuong: Number(d.cong_huong), ngayLam: Number(d.ngay_lam),
  tyLeHtKpi: d.ty_le_ht_kpi, phuCap: Number(d.phu_cap), phuCapMienThue: d.phu_cap_mien_thue, anCa: d.an_ca, dongBh: d.dong_bh, soNguoiPhuThuoc: d.so_nguoi_phu_thuoc,
  gioOtThuong: Number(d.gio_ot_thuong), gioOtNghiTuan: Number(d.gio_ot_nghi_tuan), gioOtLe: Number(d.gio_ot_le), hoaHong: Number(d.hoa_hong), thuongKhac: Number(d.thuong_khac), khauTruKhac: Number(d.khau_tru_khac),
});
const cotKetQua = (v: DauVaoLuong, p: ThamSo) => {
  const r = tinhLuong(v, p);
  return {
    luong_chuc_danh: r.luongChucDanh, luong_kpi: r.luongKpi, phu_cap_thuc: r.phuCapThuc, tien_an: r.tienAn, tien_ot: r.tienOt, tong_thu_nhap: r.tongThuNhap,
    bh_xh: r.bhXh, bh_yt: r.bhYt, bh_tn: r.bhTn, giam_tru: r.giamTru, thu_nhap_tinh_thue: r.thuNhapTinhThue, thue_tncn: r.thueTncn, thuc_linh: r.thucLinh, bh_cty: r.bhCty,
    tinh_luc: new Date().toISOString(),
  };
};

/** Kỳ còn sửa được dòng lương khi đang "mở" hoặc "đã lập". Từ "đã kiểm" trở đi bị khoá. */
async function kyDangSua(kyId: string) {
  const { data } = await createAdminClient().from("ky_luong").select("id, thang, nam, trang_thai").eq("id", kyId).maybeSingle();
  if (!data) return { loi: "Không tìm thấy kỳ lương." as const };
  if (!["mo", "da_lap"].includes(data.trang_thai)) return { loi: "Kỳ lương đã khoá sửa (từ bước Đã kiểm). Không đổi được số liệu." as const };
  return { ky: data };
}

// ─────────────── thỏa thuận lương ───────────────
export async function luuThoaThuan(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const nvId = chuoi(fd, "nhan_vien_id", 40);
  if (!uuid(nvId)) return { loi: "Thiếu nhân viên." };
  const luong = tien(fd, "luong_thoa_thuan");
  const kpi = Math.round(Number(chuoi(fd, "ty_le_kpi", 3)) || 0);
  const phuThuoc = Math.round(Number(chuoi(fd, "so_nguoi_phu_thuoc", 2)) || 0);
  const kieu = chuoi(fd, "kieu_cong", 20);
  if (luong <= 0) return { loi: "Nhập lương thỏa thuận lớn hơn 0." };
  if (kpi < 0 || kpi > 50) return { loi: "% KPI nền từ 0 đến 50." };
  if (phuThuoc < 0 || phuThuoc > 20) return { loi: "Số người phụ thuộc từ 0 đến 20." };
  if (!["van_phong", "van_hanh"].includes(kieu)) return { loi: "Kiểu công không hợp lệ." };

  const { error } = await createAdminClient().from("luong_thoa_thuan").upsert({
    nhan_vien_id: nvId, luong_thoa_thuan: luong, ty_le_kpi: kpi, phu_cap: tien(fd, "phu_cap"), phu_cap_mien_thue: bool(fd, "phu_cap_mien_thue"),
    an_ca: bool(fd, "an_ca"), dong_bh: bool(fd, "dong_bh"), so_nguoi_phu_thuoc: phuThuoc, kieu_cong: kieu, ghi_chu: chuoi(fd, "ghi_chu") || null, cap_nhat_luc: new Date().toISOString(),
  });
  if (error) return { loi: "Chưa lưu được thỏa thuận lương. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

// ─────────────── kỳ lương ───────────────
export async function taoKyLuong(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const thang = Number(chuoi(fd, "thang", 2));
  const nam = Number(chuoi(fd, "nam", 4));
  if (!Number.isInteger(thang) || thang < 1 || thang > 12 || !Number.isInteger(nam) || nam < 2024 || nam > 2100) return { loi: "Chọn tháng và năm hợp lệ." };
  const { error } = await createAdminClient().from("ky_luong").insert({ ten_ky: `Tháng ${thang}/${nam}`, thang, nam });
  if (error) return { loi: error.message.includes("duplicate") ? "Kỳ lương này đã có." : "Chưa tạo được kỳ lương. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

export async function xoaKyLuong(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const kyId = chuoi(fd, "ky_id", 40);
  if (!uuid(kyId)) return { loi: "Thiếu kỳ lương." };
  const db = createAdminClient();
  const { data: ky } = await db.from("ky_luong").select("trang_thai").eq("id", kyId).maybeSingle();
  if (!ky) return { loi: "Không tìm thấy kỳ lương." };
  if (ky.trang_thai !== "mo") return { loi: "Chỉ xoá được kỳ còn ở bước Mở." };
  const { count } = await db.from("bang_luong").select("id", { count: "exact", head: true }).eq("ky_luong_id", kyId);
  if ((count ?? 0) > 0) return { loi: "Kỳ đã có dòng lương nên không xoá được." };
  const { error } = await db.from("ky_luong").delete().eq("id", kyId);
  if (error) return { loi: "Chưa xoá được kỳ. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

/** Lập dòng lương cho mọi nhân viên còn làm đã có thỏa thuận (chụp lại thỏa thuận hiện tại). Dòng đã có không bị ghi đè. */
export async function lapBangLuong(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const kyId = chuoi(fd, "ky_id", 40);
  if (!uuid(kyId)) return { loi: "Thiếu kỳ lương." };
  const kt = await kyDangSua(kyId);
  if ("loi" in kt) return { loi: kt.loi };
  const { ky } = kt;
  if (!ky.thang || !ky.nam) return { loi: "Kỳ lương thiếu tháng/năm." };

  const db = createAdminClient();
  const [{ p }, nv, tt, co, cc] = await Promise.all([
    docThamSo(),
    db.from("nhan_vien").select("id, ho_ten, trang_thai, ngay_vao_lam").neq("trang_thai", "Đã nghỉ"),
    db.from("luong_thoa_thuan").select("*"),
    db.from("bang_luong").select("nhan_vien_id").eq("ky_luong_id", kyId),
    layBangCongThang(ky.nam, ky.thang),
  ]);
  const congTheoNguoi = new Map(cc.dong.map((d) => [d.nhanVienId, d.tong]));
  // Giờ tăng ca đã xác nhận và thưởng/hoa hồng trong tháng của kỳ lương: đổ thẳng vào dòng lương (không nhập hai lần).
  const dauThang = `${ky.nam}-${String(ky.thang).padStart(2, "0")}-01`;
  const dauThangSau = ky.thang === 12 ? `${ky.nam + 1}-01-01` : `${ky.nam}-${String(ky.thang + 1).padStart(2, "0")}-01`;
  const [tcTho, thTho] = await Promise.all([
    dbHr().from("tang_ca").select("nhan_vien_id, so_gio, loai_ngay").gte("ngay", dauThang).lt("ngay", dauThangSau),
    dbHr().from("thuong_hoa_hong").select("nhan_vien_id, loai, so_tien").gte("ngay", dauThang).lt("ngay", dauThangSau),
  ]);
  const tcTheo = new Map<string, { so_gio: number; loai_ngay: string }[]>();
  for (const r of (tcTho.data ?? []) as { nhan_vien_id: string; so_gio: number; loai_ngay: string }[]) tcTheo.set(r.nhan_vien_id, [...(tcTheo.get(r.nhan_vien_id) ?? []), r]);
  const thTheo = new Map<string, { hoaHong: number; thuongKhac: number }>();
  for (const r of (thTho.data ?? []) as { nhan_vien_id: string; loai: string; so_tien: number }[]) {
    const c = thTheo.get(r.nhan_vien_id) ?? { hoaHong: 0, thuongKhac: 0 };
    if (r.loai === "Hoa hồng") c.hoaHong += Number(r.so_tien); else c.thuongKhac += Number(r.so_tien);
    thTheo.set(r.nhan_vien_id, c);
  }
  const ttMap = new Map((tt.data ?? []).map((t) => [t.nhan_vien_id, t]));
  const daCo = new Set((co.data ?? []).map((c) => c.nhan_vien_id));
  const thieu: string[] = [];
  const moi: Record<string, unknown>[] = [];
  for (const n of nv.data ?? []) {
    if (daCo.has(n.id)) continue;
    const t = ttMap.get(n.id);
    if (!t) {
      thieu.push(n.ho_ten);
      continue;
    }
    const congChuan = congChuanTheoKy(t.kieu_cong as "van_phong" | "van_hanh", ky.nam, ky.thang, p.cong_chuan_van_phong);
    const gioOt = tongGioTheoLoai(tcTheo.get(n.id) ?? []);
    const thuong = thTheo.get(n.id) ?? { hoaHong: 0, thuongKhac: 0 };
    // Công hưởng và ngày làm lấy từ bảng công tháng (X, N, CT, P, L…): cùng một hàm với bảng chấm công nên không lệch nhau.
    const tong = congTheoNguoi.get(n.id);
    const congHuong = Math.min(tong?.congHuong ?? 0, congChuan);
    const ngayCham = Math.min(tong?.congLam ?? 0, congChuan);
    const dong: Dong = {
      luong_thoa_thuan: Number(t.luong_thoa_thuan), ty_le_kpi: t.ty_le_kpi, thu_viec: n.trang_thai === "Thử việc", cong_chuan: congChuan, cong_huong: congHuong, ngay_lam: ngayCham,
      ty_le_ht_kpi: 100, phu_cap: Number(t.phu_cap), phu_cap_mien_thue: t.phu_cap_mien_thue, an_ca: t.an_ca, dong_bh: t.dong_bh, so_nguoi_phu_thuoc: t.so_nguoi_phu_thuoc,
      gio_ot_thuong: gioOt.thuong, gio_ot_nghi_tuan: gioOt.nghiTuan, gio_ot_le: gioOt.le, hoa_hong: thuong.hoaHong, thuong_khac: thuong.thuongKhac, khau_tru_khac: 0,
    };
    moi.push({ ky_luong_id: kyId, nhan_vien_id: n.id, kieu_cong: t.kieu_cong, ...dong, ...cotKetQua(tuDong(dong), p) });
  }
  if (moi.length > 0) {
    const { error } = await db.from("bang_luong").insert(moi as never);
    if (error) return { loi: "Chưa lập được bảng lương. Thử lại sau." };
    if (ky.trang_thai === "mo") await db.from("ky_luong").update({ trang_thai: "da_lap", chuyen_luc: new Date().toISOString() }).eq("id", kyId);
  }
  lamMoi();
  const tb = `Đã lập ${moi.length} dòng lương.` + (thieu.length ? ` ${thieu.length} người chưa có thỏa thuận lương nên chưa có dòng: ${thieu.slice(0, 5).join(", ")}${thieu.length > 5 ? "…" : ""}.` : "");
  return { ok: true, thongBao: tb };
}

export async function luuDongLuong(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  if (!uuid(id)) return { loi: "Thiếu dòng lương." };
  const db = createAdminClient();
  const { data: cu } = await db.from("bang_luong").select("*").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy dòng lương." };
  const kt = await kyDangSua(cu.ky_luong_id);
  if ("loi" in kt) return { loi: kt.loi };

  const congChuan = Number(cu.cong_chuan);
  const moi: Dong = {
    ...(cu as unknown as Dong),
    cong_huong: Math.min(buoc05(fd, "cong_huong", 31), congChuan),
    ngay_lam: buoc05(fd, "ngay_lam", 31),
    ty_le_ht_kpi: Math.min(Math.round(Number(chuoi(fd, "ty_le_ht_kpi", 3)) || 0), 200),
    gio_ot_thuong: buoc05(fd, "gio_ot_thuong", 100), gio_ot_nghi_tuan: buoc05(fd, "gio_ot_nghi_tuan", 100), gio_ot_le: buoc05(fd, "gio_ot_le", 100),
    hoa_hong: tien(fd, "hoa_hong"), thuong_khac: tien(fd, "thuong_khac"), khau_tru_khac: tien(fd, "khau_tru_khac"),
  };
  const { p } = await docThamSo();
  const { error } = await db.from("bang_luong").update({
    cong_huong: moi.cong_huong, ngay_lam: moi.ngay_lam, ty_le_ht_kpi: moi.ty_le_ht_kpi, gio_ot_thuong: moi.gio_ot_thuong, gio_ot_nghi_tuan: moi.gio_ot_nghi_tuan, gio_ot_le: moi.gio_ot_le,
    hoa_hong: moi.hoa_hong, thuong_khac: moi.thuong_khac, khau_tru_khac: moi.khau_tru_khac, ghi_chu: chuoi(fd, "ghi_chu") || null, ...cotKetQua(tuDong(moi), p),
  }).eq("id", id);
  if (error) return { loi: "Chưa lưu được dòng lương. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

/** Cập nhật cả kỳ rồi tính lại: lấy lại từ hồ sơ (trạng thái Thử việc) và Thỏa thuận lương hiện tại (lương, KPI nền, phụ cấp, tiền ăn, bảo hiểm, người phụ thuộc, kiểu công), công chuẩn theo tháng, và tham số hiện hành.
 *  GIỮ NGUYÊN số liệu nhập riêng của kỳ: công hưởng, ngày làm, % hoàn thành KPI, giờ tăng ca, hoa hồng, thưởng, khấu trừ. */
export async function tinhLaiKy(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const kyId = chuoi(fd, "ky_id", 40);
  if (!uuid(kyId)) return { loi: "Thiếu kỳ lương." };
  const kt = await kyDangSua(kyId);
  if ("loi" in kt) return { loi: kt.loi };
  const { ky } = kt;
  const db = createAdminClient();
  const [{ p }, bl, nv, tt, cc] = await Promise.all([
    docThamSo(),
    db.from("bang_luong").select("*").eq("ky_luong_id", kyId),
    db.from("nhan_vien").select("id, trang_thai"),
    db.from("luong_thoa_thuan").select("*"),
    ky.nam && ky.thang ? layBangCongThang(ky.nam, ky.thang) : Promise.resolve(null),
  ]);
  const congTheoNguoi = new Map((cc?.dong ?? []).map((x) => [x.nhanVienId, x.tong]));
  const nvMap = new Map((nv.data ?? []).map((n) => [n.id, n.trang_thai]));
  const ttMap = new Map((tt.data ?? []).map((t) => [t.nhan_vien_id, t]));
  const data = bl.data ?? [];
  for (const d of data) {
    const t = ttMap.get(d.nhan_vien_id);
    const lamMoiTuHoSo: Record<string, unknown> = {};
    if (nvMap.has(d.nhan_vien_id)) lamMoiTuHoSo.thu_viec = nvMap.get(d.nhan_vien_id) === "Thử việc";
    if (t) {
      Object.assign(lamMoiTuHoSo, {
        luong_thoa_thuan: Number(t.luong_thoa_thuan), ty_le_kpi: t.ty_le_kpi, phu_cap: Number(t.phu_cap), phu_cap_mien_thue: t.phu_cap_mien_thue, an_ca: t.an_ca,
        dong_bh: t.dong_bh, so_nguoi_phu_thuoc: t.so_nguoi_phu_thuoc, kieu_cong: t.kieu_cong,
      });
    }
    if (ky.nam && ky.thang) {
      const congChuan = congChuanTheoKy((t?.kieu_cong ?? d.kieu_cong) as "van_phong" | "van_hanh", ky.nam, ky.thang, p.cong_chuan_van_phong);
      lamMoiTuHoSo.cong_chuan = congChuan;
      // Công chuẩn đổi thì công cũ có thể đã bị cắt ở mức cũ (vd 24): lấy lại từ bảng công. Công chuẩn không đổi thì giữ số đã nhập tay.
      const tong = congTheoNguoi.get(d.nhan_vien_id);
      const laiTuCong = Number(d.cong_chuan) !== congChuan && !!tong;
      lamMoiTuHoSo.cong_huong = Math.min(laiTuCong ? tong!.congHuong : Number(d.cong_huong), congChuan);
      lamMoiTuHoSo.ngay_lam = Math.min(laiTuCong ? tong!.congLam : Number(d.ngay_lam), congChuan);
    }
    const moi = { ...(d as unknown as Dong), ...(lamMoiTuHoSo as Partial<Dong>) };
    const { error } = await db.from("bang_luong").update({ ...lamMoiTuHoSo, ...cotKetQua(tuDong(moi), p) } as never).eq("id", d.id);
    if (error) return { loi: "Chưa tính lại được. Thử lại sau." };
  }
  lamMoi();
  return { ok: true, thongBao: `Đã cập nhật từ hồ sơ và tính lại ${data.length} dòng.` };
}

/** Chuyển kỳ sang bước kế tiếp (chỉ đi tiến). Duyệt chỉ được khi mọi tham số đã được xác nhận. */
export async function chuyenKyLuong(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const kyId = chuoi(fd, "ky_id", 40);
  if (!uuid(kyId)) return { loi: "Thiếu kỳ lương." };
  const db = createAdminClient();
  const { data: ky } = await db.from("ky_luong").select("trang_thai").eq("id", kyId).maybeSingle();
  if (!ky) return { loi: "Không tìm thấy kỳ lương." };
  const i = THU_TU.indexOf(ky.trang_thai as TrangThaiKy);
  if (i < 0 || i >= THU_TU.length - 1) return { loi: "Kỳ lương đã ở bước cuối." };
  const den = THU_TU[i + 1];
  const { count } = await db.from("bang_luong").select("id", { count: "exact", head: true }).eq("ky_luong_id", kyId);
  if (den === "da_lap" && (count ?? 0) === 0) return { loi: "Chưa có dòng lương nào. Bấm \"Lập bảng lương\" trước." };
  if (den === "da_duyet") {
    const { chuaXacNhan } = await docThamSo();
    if (chuaXacNhan > 0) return { loi: `Còn ${chuaXacNhan} tham số tính lương chưa được xác nhận. Vào tab Tham số để xác nhận trước khi duyệt.` };
  }
  const { error } = await db.from("ky_luong").update({ trang_thai: den, chuyen_luc: new Date().toISOString(), ...(den === "da_chi" ? { da_thanh_toan: true } : {}) }).eq("id", kyId);
  if (error) return { loi: "Chưa chuyển được bước. Thử lại sau." };
  if (den === "da_duyet" || den === "da_chi") {
    // Gửi phiếu lương cho từng người (như nút "Gửi bảng lương" bên Lark): thông báo chung chung, không ghi số tiền để khỏi lộ trên màn hình khoá.
    const [{ data: ky2 }, { data: dong }] = await Promise.all([db.from("ky_luong").select("thang, nam").eq("id", kyId).maybeSingle(), db.from("bang_luong").select("nhan_vien:nhan_vien_id(user_id)").eq("ky_luong_id", kyId)]);
    const users = (dong ?? []).map((d) => (d.nhan_vien as { user_id?: string | null } | null)?.user_id).filter((u): u is string => !!u);
    const ky_ = ky2 ? `${String(ky2.thang).padStart(2, "0")}/${ky2.nam}` : "";
    await guiChoNguoiDung(users, den === "da_duyet" ? { tieuDe: `Phiếu lương tháng ${ky_} đã có`, noiDung: "Mở để xem chi tiết công và các khoản. Thắc mắc báo nhân sự trong 1 ngày làm việc.", url: "/luong", tag: `luong-${kyId}` } : { tieuDe: `Lương tháng ${ky_} đã được chi`, noiDung: "Kiểm tra tài khoản và xem phiếu lương trong OMYN.", url: "/luong", tag: `luong-chi-${kyId}` });
  }
  lamMoi();
  return { ok: true };
}

// ─────────────── tham số ───────────────
export async function luuThamSo(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const khoa = chuoi(fd, "khoa", 60);
  const gia = Number(String(fd.get("gia_tri") ?? "").replace(/\./g, "").replace(",", "."));
  if (!/^[a-z0-9_]+$/.test(khoa) || !Number.isFinite(gia) || gia < 0) return { loi: "Giá trị không hợp lệ." };
  const { error } = await createAdminClient().from("tham_so_luong").update({ gia_tri: gia, xac_nhan_boi: null, xac_nhan_luc: null, cap_nhat_luc: new Date().toISOString() }).eq("khoa", khoa);
  if (error) return { loi: "Chưa lưu được tham số. Thử lại sau." };
  lamMoi();
  return { ok: true, thongBao: "Đã lưu. Tham số này cần xác nhận lại." };
}

export async function xacNhanThamSo(): Promise<KetQuaLuong> {
  const nd = await chiQuanTri();
  if (!nd) return KHONG_QUYEN;
  const { error } = await createAdminClient().from("tham_so_luong").update({ xac_nhan_boi: nd.id, xac_nhan_luc: new Date().toISOString() }).is("xac_nhan_luc", null);
  if (error) return { loi: "Chưa xác nhận được. Thử lại sau." };
  lamMoi();
  return { ok: true };
}
