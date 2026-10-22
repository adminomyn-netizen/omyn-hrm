"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { gomTheoNhom, locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";

export const SU_KIEN_MO_MENU = "omyn-mo-menu";

/** Ngăn kéo menu cho điện thoại. Nút mở nằm ở đầu trang (Topbar) và bắn sự kiện SU_KIEN_MO_MENU. */
export function MobileNav({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const nhom = gomTheoNhom(locMenuTheoVaiTro(vaiTro));
  const [mo, setMo] = useState(false);

  useEffect(() => {
    const moMenu = () => setMo(true);
    window.addEventListener(SU_KIEN_MO_MENU, moMenu);
    return () => window.removeEventListener(SU_KIEN_MO_MENU, moMenu);
  }, []);

  useEffect(() => {
    if (!mo) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMo(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [mo]);

  if (!mo) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button aria-label="Đóng menu" className="absolute inset-0 bg-muc/35" onClick={() => setMo(false)} />
      <nav aria-label="Menu chính" className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-giay-sang shadow-[0_8px_24px_rgba(42,34,24,0.12)]">
        <div className="flex h-14 items-center justify-between border-b border-vien px-4">
          <Logo size="sm" />
          <button type="button" onClick={() => setMo(false)} aria-label="Đóng menu" className="-mr-2 p-2 text-muc-2 hover:text-muc">
            <X strokeWidth={1.5} className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {nhom.map((g) => (
            <div key={g.nhom}>
              <div className="nhan-muc px-3 pb-2">{g.nhom}</div>
              {g.muc.map((muc) => {
                const dangChon = pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
                const Icon = muc.icon;
                return (
                  <Link
                    key={muc.duong_dan}
                    href={muc.duong_dan}
                    onClick={() => setMo(false)}
                    className={`flex items-center gap-3 border-l-2 px-3 py-3 text-[15px] ${
                      dangChon ? "border-nhan bg-giay-tram font-semibold text-muc" : "border-transparent font-medium text-muc-2"
                    }`}
                  >
                    <Icon strokeWidth={1.5} className={`h-5 w-5 ${dangChon ? "text-nhan" : "text-muc-3"}`} />
                    {muc.ten}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
