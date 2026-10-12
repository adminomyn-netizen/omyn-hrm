"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuChinh } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-omyn-border bg-omyn-surface">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-omyn-primary text-white font-bold text-sm">
          O
        </div>
        <div>
          <div className="font-semibold text-slate-900 leading-tight">OMYN</div>
          <div className="text-xs text-slate-500 leading-tight">HRM nội bộ</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {menuChinh.map((muc) => {
          const dangChon =
            pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
          const Icon = muc.icon;
          return (
            <Link
              key={muc.duong_dan}
              href={muc.duong_dan}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                dangChon
                  ? "bg-omyn-primary-light text-omyn-primary-dark"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {muc.ten}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-omyn-border px-4 py-4 text-xs text-slate-400">
        Omyn HRM · nội bộ công ty
      </div>
    </aside>
  );
}
