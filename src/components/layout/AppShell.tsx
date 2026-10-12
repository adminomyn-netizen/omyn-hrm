import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { menuChinh } from "@/lib/nav";
import { layNguoiDungHienTai } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const nguoiDung = await layNguoiDungHienTai();
  const menu = menuChinh.filter(
    (m) => !m.chiVaiTro || (nguoiDung && m.chiVaiTro.includes(nguoiDung.vaiTro)),
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar menu={menu} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileNav menu={menu} />
        {children}
      </div>
    </div>
  );
}
