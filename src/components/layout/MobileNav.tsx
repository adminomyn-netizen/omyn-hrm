"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { gomTheoNhom, locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";

export function MobileNav({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const nhom = gomTheoNhom(locMenuTheoVaiTro(vaiTro));
  const [mo, setMo] = useState(false);

  // đóng menu mỗi khi chuyển trang
  useEffect(() => {
    setMo(false);
  }, [pathname]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-vien bg-giay-sang px-4 py-3 lg:hidden">
        <Logo size="sm" />
        <button
          onClick={() => setMo(true)}
          aria-label="Mở menu"
          className="-mr-2 p-2 text-muc-2 hover:text-muc"
        >
          <Menu strokeWidth={1.5} className="h-5 w-5" />
        </button>
      </div>

      {mo && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Đóng menu"
            className="absolute inset-0 bg-muc/30"
            onClick={() => setMo(false)}
          />
          <nav className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-giay-sang shadow-[0_8px_24px_rgba(34,30,26,0.08)]">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo size="sm" />
              <button
                onClick={() => setMo(false)}
                aria-label="Đóng menu"
                className="-mr-2 p-2 text-muc-2 hover:text-muc"
              >
                <X strokeWidth={1.5} className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
              {nhom.map((g) => (
                <div key={g.nhom}>
                  <div className="nhan-muc px-3 pb-2">{g.nhom}</div>
                  {g.muc.map((muc) => {
                    const dangChon =
                      pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
                    return (
                      <Link
                        key={muc.duong_dan}
                        href={muc.duong_dan}
                        className={`block border-l-2 px-3 py-3 text-[15px] ${
                          dangChon
                            ? "border-nhan font-semibold text-muc"
                            : "border-transparent font-medium text-muc-2"
                        }`}
                      >
                        {muc.ten}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
