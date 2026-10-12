"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { MucMenu } from "@/lib/nav";

export function MobileNav({ menu }: { menu: MucMenu[] }) {
  const pathname = usePathname();
  const [mo, setMo] = useState(false);

  // đóng drawer mỗi khi chuyển trang
  useEffect(() => {
    setMo(false);
  }, [pathname]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-omyn-border bg-omyn-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-omyn-primary text-sm font-bold text-white">
            O
          </div>
          <div className="text-sm font-semibold text-slate-900">OMYN HRM</div>
        </div>
        <button
          onClick={() => setMo(true)}
          aria-label="Mở menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mo && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMo(false)}
          />
          <nav className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-omyn-surface shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-omyn-primary text-sm font-bold text-white">
                  O
                </div>
                <div>
                  <div className="font-semibold leading-tight text-slate-900">OMYN</div>
                  <div className="text-xs leading-tight text-slate-500">HRM nội bộ</div>
                </div>
              </div>
              <button
                onClick={() => setMo(false)}
                aria-label="Đóng menu"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              {menu.map((muc) => {
                const dangChon =
                  pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
                const Icon = muc.icon;
                return (
                  <Link
                    key={muc.duong_dan}
                    href={muc.duong_dan}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      dangChon
                        ? "bg-omyn-primary-light text-omyn-primary-dark"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {muc.ten}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
