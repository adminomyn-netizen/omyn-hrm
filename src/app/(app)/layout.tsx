import { layNguoiDungDaDuyet } from "@/lib/auth";
import { layViTriHienThi } from "@/lib/data";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { DauTrang } from "@/components/layout/DauTrang";
import { ThanhTabDuoi } from "@/components/layout/ThanhTabDuoi";
import { ChatNoi } from "@/components/chat/ChatNoi";

/** Khung dùng chung cho mọi trang nội bộ. Layout KHÔNG dựng lại khi bấm đổi trang: menu và đầu trang đứng yên,
 * chỉ phần nội dung bên dưới đổi (kèm khung chờ loading.tsx hiện ngay lập tức). */
export default async function KhungUngDung({ children }: { children: React.ReactNode }) {
  const nguoiDung = await layNguoiDungDaDuyet();
  const viTri = await layViTriHienThi(nguoiDung.id, nguoiDung.vaiTro);

  return (
    <div className="khung-di-dong flex w-full flex-col lg:min-h-screen">
      <DauTrang hoTen={nguoiDung.hoTen} email={nguoiDung.email} vaiTro={nguoiDung.vaiTro} viTri={viTri} />
      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar vaiTro={nguoiDung.vaiTro} />
        <MobileNav vaiTro={nguoiDung.vaiTro} />
        {/* min-w-0: cho phép khối nội dung co lại, nội dung rộng (bảng, lịch) không đẩy tràn ngang cả trang trên di động. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="noi-dung-cuon min-h-0 flex-1 px-4 pb-8 pt-6 lg:px-10 lg:py-6">{children}</main>
          <ThanhTabDuoi vaiTro={nguoiDung.vaiTro} />
          <ChatNoi choPhepSua={nguoiDung.vaiTro === "ky_thuat"} hoTen={nguoiDung.hoTen} />
        </div>
      </div>
    </div>
  );
}
