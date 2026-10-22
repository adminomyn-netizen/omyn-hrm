"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function dangNhap(_truoc: { loi?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "");
  const matKhau = String(formData.get("mat_khau") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: matKhau });

  if (error) {
    return { loi: "Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại, hoặc nhờ Nhân sự đặt lại mật khẩu." };
  }

  redirect("/dashboard");
}
