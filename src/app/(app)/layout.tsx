import { layNguoiDungDaDuyet } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { DauTrang } from "@/components/layout/DauTrang";

/** Khung dùng chung cho mọi trang nội bộ. Layout KHÔNG dựng lại khi bấm đổi trang: menu và đầu trang đứng yên,
 * chỉ phần nội dung bên dưới đổi (kèm khung chờ loading.tsx hiện ngay lập tức). */
export default async function KhungUngDung({ children }: { children: React.ReactNode }) {
  const nguoiDung = await layNguoiDungDaDuyet();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar vaiTro={nguoiDung.vaiTro} />
      <MobileNav vaiTro={nguoiDung.vaiTro} />
      {/* min-w-0: cho phép khối nội dung co lại, nội dung rộng (bảng, lịch) không đẩy tràn ngang cả trang trên di động. */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <DauTrang hoTen={nguoiDung.hoTen} email={nguoiDung.email} vaiTro={nguoiDung.vaiTro} />
        <main className="flex-1 px-4 py-6 lg:px-12 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
