"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { congChuanTheoKy, tinhLuong, type DauVaoLuong, type ThamSo } from "@/lib/luong/tinh-luong";
import { layNgayChamCongTrongThang } from "@/lib/data";

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
    layNgayChamCongTrongThang(ky.nam, ky.thang),
  ]);
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
    const ngayCham = Math.min(co2(cc.get(n.id) ?? 0), congChuan);
    const dong: Dong = {
      luong_thoa_thuan: Number(t.luong_thoa_thuan), ty_le_kpi: t.ty_le_kpi, thu_viec: n.trang_thai === "Thử việc", cong_chuan: congChuan, cong_huong: ngayCham, ngay_lam: ngayCham,
      ty_le_ht_kpi: 100, phu_cap: Number(t.phu_cap), phu_cap_mien_thue: t.phu_cap_mien_thue, an_ca: t.an_ca, dong_bh: t.dong_bh, so_nguoi_phu_thuoc: t.so_nguoi_phu_thuoc,
      gio_ot_thuong: 0, gio_ot_nghi_tuan: 0, gio_ot_le: 0, hoa_hong: 0, thuong_khac: 0, khau_tru_khac: 0,
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
const co2 = (n: number) => n; // ngày chấm công (số nguyên) làm gợi ý ban đầu cho công thực tế, sửa tay được

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

/** Tính lại mọi dòng của kỳ theo tham số hiện hành (dùng sau khi đổi/xác nhận tham số). */
export async function tinhLaiKy(fd: FormData): Promise<KetQuaLuong> {
  if (!(await chiQuanTri())) return KHONG_QUYEN;
  const kyId = chuoi(fd, "ky_id", 40);
  if (!uuid(kyId)) return { loi: "Thiếu kỳ lương." };
  const kt = await kyDangSua(kyId);
  if ("loi" in kt) return { loi: kt.loi };
  const db = createAdminClient();
  const { p } = await docThamSo();
  const { data } = await db.from("bang_luong").select("*").eq("ky_luong_id", kyId);
  for (const d of data ?? []) {
    const { error } = await db.from("bang_luong").update(cotKetQua(tuDong(d as unknown as Dong), p)).eq("id", d.id);
    if (error) return { loi: "Chưa tính lại được. Thử lại sau." };
  }
  lamMoi();
  return { ok: true, thongBao: `Đã tính lại ${(data ?? []).length} dòng.` };
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
