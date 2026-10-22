"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { laViTriDangKy } from "@/lib/vi-tri-dang-ky";

/** Tự đăng ký (chủ dự án giữ mở, 22/10/2026) — nhưng tài khoản mới CHƯA có
 * quyền gì: không gán vai trò, không tạo hồ sơ nhân viên, không tự gắn theo
 * email (email chưa xác minh, ai cũng gõ được email của người khác). Nhân sự
 * duyệt thì mới gán vai trò và gắn vào hồ sơ. Trong lúc chờ, người đăng ký
 * chỉ thấy trang /cho-duyet. */
export async function dangKy(_truoc: { loi?: string } | undefined, formData: FormData) {
  // Ô bẫy máy: người thật không thấy ô này nên không bao giờ điền.
  if (String(formData.get("website") || "") !== "") {
    return { loi: "Không gửi được đăng ký." };
  }

  const hoTen = String(formData.get("ho_ten") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const matKhau = String(formData.get("mat_khau") || "");
  const xacNhan = String(formData.get("xac_nhan_mat_khau") || "");

  if (hoTen.length < 2 || hoTen.length > 80) {
    return { loi: "Bạn nhập họ tên đầy đủ giúp mình (2–80 ký tự)." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return { loi: "Email chưa đúng định dạng." };
  }
  if (matKhau.length < 8 || !/[A-Z]/.test(matKhau) || !/[^A-Za-z0-9]/.test(matKhau)) {
    return { loi: "Mật khẩu cần ít nhất 8 ký tự, có chữ in hoa và ký tự đặc biệt (ví dụ ! @ # $)." };
  }
  if (matKhau !== xacNhan) {
    return { loi: "Hai mật khẩu chưa khớp nhau." };
  }

  // Vị trí/bộ phận chỉ là YÊU CẦU để người duyệt xem — không bao giờ dùng để cấp quyền.
  const viTri = String(formData.get("vi_tri") || "nhan_vien");
  const khoiId = String(formData.get("khoi_id") || "");
  if (!laViTriDangKy(viTri)) return { loi: "Vị trí chưa hợp lệ." };

  const admin = createAdminClient();
  if (khoiId) {
    const { data: k } = await admin.from("khoi").select("id").eq("id", khoiId).maybeSingle();
    if (!k) return { loi: "Bộ phận chưa hợp lệ." };
  } else if (viTri !== "hr") {
    return { loi: "Bạn chọn bộ phận của mình giúp mình." };
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password: matKhau,
    email_confirm: true,
    // KHÔNG có vai_tro: thiếu vai trò = "chờ duyệt", không thấy dữ liệu nào.
    app_metadata: { ho_ten: hoTen, cho_duyet: true, yeu_cau_vi_tri: viTri, ...(khoiId ? { yeu_cau_khoi_id: khoiId } : {}) },
  });

  if (error) {
    const daCo = error.message?.toLowerCase().includes("already");
    return {
      loi: daCo
        ? "Email này đã có tài khoản. Bạn thử đăng nhập, hoặc nhờ Nhân sự đặt lại mật khẩu."
        : "Chưa tạo được tài khoản. Bạn thử lại sau ít phút.",
    };
  }

  const supabase = await createClient();
  const { error: loiDangNhap } = await supabase.auth.signInWithPassword({ email, password: matKhau });
  redirect(loiDangNhap ? "/dang-nhap" : "/cho-duyet");
}
