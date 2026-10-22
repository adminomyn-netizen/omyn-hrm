import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type VaiTro = "admin" | "ky_thuat" | "nhan_vien" | "cho_duyet";

export async function layNguoiDungHienTai() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    hoTen: (user.app_metadata?.ho_ten as string) || (user.email ?? ""),
    // Thiếu vai trò = "cho_duyet": tài khoản tự đăng ký chưa được Nhân sự duyệt,
    // không có quyền gì. app_metadata chỉ máy chủ sửa được (người dùng thì không).
    vaiTro: (user.app_metadata?.vai_tro as VaiTro) ?? "cho_duyet",
  };
}

/** Chặn thật ở server cho các trang chỉ admin/kỹ thuật được xem — nav chỉ ẩn
 * mục menu, không chặn việc gõ thẳng URL, nên các trang toàn công ty phải
 * tự gọi hàm này. Không đủ quyền thì đưa về trang Chấm công của chính họ. */
export async function yeuCauVaiTro(choPhep: VaiTro[]) {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || !choPhep.includes(nguoiDung.vaiTro)) {
    redirect("/cham-cong");
  }
  return nguoiDung;
}

/** Dùng trong Server Action: trả về true nếu người gọi có một trong các vai trò.
 * Mọi action đụng dữ liệu nhân sự PHẢI gọi hàm này — Server Action là điểm
 * cuối POST công khai với ai đã đăng nhập, ẩn nút ở giao diện không chặn được. */
export async function coVaiTro(choPhep: VaiTro[]) {
  const nguoiDung = await layNguoiDungHienTai();
  return !!nguoiDung && choPhep.includes(nguoiDung.vaiTro);
}
