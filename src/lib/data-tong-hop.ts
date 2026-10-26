import { createAdminClient } from "@/lib/supabase/admin";
import { layTaiKhoanChoDuyet, ngayHomNayHCM } from "@/lib/data";
import { layTomTatHoSo } from "@/lib/data-ho-so";

export type MucViec = { ma: string; so: number; nhan: string; href: string; muc: "gap" | "thuong" };
export type Cum = { ten: string; moTa: string; muc: { nhan: string; so: number | string; href: string; canhBao?: boolean }[] };

/** Số liệu cho trang Tổng hợp: "việc gấp hôm nay" (chỉ những mục có việc) + các cụm vận hành. Mọi số lấy trực tiếp từ dữ liệu, không nhập tay. */
export async function layTongHop(laKyThuat: boolean) {
  const db = createAdminClient();
  const homNay = ngayHomNayHCM();
  const [donCho, ycCho, ycDang, pvHomNay, tinQuaHan, uvMoi, ccHomNay, nvDangLam, kyLuong, taiKhoan, tomTat] = await Promise.all([
    db.from("don_tu").select("id", { count: "exact", head: true }).eq("trang_thai", "Chờ duyệt"),
    db.from("yeu_cau_tuyen_dung").select("id", { count: "exact", head: true }).eq("trang_thai", "Chờ tiếp nhận"),
    db.from("yeu_cau_tuyen_dung").select("id", { count: "exact", head: true }).in("trang_thai", ["Đã tiếp nhận", "Đang đăng tin"]),
    db.from("ung_vien").select("id", { count: "exact", head: true }).eq("ngay_phong_van", homNay).not("trang_thai", "in", "(Không đạt,Nhận việc)"),
    db.from("tin_tuyen_dung").select("id", { count: "exact", head: true }).neq("trang_thai", "Đã đóng").lt("han_nop", homNay),
    db.from("ung_vien").select("id", { count: "exact", head: true }).eq("trang_thai", "Mới nộp"),
    db.from("cham_cong").select("id", { count: "exact", head: true }).eq("ngay", homNay),
    db.from("nhan_vien").select("id", { count: "exact", head: true }).neq("trang_thai", "Đã nghỉ"),
    db.from("ky_luong").select("ten_ky, trang_thai").order("nam", { ascending: false }).order("thang", { ascending: false }).limit(1).maybeSingle(),
    laKyThuat ? layTaiKhoanChoDuyet() : Promise.resolve([]),
    layTomTatHoSo(),
  ]);
  let thieuGiayTo = 0, choXacNhan = 0;
  for (const t of tomTat.values()) { if (t.thieu.length > 0) thieuGiayTo++; choXacNhan += t.choXacNhan; }

  const viec = ([
    { ma: "tk", so: taiKhoan.length, nhan: "tài khoản mới đăng ký chờ duyệt", href: "/dashboard", muc: "gap" },
    { ma: "don", so: donCho.count ?? 0, nhan: "đơn từ chờ duyệt", href: "/don-tu", muc: "gap" },
    { ma: "yc", so: ycCho.count ?? 0, nhan: "yêu cầu tuyển dụng chờ tiếp nhận", href: "/tuyen-dung?tab=yeu-cau", muc: "gap" },
    { ma: "pv", so: pvHomNay.count ?? 0, nhan: "ứng viên phỏng vấn hôm nay", href: "/tuyen-dung?tab=tin", muc: "gap" },
    { ma: "han", so: tinQuaHan.count ?? 0, nhan: "tin tuyển dụng quá hạn nộp mà chưa đóng", href: "/tuyen-dung?tab=tin", muc: "gap" },
    { ma: "uv", so: uvMoi.count ?? 0, nhan: "ứng viên mới nộp chưa xử lý", href: "/tuyen-dung?tab=tin", muc: "thuong" },
    { ma: "gt", so: choXacNhan, nhan: "giấy tờ nhân viên chờ xác nhận", href: "/nhan-su", muc: "thuong" },
    { ma: "ho-so", so: thieuGiayTo, nhan: "nhân viên còn thiếu giấy tờ bắt buộc", href: "/nhan-su", muc: "thuong" },
  ] as MucViec[]).filter((v) => v.so > 0);

  const cum: Cum[] = [
    { ten: "Con người", moTa: "Hồ sơ và tuyển dụng", muc: [
      { nhan: "Nhân viên đang làm", so: nvDangLam.count ?? 0, href: "/nhan-su" },
      { nhan: "Thiếu giấy tờ bắt buộc", so: thieuGiayTo, href: "/nhan-su", canhBao: thieuGiayTo > 0 },
      { nhan: "Yêu cầu tuyển dụng đang xử lý", so: (ycCho.count ?? 0) + (ycDang.count ?? 0), href: "/tuyen-dung?tab=yeu-cau" },
      { nhan: "Ứng viên mới nộp", so: uvMoi.count ?? 0, href: "/tuyen-dung?tab=tin" },
    ] },
    { ten: "Hằng ngày", moTa: "Chấm công và đơn từ", muc: [
      { nhan: "Đã chấm công hôm nay", so: `${ccHomNay.count ?? 0}/${nvDangLam.count ?? 0}`, href: "/bang-cong" },
      { nhan: "Đơn chờ duyệt", so: donCho.count ?? 0, href: "/don-tu", canhBao: (donCho.count ?? 0) > 0 },
    ] },
    { ten: "Tiền lương", moTa: "Kỳ lương gần nhất", muc: [
      { nhan: kyLuong.data ? `${kyLuong.data.ten_ky}` : "Chưa có kỳ lương", so: kyLuong.data ? TEN_KY[kyLuong.data.trang_thai] ?? kyLuong.data.trang_thai : "—", href: "/luong" },
    ] },
  ];
  return { viec, cum, homNay };
}

const TEN_KY: Record<string, string> = { mo: "Đang mở", da_lap: "Đã lập", da_kiem: "Đã kiểm", da_duyet: "Đã duyệt", da_chi: "Đã chi" };
