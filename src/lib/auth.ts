import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nenLaQuanTri } from "@/lib/chuc-danh";

export type VaiTro = "admin" | "ky_thuat" | "nhan_vien" | "cho_duyet";

const VAI_TRO_DA_DUYET = ["admin", "ky_thuat", "nhan_vien"] as const;

/** Giá trị lạ hoặc trống ⇒ "cho_duyet" (từ chối mặc định). */
function chuanHoaVaiTro(v: unknown): VaiTro {
  return (VAI_TRO_DA_DUYET as readonly unknown[]).includes(v) ? (v as VaiTro) : "cho_duyet";
}

/** Hồ sơ nhân sự của tài khoản có đang ở vị trí mặc định là Quản trị không. */
async function laViTriQuanTri(userId: string) {
  const { data } = await createAdminClient().from("nhan_vien").select("chuc_danh, trang_thai, khoi(ten)").eq("user_id", userId).maybeSingle();
  return !!data && data.trang_thai !== "Đã nghỉ" && nenLaQuanTri(data.chuc_danh, data.khoi?.ten);
}

/** Vai trò thật của một tài khoản theo mã người dùng (dùng cho chat nổi, nơi không có phiên trình duyệt): cùng luật với layNguoiDungHienTai. */
export async function vaiTroCuaNguoi(userId: string): Promise<{ vaiTro: VaiTro; hoTen: string } | null> {
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  const u = data?.user;
  if (!u) return null;
  const luu = chuanHoaVaiTro(u.app_metadata?.vai_tro);
  return { vaiTro: luu === "nhan_vien" && (await laViTriQuanTri(u.id)) ? "admin" : luu, hoTen: (u.app_metadata?.ho_ten as string) || (u.email ?? "") };
}

/** Mỗi yêu cầu chỉ hỏi Supabase Auth MỘT lần (React cache): layout, trang và hàm bảo vệ dùng chung kết quả. */
export const layNguoiDungHienTai = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const luu = chuanHoaVaiTro(user.app_metadata?.vai_tro);
  return {
    id: user.id,
    email: user.email ?? "",
    hoTen: (user.app_metadata?.ho_ten as string) || (user.email ?? ""),
    // Thiếu vai trò = "cho_duyet": tài khoản tự đăng ký chưa được Kỹ thuật duyệt, không có quyền gì.
    // app_metadata chỉ máy chủ sửa được (người dùng thì không). Quyền Quản trị đặt CỨNG theo vị trí:
    // phòng ban Hành chính nhân sự hoặc chức vụ Tổng giám đốc/Phó tổng giám đốc/Giám đốc/Phó giám đốc (xem chuc-danh.ts).
    vaiTro: luu === "nhan_vien" && (await laViTriQuanTri(user.id)) ? ("admin" as VaiTro) : luu,
  };
});

/** Chặn thật ở server cho các trang chỉ admin/kỹ thuật được xem — nav chỉ ẩn
 * mục menu, không chặn việc gõ thẳng URL, nên các trang toàn công ty phải
 * tự gọi hàm này. Không đủ quyền thì đưa về trang Chấm công của chính họ. */
export async function yeuCauVaiTro(choPhep: VaiTro[]) {
  const nguoiDung = await layNguoiDungDaDuyet();
  if (!choPhep.includes(nguoiDung.vaiTro)) {
    redirect("/cham-cong");
  }
  return nguoiDung;
}

/** Người đã đăng nhập VÀ đã được duyệt (có vai trò). Chưa đăng nhập → /dang-nhap,
 * chờ duyệt → /cho-duyet. Mọi trang có dữ liệu phải gọi hàm này TRƯỚC khi đọc dữ
 * liệu, rồi rẽ nhánh bằng danh sách trắng (admin/ky_thuat), không bằng "không phải nhân viên". */
export async function layNguoiDungDaDuyet() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) redirect("/dang-nhap");
  if (nguoiDung.vaiTro === "cho_duyet") redirect("/cho-duyet");
  return nguoiDung as typeof nguoiDung & { vaiTro: Exclude<VaiTro, "cho_duyet"> };
}

/** Dùng trong Server Action: trả về true nếu người gọi có một trong các vai trò.
 * Mọi action đụng dữ liệu nhân sự PHẢI gọi hàm này — Server Action là điểm
 * cuối POST công khai với ai đã đăng nhập, ẩn nút ở giao diện không chặn được. */
export async function coVaiTro(choPhep: VaiTro[]) {
  const nguoiDung = await layNguoiDungHienTai();
  return !!nguoiDung && choPhep.includes(nguoiDung.vaiTro);
}
