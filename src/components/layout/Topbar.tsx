import { layNguoiDungHienTai } from "@/lib/auth";
import { NutDangXuat } from "@/components/layout/NutDangXuat";

const NHAN_VAI_TRO = { admin: "Quản trị", ky_thuat: "Kỹ thuật", nhan_vien: "Nhân viên", cho_duyet: "Chờ duyệt" } as const;

/** Đầu trang: tiêu đề serif bên trái, người dùng + đăng xuất bên phải, một
 * đường kẻ mảnh bên dưới — không khung, không thẻ (Phụ lục E.5). */
export async function Topbar({ tieuDe }: { tieuDe: string }) {
  const nguoiDung = await layNguoiDungHienTai();

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 dau-trang-vang border-b border-vien px-4 pb-5 pt-6 lg:px-12 lg:pt-10">
      <h1 className="chu-tieu-de text-[32px] text-muc lg:text-[36px]">{tieuDe}</h1>
      {nguoiDung && (
        <div className="flex items-center gap-4 pb-1">
          <div className="text-right leading-tight">
            <div className="text-[14px] font-medium text-muc">{nguoiDung.hoTen}</div>
            <div className="text-[12px] text-muc-3">{NHAN_VAI_TRO[nguoiDung.vaiTro]}</div>
          </div>
          <NutDangXuat />
        </div>
      )}
    </header>
  );
}
