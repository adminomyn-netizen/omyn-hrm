import { hopViTri, tachViTri } from "@/lib/chuc-vu";
import { khongCanChamCong } from "@/lib/chuc-danh";
import { soNgayNghi } from "@/lib/don-tu";
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
const NHAN_VAI_TRO_NGAN = { admin: "Quản trị", ky_thuat: "Kỹ thuật", nhan_vien: "", cho_duyet: "" } as const;

/** Dòng "vị trí" hiện trong menu avatar: chức danh · phòng ban (+ vai trò hệ thống nếu là Quản trị/Kỹ thuật). */
export async function layViTriHienThi(userId: string, vaiTro: keyof typeof NHAN_VAI_TRO_NGAN) {
  const { data } = await createAdminClient().from("nhan_vien").select("chuc_danh, khoi(ten)").eq("user_id", userId).maybeSingle();
  const phan = [data?.chuc_danh, data?.khoi?.ten, NHAN_VAI_TRO_NGAN[vaiTro]].filter(Boolean) as string[];
  return phan.length ? phan.join(" · ") : "Chưa có hồ sơ nhân sự";
}

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

/** Hồ sơ của tài khoản + có phải chấm công không (Tổng giám đốc, Giám đốc, Kỹ thuật thì không). */
export async function layHoSoChamCong(userId: string, vaiTro: string) {
  const { data, error } = await createAdminClient().from("nhan_vien").select("id, ho_ten, chuc_danh").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return { nhanVienId: data?.id ?? null, hoTen: data?.ho_ten ?? null, chucDanh: data?.chuc_danh ?? null, canChamCong: !khongCanChamCong(vaiTro, data?.chuc_danh) };
}

