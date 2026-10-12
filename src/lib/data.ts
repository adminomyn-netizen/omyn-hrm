import "server-only";
import { createAdminClient } from "./supabase/admin";

// Lớp đọc dữ liệu — mọi trang gọi qua đây, không gọi Supabase trực tiếp trong
// component, để sau này đổi nguồn (ví dụ bật RLS + client theo người dùng) chỉ
// phải sửa một chỗ.

export async function layDanhSachKhoi() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("khoi")
    .select("id, ten, mo_ta")
    .order("ten");
  if (error) throw error;
  return data;
}

export async function layDanhSachNhanVien() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("nhan_vien")
    .select("id, ma_nhan_vien, ho_ten, chuc_danh, email, ngay_vao_lam, trang_thai, khoi(ten)")
    .order("ngay_vao_lam");
  if (error) throw error;
  return data.map((n) => ({ ...n, khoi_ten: n.khoi?.ten ?? "" }));
}

export async function layChamCongHomNay() {
  const supabase = createAdminClient();
  const homNay = new Date().toISOString().slice(0, 10);

  const [{ data: nhanVienDangLam, error: loi1 }, { data: chamCong, error: loi2 }] =
    await Promise.all([
      supabase.from("nhan_vien").select("id").neq("trang_thai", "Đã nghỉ"),
      supabase
        .from("cham_cong")
        .select("gio_vao, gio_ra, trang_thai, nhan_vien(ho_ten, khoi(ten))")
        .eq("ngay", homNay),
    ]);
  if (loi1) throw loi1;
  if (loi2) throw loi2;

  return {
    tongNhanVien: nhanVienDangLam.length,
    daChamCong: chamCong.length,
    diMuon: chamCong.filter((c) => c.trang_thai === "Đi muộn").length,
    vangMat: chamCong.filter((c) => c.trang_thai === "Vắng mặt").length,
    chiTiet: chamCong.map((c) => ({
      nhan_vien_ho_ten: c.nhan_vien?.ho_ten ?? "",
      khoi_ten: c.nhan_vien?.khoi?.ten ?? "",
      gio_vao: c.gio_vao,
      gio_ra: c.gio_ra,
      trang_thai: c.trang_thai,
    })),
  };
}

export async function layDonTu() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("don_tu")
    .select("id, loai, tu_ngay, den_ngay, trang_thai, nhan_vien:nhan_vien_id(ho_ten)")
    .order("tu_ngay", { ascending: false });
  if (error) throw error;
  return data.map((d) => ({ ...d, nhan_vien_ho_ten: d.nhan_vien?.ho_ten ?? "" }));
}

export async function layBangLuongKyGanNhat() {
  const supabase = createAdminClient();
  const { data: ky, error: loi1 } = await supabase
    .from("ky_luong")
    .select("id, ten_ky, da_thanh_toan")
    .order("ten_ky", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (loi1) throw loi1;
  if (!ky) return null;

  const { data: chiTiet, error: loi2 } = await supabase
    .from("bang_luong")
    .select("luong_co_ban, phu_cap, thuc_linh, nhan_vien(ho_ten, khoi(ten))")
    .eq("ky_luong_id", ky.id);
  if (loi2) throw loi2;

  return {
    ky: ky.ten_ky,
    daThanhToan: ky.da_thanh_toan,
    tongQuyLuong: chiTiet.reduce((tong, r) => tong + (r.thuc_linh ?? 0), 0),
    soNhanVien: chiTiet.length,
    chiTiet: chiTiet.map((r) => ({
      nhan_vien_ho_ten: r.nhan_vien?.ho_ten ?? "",
      khoi_ten: r.nhan_vien?.khoi?.ten ?? "",
      luong_co_ban: r.luong_co_ban,
      phu_cap: r.phu_cap,
      thuc_linh: r.thuc_linh ?? 0,
    })),
  };
}

export async function layTuyenDung() {
  const supabase = createAdminClient();
  const [{ data: tin, error: loi1 }, { data: ungVien, error: loi2 }] = await Promise.all([
    supabase
      .from("tin_tuyen_dung")
      .select("id, vi_tri, so_luong_can, trang_thai, khoi(ten)")
      .order("created_at", { ascending: false }),
    supabase.from("ung_vien").select("tin_tuyen_dung_id"),
  ]);
  if (loi1) throw loi1;
  if (loi2) throw loi2;

  const demTheoTin = new Map<string, number>();
  for (const u of ungVien) {
    demTheoTin.set(u.tin_tuyen_dung_id, (demTheoTin.get(u.tin_tuyen_dung_id) ?? 0) + 1);
  }

  return tin.map((t) => ({
    id: t.id,
    vi_tri: t.vi_tri,
    khoi_ten: t.khoi?.ten ?? "",
    so_luong_can: t.so_luong_can,
    so_ung_vien: demTheoTin.get(t.id) ?? 0,
    trang_thai: t.trang_thai,
  }));
}

export async function layDanhGiaKPI() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("danh_gia_hieu_suat")
    .select("id, ky, diem, xep_loai, nhan_vien:nhan_vien_id(ho_ten, khoi(ten))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((k) => ({
    id: k.id,
    nhan_vien_ho_ten: k.nhan_vien?.ho_ten ?? "",
    khoi_ten: k.nhan_vien?.khoi?.ten ?? "",
    ky: k.ky,
    diem: k.diem,
    xep_loai: k.xep_loai,
  }));
}
