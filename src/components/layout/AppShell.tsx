import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const nguoiDung = await layNguoiDungHienTai();
  // CHỈ truyền chuỗi vai trò xuống client, không truyền cả mảng menu (có icon
  // là hàm React) — Next.js không cho truyền hàm từ Server Component sang
  // Client Component. Sidebar/MobileNav tự import menuChinh rồi lọc theo vaiTro.
  if (nguoiDung?.vaiTro === "cho_duyet") redirect("/cho-duyet");
  const vaiTro = nguoiDung?.vaiTro ?? null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar vaiTro={vaiTro} />
      {/* min-w-0: bỏ qua min-width:auto mặc định của flex item — không có dòng
       * này thì nội dung rộng bên trong (vd lưới react-big-calendar) sẽ ép
       * khung này không chịu co lại, đẩy tràn ngang cả trang trên di động. */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileNav vaiTro={vaiTro} />
        {children}
      </div>
    </div>
  );
}