/** Số ngày phép năm đã dùng + đang chờ duyệt của một người trong năm dương lịch `nam` (đơn bị từ chối không tính). */
export async function layPhepNamDaDung(nhanVienId: string, nam: number) {
  const { data, error } = await createAdminClient()
    .from("don_tu")
    .select("tu_ngay, den_ngay, gio_tu, gio_den")
    .eq("nhan_vien_id", nhanVienId)
    .eq("loai", "Nghỉ phép năm")
    .in("trang_thai", ["Chờ duyệt", "Đã duyệt"])
    .gte("tu_ngay", `${nam}-01-01`)
    .lte("tu_ngay", `${nam}-12-31`);
  if (error) throw error;
  return (data ?? []).reduce((t, d) => t + soNgayNghi(d.tu_ngay as string, d.den_ngay as string, d.gio_tu, d.gio_den), 0);
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
    .select("id, ma_nhan_vien, ho_ten, chuc_danh, khoi_id, email, ngay_vao_lam, trang_thai, khoi(ten)")
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

/** Mã tài khoản có vai trò Kỹ thuật — dùng để loại họ khỏi số người phải chấm công. */
async function layUserIdKyThuat() {
  const { data, error } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return new Set(data.users.filter((u) => u.app_metadata?.vai_tro === "ky_thuat").map((u) => u.id));
}

export async function layChamCongHomNay() {
  const supabase = createAdminClient();
  const homNay = ngayHomNayHCM();

  const [{ data: nhanVienDangLam, error: loi1 }, { data: chamCong, error: loi2 }] =
    await Promise.all([
      supabase.from("nhan_vien").select("id, chuc_danh, user_id").neq("trang_thai", "Đã nghỉ"),
      supabase
        .from("cham_cong")
        .select("gio_vao, gio_ra, trang_thai, nhan_vien(ho_ten, khoi(ten))")
        .eq("ngay", homNay),
    ]);
  if (loi1) throw loi1;
  if (loi2) throw loi2;
  const kyThuat = await layUserIdKyThuat();
  const canChamCong = nhanVienDangLam.filter((n) => !khongCanChamCong(n.user_id && kyThuat.has(n.user_id) ? "ky_thuat" : null, n.chuc_danh));

  return {
    tongNhanVien: canChamCong.length,
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
  const thang2 = String(thang).padStart(2, "0");
  const ngayCuoiThang = new Date(nam, thang, 0).getDate();
  return layChamCongKhoang(`${nam}-${thang2}-01`, `${nam}-${thang2}-${String(ngayCuoiThang).padStart(2, "0")}`, nhanVienId);
}

/** Chấm công trong một khoảng ngày bất kỳ (YYYY-MM-DD, gồm cả hai đầu). */
export async function layChamCongKhoang(tuNgay: string, denNgay: string, nhanVienId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("cham_cong")
    .select("id, ngay, gio_vao, gio_ra, trang_thai, nhan_vien(ho_ten, khoi(ten))")
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
    khoiTen: c.nhan_vien?.khoi?.ten ?? "",
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
    .select("id, loai, tu_ngay, den_ngay, gio_tu, gio_den, gio_vao_dung, gio_ra_dung, ly_do, trang_thai, nhan_vien:nhan_vien_id(ho_ten)")
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
    .select("id, loai, tu_ngay, den_ngay, gio_tu, gio_den, gio_vao_dung, gio_ra_dung, ly_do, trang_thai")
    .eq("nhan_vien_id", nhanVienId)
    .order("tu_ngay", { ascending: false });
  if (error) throw error;
  return data;
}

/** Kỳ lương gần nhất (theo năm/tháng) kèm tổng — dùng cho chỉ số "Quỹ lương" ở Tổng quan. */
export async function layBangLuongKyGanNhat() {
  const supabase = createAdminClient();
  const { data: ky, error: loi1 } = await supabase
    .from("ky_luong")
    .select("id, ten_ky, trang_thai")
    .order("nam", { ascending: false })
    .order("thang", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (loi1) throw loi1;
  if (!ky) return null;

  const { data: chiTiet, error: loi2 } = await supabase.from("bang_luong").select("tong_thu_nhap, thuc_linh").eq("ky_luong_id", ky.id);
  if (loi2) throw loi2;

  return {
    ky: ky.ten_ky,
    daThanhToan: ky.trang_thai === "da_chi",
    tongQuyLuong: chiTiet.reduce((tong, r) => tong + Number(r.tong_thu_nhap ?? 0), 0),
    soNhanVien: chiTiet.length,
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
  /** Phòng ban người đăng ký TỰ CHỌN — chỉ để tham khảo khi duyệt. */
  yeuCau: { khoiId: string; khoiTen: string } | null;
};

/** Tài khoản đã tự đăng ký nhưng chưa có vai trò (app_metadata.vai_tro trống). */
export async function layTaiKhoanChoDuyet(): Promise<TaiKhoanChoDuyet[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const cho = data.users.filter((u) => !u.app_metadata?.vai_tro);
  const khoiTen = new Map<string, string>();
  if (cho.some((u) => u.app_metadata?.yeu_cau_khoi_id)) {
    const { data: ds } = await supabase.from("khoi").select("id, ten");
    for (const k of ds ?? []) khoiTen.set(k.id, k.ten);
  }
  return cho
    .map((u) => {
      const khoiId = String(u.app_metadata?.yeu_cau_khoi_id ?? "");
      return {
        id: u.id,
        email: u.email ?? "",
        hoTen: (u.app_metadata?.ho_ten as string) || (u.email ?? ""),
        taoLuc: u.created_at,
        yeuCau: khoiId ? { khoiId, khoiTen: khoiTen.get(khoiId) ?? "" } : null,
      };
    })
    .sort((a, b) => b.taoLuc.localeCompare(a.taoLuc));
}

/** Hồ sơ nhân sự chưa gắn tài khoản — để gắn khi duyệt. */
export async function layHoSoChuaGanTaiKhoan() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("nhan_vien")
    .select("id, ho_ten, chuc_danh, email, khoi(ten)")
    .is("user_id", null)
    .neq("trang_thai", "Đã nghỉ")
    .order("ho_ten");
  if (error) throw error;
  return data.map((h) => ({ id: h.id, ho_ten: h.ho_ten, chuc_danh: h.chuc_danh, email: h.email, khoi_ten: h.khoi?.ten ?? null }));
}

/** Tin tuyển dụng + toàn bộ ứng viên (dữ liệu nhỏ, để màn tuyển dụng lọc ở trình duyệt). */
export async function layTuyenDungDayDu() {
  const supabase = createAdminClient();
  const [tin, uv] = await Promise.all([
    supabase
      .from("tin_tuyen_dung")
      .select("id, vi_tri, khoi_id, so_luong_can, trang_thai, mo_ta, han_nop, created_at, khoi(ten)")
      .order("created_at", { ascending: false }),
    supabase
      .from("ung_vien")
      .select("id, tin_tuyen_dung_id, ho_ten, email, dien_thoai, trang_thai, nam_sinh, nguon, link_cv, ghi_chu, ngay_phong_van, ngay_nhan_ho_so")
      .order("ngay_nhan_ho_so", { ascending: false }),
  ]);
  if (tin.error) throw tin.error;
  if (uv.error) throw uv.error;
  return {
    tin: tin.data.map((t) => ({ ...t, khoi_ten: t.khoi?.ten ?? "" })),
    ungVien: uv.data,
  };
}

export type ThongBao = {
  id: string; // ổn định theo sự việc — dùng để nhớ "đã đọc" ở trình duyệt
  loai: "tai_khoan" | "don_tu" | "ung_vien" | "tin" | "cham_cong" | "he_thong";
  tieuDe: string;
  noiDung: string;
  thoiDiem: string; // ISO
  href: string;
};

const ngayVN = (d: string) => d.split("-").reverse().join("/");

/** Thông báo THẬT, suy ra từ dữ liệu hiện có (không có bảng thông báo riêng):
 *  - quản lý (admin/kỹ thuật): tài khoản chờ duyệt, đơn chờ duyệt, ứng viên mới 7 ngày, tin sắp/đã hết hạn nộp;
 *  - nhân viên: kết quả duyệt đơn của mình (14 ngày), nhắc chưa chấm công, chưa gắn hồ sơ. */
export async function layThongBao(
  nguoiDung: { id: string; vaiTro: "admin" | "ky_thuat" | "nhan_vien" },
): Promise<{ ds: ThongBao[]; dem: Record<string, number> }> {
  const db = createAdminClient();
  const ra: ThongBao[] = [];
  const dem: Record<string, number> = {};
  const bayNgayTruoc = new Date(Date.now() - 7 * 86400_000).toISOString();
  const muoiBonNgayTruoc = new Date(Date.now() - 14 * 86400_000).toISOString();

  if (nguoiDung.vaiTro === "admin" || nguoiDung.vaiTro === "ky_thuat") {
    const [tk, don, uv, tin, demDon, demUv] = await Promise.all([
      layTaiKhoanChoDuyet(),
      db
        .from("don_tu")
        .select("id, loai, tu_ngay, den_ngay, created_at, nhan_vien:nhan_vien_id(ho_ten)")
        .eq("trang_thai", "Chờ duyệt")
        .order("created_at", { ascending: false })
        .limit(10),
      db
        .from("ung_vien")
        .select("id, ho_ten, tin_tuyen_dung_id, ngay_nhan_ho_so, tin:tin_tuyen_dung_id(vi_tri)")
        .gte("ngay_nhan_ho_so", bayNgayTruoc.slice(0, 10))
        .order("ngay_nhan_ho_so", { ascending: false })
        .limit(10),
      db.from("tin_tuyen_dung").select("id, vi_tri, han_nop, trang_thai").neq("trang_thai", "Đã đóng").not("han_nop", "is", null),
      db.from("don_tu").select("id", { count: "exact", head: true }).eq("trang_thai", "Chờ duyệt"),
      db.from("ung_vien").select("id", { count: "exact", head: true }).eq("trang_thai", "Mới nộp"),
    ]);
    // Duyệt tài khoản chỉ Kỹ thuật làm: chỉ Kỹ thuật được báo và đếm.
    if (nguoiDung.vaiTro !== "ky_thuat") tk.length = 0;
    dem["/dashboard"] = tk.length;
    dem["/don-tu"] = demDon.count ?? 0;
    dem["/tuyen-dung"] = demUv.count ?? 0;
    for (const t of tk.slice(0, 10)) {
      ra.push({ id: `tk-${t.id}`, loai: "tai_khoan", tieuDe: "Tài khoản mới chờ duyệt", noiDung: `${t.hoTen} (${t.email}) vừa đăng ký.`, thoiDiem: t.taoLuc, href: "/dashboard" });
    }
    for (const d of don.data ?? []) {
      const ten = (d.nhan_vien as { ho_ten?: string } | null)?.ho_ten ?? "Nhân viên";
      ra.push({
        id: `don-${d.id}`,
        loai: "don_tu",
        tieuDe: "Đơn chờ duyệt",
        noiDung: `${ten} xin ${d.loai.toLowerCase()} (${ngayVN(d.tu_ngay)}${d.den_ngay !== d.tu_ngay ? " – " + ngayVN(d.den_ngay) : ""}).`,
        thoiDiem: d.created_at,
        href: "/don-tu",
      });
    }
    for (const u of uv.data ?? []) {
      const viTri = (u.tin as { vi_tri?: string } | null)?.vi_tri ?? "một vị trí";
      ra.push({ id: `uv-${u.id}`, loai: "ung_vien", tieuDe: "Ứng viên mới", noiDung: `${u.ho_ten} nộp hồ sơ vị trí ${viTri}.`, thoiDiem: `${u.ngay_nhan_ho_so}T08:00:00+07:00`, href: "/tuyen-dung" });
    }
    const homNay = ngayHomNayHCM();
    const baNgay = new Date(Date.now() + 3 * 86400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    for (const t of tin.data ?? []) {
      if (!t.han_nop) continue;
      if (t.han_nop < homNay) {
        ra.push({ id: `tin-het-${t.id}-${t.han_nop}`, loai: "tin", tieuDe: "Tin đã quá hạn nộp", noiDung: `Tin "${t.vi_tri}" quá hạn nộp hồ sơ ngày ${ngayVN(t.han_nop)} nhưng chưa đóng.`, thoiDiem: `${t.han_nop}T17:00:00+07:00`, href: "/tuyen-dung" });
      } else if (t.han_nop <= baNgay) {
        ra.push({ id: `tin-sap-${t.id}-${t.han_nop}`, loai: "tin", tieuDe: "Tin sắp hết hạn nộp", noiDung: `Tin "${t.vi_tri}" hết hạn nộp hồ sơ ngày ${ngayVN(t.han_nop)}.`, thoiDiem: new Date().toISOString(), href: "/tuyen-dung" });
      }
    }
  } else {
    const nvId = await layNhanVienIdTheoUser(nguoiDung.id);
    if (!nvId) {
      ra.push({ id: "chua-gan-ho-so", loai: "he_thong", tieuDe: "Chưa gắn hồ sơ nhân sự", noiDung: "Tài khoản của bạn chưa gắn với hồ sơ nhân sự, nên chưa chấm công được. Báo bộ phận Nhân sự.", thoiDiem: new Date().toISOString(), href: "/cham-cong" });
    } else {
      const [don, cc] = await Promise.all([
        db
          .from("don_tu")
          .select("id, loai, tu_ngay, trang_thai, created_at")
          .eq("nhan_vien_id", nvId)
          .neq("trang_thai", "Chờ duyệt")
          .gte("created_at", muoiBonNgayTruoc)
          .order("created_at", { ascending: false })
          .limit(10),
        layChamCongHomNayCuaToi(nvId),
      ]);
      for (const d of don.data ?? []) {
        ra.push({
          id: `don-kq-${d.id}-${d.trang_thai}`,
          loai: "don_tu",
          tieuDe: d.trang_thai === "Đã duyệt" ? "Đơn đã được duyệt" : "Đơn bị từ chối",
          noiDung: `Đơn ${d.loai.toLowerCase()} ngày ${ngayVN(d.tu_ngay)} ${d.trang_thai === "Đã duyệt" ? "đã được duyệt" : "bị từ chối"}.`,
          thoiDiem: d.created_at,
          href: "/don-tu",
        });
      }
      const gio = gioHienTaiHCM();
      if (!cc?.gio_vao && gio >= "08:30:00") {
        ra.push({ id: `chua-cham-cong-${ngayHomNayHCM()}`, loai: "cham_cong", tieuDe: "Bạn chưa chấm công hôm nay", noiDung: "Hôm nay chưa có giờ vào. Vào trang Chấm công để chấm công.", thoiDiem: new Date().toISOString(), href: "/cham-cong" });
      }
    }
  }

  return { ds: ra.sort((a, b) => b.thoiDiem.localeCompare(a.thoiDiem)).slice(0, 25), dem };
}

/** Danh sách tài khoản đăng nhập + vai trò + hồ sơ nhân sự gắn kèm — chỉ để Quản trị xem ở Cài đặt. */
export async function layDanhSachTaiKhoan() {
  const db = createAdminClient();
  const [{ data: ds, error }, { data: hoSo }] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 200 }),
    db.from("nhan_vien").select("user_id, ho_ten, chuc_danh").not("user_id", "is", null),
  ]);
  if (error) throw error;
  const theoUser = new Map((hoSo ?? []).map((h) => [h.user_id as string, h]));
  return ds.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      hoTen: (u.app_metadata?.ho_ten as string) || (u.email ?? ""),
      vaiTro: (["admin", "ky_thuat", "nhan_vien"].includes(String(u.app_metadata?.vai_tro)) ? String(u.app_metadata?.vai_tro) : "cho_duyet") as "admin" | "ky_thuat" | "nhan_vien" | "cho_duyet",
      hoSo: theoUser.get(u.id)?.ho_ten ?? null,
      taoLuc: u.created_at,
      dangNhapLuc: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

const BUOC_PHAU = ["Mới nộp", "Hẹn phỏng vấn", "Vòng 1", "Vòng 2", "Đề nghị", "Nhận việc"];
const cong = (iso: string, soNgay: number) => new Date(new Date(`${iso}T00:00:00+07:00`).getTime() + soNgay * 86400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

/** Toàn bộ số liệu cho trang Tổng quan (đều từ dữ liệu thật; dải xu hướng tính từ ngày tạo/ngày vào làm). */
export async function layDuLieuTongQuan(vaiTro?: "admin" | "ky_thuat" | "nhan_vien") {
  const db = createAdminClient();
  const homNay = ngayHomNayHCM();
  const [nv, cc, don, uv, tin, luong, tk] = await Promise.all([
    db.from("nhan_vien").select("id, trang_thai, ngay_vao_lam, khoi(ten)"),
    db.from("cham_cong").select("gio_vao, trang_thai").eq("ngay", homNay),
    db.from("don_tu").select("id, loai, tu_ngay, den_ngay, trang_thai, created_at, nhan_vien:nhan_vien_id(ho_ten)"),
    db.from("ung_vien").select("id, ho_ten, trang_thai, ngay_phong_van, ngay_nhan_ho_so, tin_tuyen_dung_id, tin:tin_tuyen_dung_id(vi_tri)"),
    db.from("tin_tuyen_dung").select("id, vi_tri, so_luong_can, han_nop, trang_thai"),
    layBangLuongKyGanNhat(),
    layTaiKhoanChoDuyet(),
  ]);
  for (const r of [nv, cc, don, uv, tin]) if (r.error) throw r.error;
  if (vaiTro !== "ky_thuat") tk.length = 0; // việc duyệt tài khoản chỉ Kỹ thuật thấy

  const nhanVien = nv.data!;
  const dangLamDs = nhanVien.filter((n) => n.trang_thai !== "Đã nghỉ");
  const tong = dangLamDs.length;

  // xu hướng nhân sự: số người có mặt ở cuối 6 tháng gần nhất
  const cuoiThang = Array.from({ length: 6 }, (_, i) => {
    const [y, m] = homNay.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 - (5 - i) + 1, 0));
    return d.toISOString().slice(0, 10);
  });
  const xuHuongNv = cuoiThang.map((c) => dangLamDs.filter((n) => (n.ngay_vao_lam ?? "9999") <= (c > homNay ? homNay : c)).length);
  const moiVao30 = dangLamDs.filter((n) => (n.ngay_vao_lam ?? "0") >= cong(homNay, -30)).length;

  // đơn: chờ duyệt + xu hướng theo tuần (7 tuần)
  const donCho = don.data!.filter((d) => d.trang_thai === "Chờ duyệt");
  const xuHuongDon = Array.from({ length: 7 }, (_, i) => {
    const den = cong(homNay, -(6 - i) * 7);
    const tu = cong(den, -6);
    return don.data!.filter((d) => d.created_at.slice(0, 10) >= tu && d.created_at.slice(0, 10) <= den).length;
  });

  // ứng viên 7 ngày
  const uvMoi = uv.data!.filter((u) => u.ngay_nhan_ho_so >= cong(homNay, -6));
  const xuHuongUv = Array.from({ length: 7 }, (_, i) => {
    const ngay = cong(homNay, -(6 - i));
    return uv.data!.filter((u) => u.ngay_nhan_ho_so === ngay).length;
  });
  const dangPv = uv.data!.filter((u) => ["Hẹn phỏng vấn", "Vòng 1", "Vòng 2", "Đề nghị"].includes(u.trang_thai)).length;

  // chấm công hôm nay: 10 ô nửa giờ từ 07:00
  const gioVao = cc.data!.map((c) => c.gio_vao).filter(Boolean) as string[];
  const o = Array.from({ length: 10 }, (_, i) => {
    const batDau = 7 * 60 + i * 30;
    return gioVao.filter((g) => {
      const ph = Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5));
      return ph >= batDau && ph < batDau + 30;
    }).length;
  });
  const daCham = cc.data!.length;
  const diMuon = cc.data!.filter((c) => c.trang_thai === "Đi muộn").length;

  // việc cần bạn
  const phongVan = uv.data!
    .filter((u) => u.ngay_phong_van && u.ngay_phong_van >= homNay && ["Hẹn phỏng vấn", "Vòng 1", "Vòng 2"].includes(u.trang_thai))
    .sort((a, b) => (a.ngay_phong_van! < b.ngay_phong_van! ? -1 : 1))
    .slice(0, 3);
  const viec: { loai: "tk" | "don" | "pv"; tieuDe: string; phu: string; nut: string; href: string }[] = [
    ...tk.slice(0, 2).map((t) => ({ loai: "tk" as const, tieuDe: "Duyệt tài khoản mới đăng ký", phu: `${t.hoTen} · ${t.email}`, nut: "Duyệt", href: "/dashboard#tai-khoan" })),
    ...donCho.slice(0, 3).map((d) => ({ loai: "don" as const, tieuDe: d.loai, phu: `${(d.nhan_vien as { ho_ten?: string } | null)?.ho_ten ?? ""} · ${d.tu_ngay.split("-").reverse().slice(0, 2).join("/")}`, nut: "Xem đơn", href: "/don-tu" })),
    ...phongVan.map((u) => ({ loai: "pv" as const, tieuDe: `Phỏng vấn: ${u.ho_ten}`, phu: `${(u.tin as { vi_tri?: string } | null)?.vi_tri ?? ""} · ${u.ngay_phong_van!.split("-").reverse().slice(0, 2).join("/")}`, nut: "Xem hồ sơ", href: `/tuyen-dung?tin=${u.tin_tuyen_dung_id}` })),
  ].slice(0, 5);

  // tin đang tuyển + tiến độ phễu
  const tinMo = tin.data!.filter((t) => t.trang_thai !== "Đã đóng").map((t) => {
    const ds = uv.data!.filter((u) => u.tin_tuyen_dung_id === t.id);
    const maxBuoc = ds.reduce((m, u) => Math.max(m, BUOC_PHAU.indexOf(u.trang_thai) + 1), 0);
    return { id: t.id, viTri: t.vi_tri, trangThai: t.trang_thai, can: t.so_luong_can, hanNop: t.han_nop, soUv: ds.length, buoc: maxBuoc };
  });

  const theoKhoi = new Map<string, number>();
  for (const n of dangLamDs) {
    const k = (n.khoi as { ten?: string } | null)?.ten ?? "Chưa gán khối";
    theoKhoi.set(k, (theoKhoi.get(k) ?? 0) + 1);
  }

  return {
    tong,
    tongHoSo: nhanVien.length,
    dangLam: nhanVien.filter((n) => n.trang_thai === "Đang làm").length,
    thuViec: nhanVien.filter((n) => n.trang_thai === "Thử việc").length,
    xuHuongNv,
    moiVao30,
    donCho: donCho.length,
    xuHuongDon,
    uvMoi: uvMoi.length,
    xuHuongUv,
    dangPv,
    luong,
    chamCong: { tong, da: daCham, diMuon, chua: Math.max(0, tong - daCham), dungGio: Math.max(0, daCham - diMuon), o },
    viec,
    soTaiKhoanCho: tk.length,
    tinMo,
    khoi: [...theoKhoi.entries()].map(([ten, so]) => ({ ten, so })).sort((a, b) => b.so - a.so),
  };
}

