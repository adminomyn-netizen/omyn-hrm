"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ngayHomNayHCM } from "@/lib/data";

export async function dangKy(_truoc: { loi?: string } | undefined, formData: FormData) {
  const hoTen = String(formData.get("ho_ten") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const matKhau = String(formData.get("mat_khau") || "");
  const xacNhanMatKhau = String(formData.get("xac_nhan_mat_khau") || "");

  if (!hoTen || !email) {
    return { loi: "Thiếu họ tên hoặc email." };
  }
  if (matKhau.length < 6) {
    return { loi: "Mật khẩu phải có ít nhất 6 ký tự." };
  }
  if (matKhau !== xacNhanMatKhau) {
    return { loi: "Hai mật khẩu nhập không khớp." };
  }

  const admin = createAdminClient();

  // Vai trò luôn là "nhan_vien" — tài khoản tự đăng ký không bao giờ được tự
  // gán admin/kỹ thuật, tránh leo quyền qua trang đăng ký mở.
  const { data: taoTaiKhoan, error: loiTaoTaiKhoan } = await admin.auth.admin.createUser({
    email,
    password: matKhau,
    email_confirm: true,
    app_metadata: { vai_tro: "nhan_vien", ho_ten: hoTen },
  });

  if (loiTaoTaiKhoan || !taoTaiKhoan.user) {
    const daTonTai = loiTaoTaiKhoan?.message?.toLowerCase().includes("already");
    return { loi: daTonTai ? "Email này đã có tài khoản, thử đăng nhập." : (loiTaoTaiKhoan?.message ?? "Không tạo được tài khoản.") };
  }

  const userId = taoTaiKhoan.user.id;

  // Nếu admin đã nhập sẵn hồ sơ nhân sự với email này (chưa gắn tài khoản) —
  // gắn vào hồ sơ có sẵn. Không có thì tạo hồ sơ tối giản, bổ sung chi tiết sau.
  const { data: hoSoCoSan } = await admin
    .from("nhan_vien")
    .select("id")
    .eq("email", email)
    .is("user_id", null)
    .maybeSingle();

  if (hoSoCoSan) {
    await admin.from("nhan_vien").update({ user_id: userId }).eq("id", hoSoCoSan.id);
  } else {
    await admin.from("nhan_vien").insert({
      ho_ten: hoTen,
      email,
      user_id: userId,
      trang_thai: "Đang làm",
      ngay_vao_lam: ngayHomNayHCM(),
    });
  }

  const supabase = await createClient();
  const { error: loiDangNhap } = await supabase.auth.signInWithPassword({ email, password: matKhau });
  if (loiDangNhap) {
    redirect("/dang-nhap");
  }

  // Tài khoản tự đăng ký luôn là vai trò nhân viên — trang của họ là Chấm công.
  redirect("/cham-cong");
}
