"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { Logo, LogoMark } from "@/components/brand/Logo";

const KHOA_LUU = "omyn-hrm-sidebar-thu-gon";

export function Sidebar({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const [thuGon, setThuGon] = useState(false);
  const menu = locMenuTheoVaiTro(vaiTro);

  useEffect(() => {
    try {
      setThuGon(localStorage.getItem(KHOA_LUU) === "1");
    } catch {
      // không truy cập được localStorage (chặn cookie...) — giữ mặc định mở
    }
  }, []);

  const doiTrangThai = () => {
    const moi = !thuGon;
    setThuGon(moi);
    try {
      localStorage.setItem(KHOA_LUU, moi ? "1" : "0");
    } catch {}
  };

  return (
    <aside
      className={`hidden lg:flex shrink-0 flex-col border-r border-omyn-border bg-omyn-surface transition-[width] duration-200 ${
        thuGon ? "w-[72px]" : "w-64"
      }`}
    >
      <div
        className={`flex items-center px-4 py-5 ${thuGon ? "flex-col gap-2 px-2" : "justify-between"}`}
      >
        {thuGon ? <LogoMark size="sm" /> : <Logo size="sm" />}
        <button
          onClick={doiTrangThai}
          title={thuGon ? "Mở rộng" : "Thu gọn"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          {thuGon ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {menu.map((muc) => {
          const dangChon =
            pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
          const Icon = muc.icon;
          return (
            <Link
              key={muc.duong_dan}
              href={muc.duong_dan}
              title={thuGon ? muc.ten : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                thuGon ? "justify-center px-0" : ""
              } ${
                dangChon
                  ? "bg-omyn-primary-light text-omyn-primary-dark"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!thuGon && muc.ten}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