/** Khối kèm số nhân viên đang làm và số tin tuyển dụng đang mở. */
export async function layKhoiDayDu() {
  const db = createAdminClient();
  const [khoi, nv, tin] = await Promise.all([
    db.from("khoi").select("id, ten, mo_ta").order("ten"),
    db.from("nhan_vien").select("khoi_id, chuc_danh").neq("trang_thai", "Đã nghỉ"),
    db.from("tin_tuyen_dung").select("khoi_id").neq("trang_thai", "Đã đóng"),
  ]);
  if (khoi.error) throw khoi.error;
  const dem = (ds: { khoi_id: string | null }[] | null) => {
    const m = new Map<string, number>();
    for (const x of ds ?? []) if (x.khoi_id) m.set(x.khoi_id, (m.get(x.khoi_id) ?? 0) + 1);
    return m;
  };
  const dn = dem(nv.data);
  const dt = dem(tin.data);
  // Vị trí của khối: những vị trí khai báo ở khối + chức vụ của nhân viên đang làm trong khối (tự động).
  const theoKhoi = new Map<string, string[]>();
  for (const n of nv.data ?? []) if (n.khoi_id && n.chuc_danh) theoKhoi.set(n.khoi_id, [...(theoKhoi.get(n.khoi_id) ?? []), n.chuc_danh]);
  return khoi.data.map((k) => ({ ...k, viTri: hopViTri(tachViTri(k.mo_ta), theoKhoi.get(k.id) ?? []), soNhanVien: dn.get(k.id) ?? 0, soTinMo: dt.get(k.id) ?? 0 }));
}

