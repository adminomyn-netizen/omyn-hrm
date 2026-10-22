"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function dangNhap(_truoc: { loi?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "");
  const matKhau = String(formData.get("mat_khau") || "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: matKhau });

  if (error) {
    return { loi: "Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại, hoặc nhờ Nhân sự đặt lại mật khẩu." };
  }

  // Về thẳng trang của vai trò để khỏi nhảy qua nhiều bước chuyển hướng.
  const vaiTro = data.user?.app_metadata?.vai_tro;
  redirect(vaiTro === "nhan_vien" || vaiTro === "admin" || vaiTro === "ky_thuat" ? "/dashboard" : "/cho-duyet");
}
