import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { NutDangXuat } from "@/components/layout/NutDangXuat";

export default async function TrangChoDuyet() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) redirect("/dang-nhap");
  if (nguoiDung.vaiTro !== "cho_duyet") redirect("/cham-cong");

  return (
    <AuthShell tieuDe="Đang chờ duyệt" moTa={`Tài khoản ${nguoiDung.email} đã tạo xong.`}>
      <p className="text-[15px] leading-relaxed text-muc-2">
        Nhân sự sẽ kiểm tra và mở quyền cho bạn. Khi được duyệt, bạn đăng nhập lại là dùng được ngay.
        Cần gấp thì báo bộ phận Nhân sự.
      </p>
      <div className="mt-8">
        <NutDangXuat />
      </div>
    </AuthShell>
  );
}