// ───────────────────────── LƯƠNG ─────────────────────────
export async function layThamSoLuong() {
  const { data, error } = await createAdminClient().from("tham_so_luong").select("khoa, nhan, gia_tri, don_vi, nguon, xac_nhan_luc").order("khoa");
  if (error) throw error;
  return data.map((t) => ({ ...t, gia_tri: Number(t.gia_tri) }));
}

export async function layKyLuong() {
  const db = createAdminClient();
  const [ky, dong] = await Promise.all([
    db.from("ky_luong").select("id, ten_ky, thang, nam, trang_thai, ghi_chu, chuyen_luc").order("nam", { ascending: false }).order("thang", { ascending: false }),
    db.from("bang_luong").select("ky_luong_id, thuc_linh, tong_thu_nhap"),
  ]);
  if (ky.error) throw ky.error;
  const tong = new Map<string, { soNguoi: number; thucLinh: number; tongThuNhap: number }>();
  for (const d of dong.data ?? []) {
    const t = tong.get(d.ky_luong_id) ?? { soNguoi: 0, thucLinh: 0, tongThuNhap: 0 };
    t.soNguoi++;
    t.thucLinh += Number(d.thuc_linh);
    t.tongThuNhap += Number(d.tong_thu_nhap);
    tong.set(d.ky_luong_id, t);
  }
  return ky.data.map((k) => ({ ...k, ...(tong.get(k.id) ?? { soNguoi: 0, thucLinh: 0, tongThuNhap: 0 }) }));
}

