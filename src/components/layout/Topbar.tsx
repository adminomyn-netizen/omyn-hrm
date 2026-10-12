import { Bell, Search } from "lucide-react";
import { layNguoiDungHienTai } from "@/lib/auth";
import { ChuyenCheDo } from "@/components/layout/ChuyenCheDo";
import { NutDangXuat } from "@/components/layout/NutDangXuat";

export async function Topbar({ tieuDe }: { tieuDe: string }) {
  const nguoiDung = await layNguoiDungHienTai();

  return (
    <header className="flex items-center justify-between border-b border-omyn-border bg-omyn-surface px-4 py-4 lg:px-8">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{tieuDe}</h1>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-omyn-border bg-slate-50 px-3 py-1.5 text-sm text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          <Search className="h-4 w-4" />
          Tìm kiếm...
        </div>
        <ChuyenCheDo />
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-omyn-accent" />
        </button>

        {nguoiDung && (
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{nguoiDung.hoTen}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                {nguoiDung.vaiTro === "admin"
                  ? "Quản trị"
                  : nguoiDung.vaiTro === "ky_thuat"
                    ? "Kỹ thuật"
                    : "Nhân viên"}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-omyn-primary-light text-sm font-semibold text-omyn-primary-dark">
              {nguoiDung.hoTen.charAt(0).toUpperCase()}
            </div>
            <NutDangXuat />
          </div>
        )}
      </div>
    </header>
  );
}
