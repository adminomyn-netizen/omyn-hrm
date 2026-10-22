export const dynamic = "force-dynamic";

import { AuthShell } from "@/components/auth/AuthShell";
import { layDanhSachKhoi } from "@/lib/data";
import { FormDangKy } from "./FormDangKy";

export default async function TrangDangKy() {
  // Tên bộ phận không nhạy cảm; nếu đọc lỗi thì vẫn hiện form (không chặn đăng ký).
  const khoi = await layDanhSachKhoi().then((k) => k.map((x) => ({ id: x.id, ten: x.ten }))).catch(() => []);
  return (
    <AuthShell tieuDe="Đăng ký" moTa="Tạo tài khoản của bạn và chọn phòng ban. Nhân sự sẽ duyệt và mở quyền trước khi bạn dùng được.">
      <FormDangKy khoi={khoi} />
    </AuthShell>
  );
}