export async function layDongLuongCuaKy(kyId: string) {
  const { data, error } = await createAdminClient()
    .from("bang_luong")
    .select("*, nhan_vien(ho_ten, chuc_danh, ma_nhan_vien, khoi(ten))")
    .eq("ky_luong_id", kyId);
  if (error) throw error;
  return data
    .map((d) => ({ ...d, ho_ten: d.nhan_vien?.ho_ten ?? "", chuc_danh: d.nhan_vien?.chuc_danh ?? "", khoi_ten: d.nhan_vien?.khoi?.ten ?? "" }))
    .sort((a, b) => a.ho_ten.localeCompare(b.ho_ten, "vi"));
}

/** Nhân viên còn làm + thỏa thuận lương (nếu đã nhập). */
export async function layThoaThuanLuong() {
  const db = createAdminClient();
  const [nv, tt] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, chuc_danh, trang_thai, khoi(ten)").neq("trang_thai", "Đã nghỉ").order("ho_ten"),
    db.from("luong_thoa_thuan").select("*"),
  ]);
  if (nv.error) throw nv.error;
  const map = new Map((tt.data ?? []).map((t) => [t.nhan_vien_id, t]));
  return nv.data.map((n) => ({ id: n.id, ho_ten: n.ho_ten, chuc_danh: n.chuc_danh ?? "", trang_thai: n.trang_thai, khoi_ten: n.khoi?.ten ?? "", thoaThuan: map.get(n.id) ?? null }));
}

