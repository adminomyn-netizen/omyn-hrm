import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { layNguoiDungHienTai } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const nguoiDung = await layNguoiDungHienTai();
  // CHỈ truyền chuỗi vai trò xuống client, không truyền cả mảng menu (có icon
  // là hàm React) — Next.js không cho truyền hàm từ Server Component sang
  // Client Component. Sidebar/MobileNav tự import menuChinh rồi lọc theo vaiTro.
  const vaiTro = nguoiDung?.vaiTro ?? null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar vaiTro={vaiTro} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileNav vaiTro={vaiTro} />
        {children}
      </div>
    </div>
  );
}
