"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuChinh } from "@/lib/nav";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-omyn-border bg-omyn-surface px-3 py-2 lg:hidden">
      {menuChinh.map((muc) => {
        const dangChon =
          pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
        const Icon = muc.icon;
        return (
          <Link
            key={muc.duong_dan}
            href={muc.duong_dan}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              dangChon
                ? "bg-omyn-primary text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {muc.ten}
          </Link>
        );
      })}
    </div>
  );
}
