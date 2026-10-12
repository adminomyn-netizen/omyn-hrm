"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import type { MucMenu } from "@/lib/nav";

const KHOA_LUU = "omyn-hrm-sidebar-thu-gon";

export function Sidebar({ menu }: { menu: MucMenu[] }) {
  const pathname = usePathname();
  const [thuGon, setThuGon] = useState(false);

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
      <div className={`flex items-center gap-2 px-4 py-5 ${thuGon ? "justify-center px-0" : ""}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-omyn-primary text-white font-bold text-sm">
          O
        </div>
        {!thuGon && (
          <div>
            <div className="font-semibold text-slate-900 leading-tight">OMYN</div>
            <div className="text-xs text-slate-500 leading-tight">HRM nội bộ</div>
          </div>
        )}
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
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!thuGon && muc.ten}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={doiTrangThai}
        title={thuGon ? "Mở rộng" : "Thu gọn"}
        className="flex items-center gap-2 border-t border-omyn-border px-4 py-3 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      >
        {thuGon ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        {!thuGon && "Thu gọn"}
      </button>
    </aside>
  );
}
