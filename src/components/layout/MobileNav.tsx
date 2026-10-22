"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { gomTheoNhom, locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { useDemMenu } from "@/lib/dem-menu";

export const SU_KIEN_MO_MENU = "omyn-mo-menu";

/** Ngăn kéo menu cho điện thoại. Nút mở nằm ở đầu trang (Topbar) và bắn sự kiện SU_KIEN_MO_MENU. */
export function MobileNav({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const nhom = gomTheoNhom(locMenuTheoVaiTro(vaiTro));
  const dem = useDemMenu();
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
      <nav aria-label="Menu chính" className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-menu text-menu-chu shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <div className="flex h-14 items-center justify-between border-b border-menu-vien px-5">
          <span className="chu-tieu-de text-[26px] leading-none tracking-[0.2em] text-menu-sang">OMYN</span>
          <button type="button" onClick={() => setMo(false)} aria-label="Đóng menu" className="-mr-2 p-2 text-menu-chu-phu hover:text-menu-sang">
            <X strokeWidth={1.5} className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {nhom.map((g) => (
            <div key={g.nhom}>
              <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-menu-chu-phu">{g.nhom}</div>
              {g.muc.map((muc) => {
                const dangChon = pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
                const Icon = muc.icon;
                return (
                  <Link
                    key={muc.duong_dan}
                    href={muc.duong_dan}
                    onClick={() => setMo(false)}
                    className={`flex items-center gap-3 rounded-nho px-3 py-3 text-[15px] ${
                      dangChon ? "bg-menu-chon font-semibold text-menu-sang" : "font-medium text-menu-chu"
                    }`}
                  >
                    <Icon strokeWidth={1.5} className={`h-5 w-5 ${dangChon ? "text-menu-nhan" : "text-menu-chu-phu"}`} />
                    <span className="flex-1">{muc.ten}</span>
                    {(dem[muc.duong_dan] ?? 0) > 0 && <span className="nut-vang min-w-[20px] rounded-[10px] px-1.5 py-px text-center text-[11px] leading-[18px]">{dem[muc.duong_dan]}</span>}
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