/** Phiếu lương của chính mình: chỉ kỳ đã duyệt hoặc đã chi. */
export async function layPhieuLuongCuaToi(nhanVienId: string) {
  const { data, error } = await createAdminClient()
    .from("bang_luong")
    .select("*, ky:ky_luong_id(ten_ky, thang, nam, trang_thai)")
    .eq("nhan_vien_id", nhanVienId);
  if (error) throw error;
  return data
    .filter((d) => d.ky && ["da_duyet", "da_chi"].includes(d.ky.trang_thai))
    .sort((a, b) => (b.ky!.nam! - a.ky!.nam!) * 100 + ((b.ky!.thang ?? 0) - (a.ky!.thang ?? 0)));
}

/** Số ngày có chấm công (không phải "Vắng mặt") của một nhân viên trong tháng — gợi ý ban đầu cho công thực tế. */
export async function layNgayChamCongTrongThang(nam: number, thang: number) {
  const tu = `${nam}-${String(thang).padStart(2, "0")}-01`;
  const den = `${nam}-${String(thang).padStart(2, "0")}-${new Date(Date.UTC(nam, thang, 0)).getUTCDate()}`;
  const { data, error } = await createAdminClient().from("cham_cong").select("nhan_vien_id, trang_thai").gte("ngay", tu).lte("ngay", den);
  if (error) throw error;
  const m = new Map<string, number>();
  for (const c of data) if (c.trang_thai !== "Vắng mặt") m.set(c.nhan_vien_id, (m.get(c.nhan_vien_id) ?? 0) + 1);
  return m;
}

