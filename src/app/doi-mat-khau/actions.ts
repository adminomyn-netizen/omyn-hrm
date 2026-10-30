"use server";

import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type KetQuaDoiMatKhau = { loi?: string } | undefined;

/** Đổi mật khẩu tạm lần đầu: nhập mật khẩu tạm, đặt mật khẩu mới (đủ mạnh, khác mật khẩu tạm), xong bỏ cờ bắt buộc đổi rồi vào app. Chỉ dùng phiên đăng nhập, không nhận id từ trình duyệt. */
export async function doiMatKhauLanDau(_truoc: KetQuaDoiMatKhau, fd: FormData): Promise<KetQuaDoiMatKhau> {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) redirect("/dang-nhap");
  const hienTai = String(fd.get("mat_khau_hien_tai") ?? "");
  const moi = String(fd.get("mat_khau_moi") ?? "");
  const nhapLai = String(fd.get("mat_khau_nhap_lai") ?? "");

  if (!hienTai) return { loi: "Nhập mật khẩu tạm đang dùng." };
  if (moi.length < 8 || !/[A-Z]/.test(moi) || !/[^A-Za-z0-9]/.test(moi)) return { loi: "Mật khẩu mới cần ít nhất 8 ký tự, có chữ in hoa và ký tự đặc biệt (ví dụ ! @ # $)." };
  if (moi === hienTai) return { loi: "Mật khẩu mới phải khác mật khẩu tạm." };
  if (moi !== nhapLai) return { loi: "Hai mật khẩu mới chưa khớp nhau." };

  const { error: sai } = await (await createClient()).auth.signInWithPassword({ email: nguoiDung.email, password: hienTai });
  if (sai) return { loi: "Mật khẩu tạm chưa đúng." };

  const admin = createAdminClient();
  const { data: tk } = await admin.auth.admin.getUserById(nguoiDung.id);
  if (!tk?.user) return { loi: "Không tìm thấy tài khoản." };
  const conLai = { ...(tk.user.app_metadata ?? {}) } as Record<string, unknown>;
  delete conLai.phai_doi_mat_khau;
  const { error } = await admin.auth.admin.updateUserById(nguoiDung.id, { password: moi, app_metadata: conLai });
  if (error) return { loi: "Chưa đổi được mật khẩu. Thử lại sau." };
  redirect("/dashboard");
}
