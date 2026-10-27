"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ngayHomNayHCM } from "@/lib/data";

/** Tự đăng ký (chủ dự án chốt 27/10/2026): đăng ký xong có tài khoản dùng được ngay, KHÔNG qua bước duyệt.
 * Vai trò mặc định là Nhân viên, kèm hồ sơ nhân sự mới ở phòng ban đã chọn (chức danh "Nhân viên");
 * Kỹ thuật chỉnh vị trí/vai trò sau. Vẫn KHÔNG tự gắn vào hồ sơ có sẵn theo email (email chưa xác minh,
 * ai cũng gõ được email của người khác): luôn tạo hồ sơ mới, nhân sự gộp nếu trùng. Quyền Quản trị vẫn
 * chỉ tự có theo vị trí (xem lib/auth.ts), đăng ký không bao giờ cấp được. */
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

  // Phòng ban chỉ để xếp hồ sơ nhân sự — không bao giờ dùng để cấp quyền.
  const khoiId = String(formData.get("khoi_id") || "");
  const admin = createAdminClient();
  const { data: khoi } = khoiId ? await admin.from("khoi").select("id").eq("id", khoiId).maybeSingle() : { data: null };
  if (!khoi) return { loi: "Bạn chọn phòng ban của mình giúp mình." };

  const { data: moi, error } = await admin.auth.admin.createUser({
    email,
    password: matKhau,
    email_confirm: true,
    app_metadata: { ho_ten: hoTen, vai_tro: "nhan_vien", cho_duyet: false, yeu_cau_khoi_id: khoiId },
  });

  if (error || !moi.user) {
    const daCo = error?.message?.toLowerCase().includes("already");
    return {
      loi: daCo
        ? "Email này đã có tài khoản. Bạn thử đăng nhập, hoặc nhờ Nhân sự đặt lại mật khẩu."
        : "Chưa tạo được tài khoản. Bạn thử lại sau ít phút.",
    };
  }

  const { error: loiHoSo } = await admin
    .from("nhan_vien")
    .insert({ ho_ten: hoTen, email, chuc_danh: "Nhân viên", khoi_id: khoi.id, ngay_vao_lam: ngayHomNayHCM(), trang_thai: "Đang làm", user_id: moi.user.id });
  if (loiHoSo) {
    // Không để lại tài khoản không có hồ sơ: hoàn tác để người dùng đăng ký lại được.
    await admin.auth.admin.deleteUser(moi.user.id);
    return { loi: "Chưa tạo được hồ sơ nhân sự. Bạn thử lại sau ít phút." };
  }

  redirect("/dang-nhap?dk=1");
}