/** Tổng quan cho NHÂN VIÊN: chỉ dữ liệu của chính mình (hồ sơ, chấm công hôm nay + tháng này, đơn từ, phiếu lương đã duyệt). */
export async function layTongQuanCuaToi(userId: string) {
  const db = createAdminClient();
  const { data: hs, error } = await db.from("nhan_vien").select("id, ho_ten, chuc_danh, ngay_vao_lam, khoi(ten)").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!hs) return null;
  const { nam, thang } = thangHienTaiHCM();
  const t2 = String(thang).padStart(2, "0");
  const tu = `${nam}-${t2}-01`;
  const den = `${nam}-${t2}-${String(new Date(nam, thang, 0).getDate()).padStart(2, "0")}`;
  const [homNay, congThang, don, donCho, phieu] = await Promise.all([
    layChamCongHomNayCuaToi(hs.id),
    db.from("cham_cong").select("trang_thai").eq("nhan_vien_id", hs.id).gte("ngay", tu).lte("ngay", den),
    db.from("don_tu").select("id, loai, tu_ngay, den_ngay, trang_thai").eq("nhan_vien_id", hs.id).order("created_at", { ascending: false }).limit(5),
    db.from("don_tu").select("id", { count: "exact", head: true }).eq("nhan_vien_id", hs.id).eq("trang_thai", "Chờ duyệt"),
    layPhieuLuongCuaToi(hs.id),
  ]);
  const cc = congThang.data ?? [];
  return {
    hoSo: { hoTen: hs.ho_ten, chucDanh: hs.chuc_danh ?? "", khoi: hs.khoi?.ten ?? "", ngayVaoLam: hs.ngay_vao_lam as string },
    homNay,
    thang: { nam, thang, ngayCong: cc.filter((c) => c.trang_thai !== "Vắng mặt").length, diMuon: cc.filter((c) => c.trang_thai === "Đi muộn").length },
    don: don.data ?? [],
    donCho: donCho.count ?? 0,
    phieuMoiNhat: phieu[0] ? { tenKy: phieu[0].ky?.ten_ky ?? "", daChi: phieu[0].ky?.trang_thai === "da_chi" } : null,
  };
}
