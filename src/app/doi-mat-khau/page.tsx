import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { NutDangXuat } from "@/components/layout/NutDangXuat";
import { FormDoiMatKhau } from "./FormDoiMatKhau";

/** Màn bắt buộc đổi mật khẩu cho tài khoản do quản trị tạo với mật khẩu tạm. Đã đổi rồi thì vào thẳng app. */
export default async function TrangDoiMatKhau() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) redirect("/dang-nhap");
  if (!nguoiDung.phaiDoiMatKhau) redirect("/dashboard");
  return (
    <AuthShell tieuDe="Đặt mật khẩu mới" moTa={`Tài khoản ${nguoiDung.email} đang dùng mật khẩu tạm. Đặt mật khẩu của riêng mình để vào app.`}>
      <FormDoiMatKhau />
      <div className="mt-6">
        <NutDangXuat />
      </div>
    </AuthShell>
  );
}
