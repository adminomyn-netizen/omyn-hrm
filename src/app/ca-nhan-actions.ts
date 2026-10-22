"use server";

import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type KetQuaCaNhan = { loi?: string; ok?: boolean };

/** Người dùng tự sửa thông tin của MÌNH: họ tên hiển thị và (tuỳ chọn) mật khẩu.
 * Đổi mật khẩu phải nhập đúng mật khẩu hiện tại. Không bao giờ nhận id từ trình duyệt — chỉ dùng phiên đăng nhập. */
export async function capNhatThongTinCaNhan(fd: FormData): Promise<KetQuaCaNhan> {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) return { loi: "Bạn cần đăng nhập lại." };

  const hoTen = String(fd.get("ho_ten") ?? "").trim();
  const hienTai = String(fd.get("mat_khau_hien_tai") ?? "");
  const moi = String(fd.get("mat_khau_moi") ?? "");
  const nhapLai = String(fd.get("mat_khau_nhap_lai") ?? "");

  if (hoTen.length < 2 || hoTen.length > 80) return { loi: "Họ tên từ 2 đến 80 ký tự." };

  const admin = createAdminClient();
  const { data: tk } = await admin.auth.admin.getUserById(nguoiDung.id);
  if (!tk?.user) return { loi: "Không tìm thấy tài khoản." };

  if (moi || nhapLai || hienTai) {
    if (!hienTai) return { loi: "Nhập mật khẩu hiện tại để đổi mật khẩu." };
    if (moi.length < 8 || !/[A-Z]/.test(moi) || !/[^A-Za-z0-9]/.test(moi)) {
      return { loi: "Mật khẩu mới cần ít nhất 8 ký tự, có chữ in hoa và ký tự đặc biệt." };
    }
    if (moi !== nhapLai) return { loi: "Hai mật khẩu mới chưa khớp nhau." };
    // xác minh mật khẩu hiện tại bằng một lần đăng nhập thử (không đổi phiên hiện tại)
    const kiem = await createClient();
    const { error: sai } = await kiem.auth.signInWithPassword({ email: nguoiDung.email, password: hienTai });
    if (sai) return { loi: "Mật khẩu hiện tại chưa đúng." };
    const { error } = await admin.auth.admin.updateUserById(nguoiDung.id, { password: moi });
    if (error) return { loi: "Chưa đổi được mật khẩu. Thử lại sau." };
  }

  const { error: loiTen } = await admin.auth.admin.updateUserById(nguoiDung.id, {
    app_metadata: { ...tk.user.app_metadata, ho_ten: hoTen },
  });
  if (loiTen) return { loi: "Chưa lưu được họ tên. Thử lại sau." };
  return { ok: true };
}
