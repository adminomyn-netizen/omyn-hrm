"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { gomTheoNhom, locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";

export function Sidebar({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const nhom = gomTheoNhom(locMenuTheoVaiTro(vaiTro));

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-vien bg-giay-sang lg:flex">
      <div className="px-6 pb-6 pt-8">
        <Logo size="md" />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-8">
        {nhom.map((g) => (
          <div key={g.nhom}>
            <div className="nhan-muc px-3 pb-2">{g.nhom}</div>
            <ul>
              {g.muc.map((muc) => {
                const dangChon =
                  pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
                return (
                  <li key={muc.duong_dan}>
                    <Link
                      href={muc.duong_dan}
                      aria-current={dangChon ? "page" : undefined}
                      className={`block border-l-2 px-3 py-2 text-[14px] transition-colors ${
                        dangChon
                          ? "border-nhan font-semibold text-muc"
                          : "border-transparent font-medium text-muc-2 hover:bg-giay-tram hover:text-muc"
                      }`}
                    >
                      {muc.ten}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
