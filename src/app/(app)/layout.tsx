import { layNguoiDungDaDuyet } from "@/lib/auth";
import { layViTriHienThi } from "@/lib/data";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { DauTrang } from "@/components/layout/DauTrang";
import { ThanhTabDuoi } from "@/components/layout/ThanhTabDuoi";

/** Khung dùng chung cho mọi trang nội bộ. Layout KHÔNG dựng lại khi bấm đổi trang: menu và đầu trang đứng yên,
 * chỉ phần nội dung bên dưới đổi (kèm khung chờ loading.tsx hiện ngay lập tức). */
export default async function KhungUngDung({ children }: { children: React.ReactNode }) {
  const nguoiDung = await layNguoiDungDaDuyet();
  const viTri = await layViTriHienThi(nguoiDung.id, nguoiDung.vaiTro);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DauTrang hoTen={nguoiDung.hoTen} email={nguoiDung.email} vaiTro={nguoiDung.vaiTro} viTri={viTri} />
      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar vaiTro={nguoiDung.vaiTro} />
        <MobileNav vaiTro={nguoiDung.vaiTro} />
        {/* min-w-0: cho phép khối nội dung co lại, nội dung rộng (bảng, lịch) không đẩy tràn ngang cả trang trên di động. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 lg:px-10 lg:py-6">{children}</main>
          <ThanhTabDuoi vaiTro={nguoiDung.vaiTro} />
        </div>
      </div>
    </div>
  );
}
