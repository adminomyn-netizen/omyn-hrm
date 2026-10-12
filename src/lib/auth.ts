import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type VaiTro = "admin" | "ky_thuat" | "nhan_vien";

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
    // Mặc định "nhan_vien" (quyền thấp nhất) nếu tài khoản chưa được gán vai
    // trò rõ ràng — tránh lỡ cấp quyền admin cho tài khoản tự đăng ký.
    vaiTro: (user.app_metadata?.vai_tro as VaiTro) ?? "nhan_vien",
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
