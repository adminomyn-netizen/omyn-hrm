import "server-only";
import { createAdminClient } from "./supabase/admin";

// Lớp đọc dữ liệu — mọi trang gọi qua đây, không gọi Supabase trực tiếp trong
// component, để sau này đổi nguồn (ví dụ bật RLS + client theo người dùng) chỉ
// phải sửa một chỗ.

/** "Hôm nay" phải tính theo giờ HCM — server Vercel chạy UTC, nên sau 17h HCM
 * `new Date().toISOString()` đã sang ngày hôm sau ở UTC và lệch ngày. */
export function ngayHomNayHCM(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

/** Giờ hiện tại theo HCM, dạng "HH:MM:SS" — dùng khi chấm công vào/ra. */
export function gioHienTaiHCM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Tìm hồ sơ nhân sự gắn với 1 tài khoản đăng nhập — null nếu tài khoản
 * (ví dụ admin/kỹ thuật tạo tay) chưa được gắn với nhân viên nào. */
export async function layNhanVienIdTheoUser(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("nhan_vien")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

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

export async function layNhanVienTheoId(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("nhan_vien")
    .select("id, ma_nhan_vien, ho_ten, chuc_danh, khoi_id, email, ngay_vao_lam, trang_thai")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function layChamCongHomNay() {
  const supabase = createAdminClient();
  const homNay = ngayHomNayHCM();

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

/** Trả về (năm, tháng) hiện tại theo giờ HCM — dùng làm mặc định khi mở lịch chấm công. */
export function thangHienTaiHCM() {
  const [nam, thang] = ngayHomNayHCM().split("-").map(Number);
  return { nam, thang };
}

/** `nhanVienId` nếu truyền vào thì chỉ lấy chấm công của riêng người đó —
 * dùng cho vai trò nhân viên, không được thấy lịch của người khác. */
export async function layChamCongThang(nam: number, thang: number, nhanVienId?: string) {
  const supabase = createAdminClient();
  const thang2 = String(thang).padStart(2, "0");
  const tuNgay = `${nam}-${thang2}-01`;
  const ngayCuoiThang = new Date(nam, thang, 0).getDate();
  const denNgay = `${nam}-${thang2}-${String(ngayCuoiThang).padStart(2, "0")}`;

  let query = supabase
    .from("cham_cong")
    .select("id, ngay, gio_vao, gio_ra, trang_thai, nhan_vien(ho_ten)")
    .gte("ngay", tuNgay)
    .lte("ngay", denNgay)
    .order("ngay");
  if (nhanVienId) query = query.eq("nhan_vien_id", nhanVienId);

  const { data, error } = await query;
  if (error) throw error;

  return data.map((c) => ({
    id: c.id as string,
    ngay: c.ngay as string,
    hoTen: c.nhan_vien?.ho_ten ?? "",
    gioVao: c.gio_vao as string | null,
    gioRa: c.gio_ra as string | null,
    trangThai: c.trang_thai as string,
  }));
}

/** Chấm công hôm nay của riêng 1 nhân viên — null nếu chưa chấm công. */
export async function layChamCongHomNayCuaToi(nhanVienId: string) {
  const supabase = createAdminClient();
  const homNay = ngayHomNayHCM();
  const { data, error } = await supabase
    .from("cham_cong")
    .select("gio_vao, gio_ra, trang_thai")
    .eq("nhan_vien_id", nhanVienId)
    .eq("ngay", homNay)
    .maybeSingle();
  if (error) throw error;
  return data;
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

/** Đơn từ của riêng 1 nhân viên — dùng cho vai trò nhân viên, không thấy
 * đơn của người khác. */
export async function layDonTuCuaToi(nhanVienId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("don_tu")
    .select("id, loai, tu_ngay, den_ngay, trang_thai")
    .eq("nhan_vien_id", nhanVienId)
    .order("tu_ngay", { ascending: false });
  if (error) throw error;
  return data;
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

export async function layThongKeHeThong() {
  const supabase = createAdminClient();
  const bang = [
    "nhan_vien",
    "khoi",
    "cham_cong",
    "don_tu",
    "bang_luong",
    "tin_tuyen_dung",
    "ung_vien",
    "danh_gia_hieu_suat",
  ] as const;

  const ketQua = await Promise.all(
    bang.map(async (ten) => {
      const { count, error } = await supabase.from(ten).select("*", { count: "exact", head: true });
      if (error) throw error;
      return { bang: ten, soDong: count ?? 0 };
    }),
  );

  const { count: soDonChoDuyet, error: loiDon } = await supabase
    .from("don_tu")
    .select("*", { count: "exact", head: true })
    .eq("trang_thai", "Chờ duyệt");
  if (loiDon) throw loiDon;

  return { bang: ketQua, soDonChoDuyet: soDonChoDuyet ?? 0 };
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

export type TaiKhoanChoDuyet = {
  id: string;
  email: string;
  hoTen: string;
  taoLuc: string;
};

/** Tài khoản đã tự đăng ký nhưng chưa có vai trò (app_metadata.vai_tro trống). */
export async function layTaiKhoanChoDuyet(): Promise<TaiKhoanChoDuyet[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users
    .filter((u) => !u.app_metadata?.vai_tro)
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      hoTen: (u.app_metadata?.ho_ten as string) || (u.email ?? ""),
      taoLuc: u.created_at,
    }))
    .sort((a, b) => b.taoLuc.localeCompare(a.taoLuc));
}

/** Hồ sơ nhân sự chưa gắn tài khoản — để gắn khi duyệt. */
export async function layHoSoChuaGanTaiKhoan() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("nhan_vien")
    .select("id, ho_ten, chuc_danh, email")
    .is("user_id", null)
    .neq("trang_thai", "Đã nghỉ")
    .order("ho_ten");
  if (error) throw error;
  return data;
}
