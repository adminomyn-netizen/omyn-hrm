"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { gomTheoNhom, locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { useLuuTru } from "@/lib/luu-tru";

export const KHOA_THU_GON = "omyn-hrm-sidebar-thu-gon";

/** Thanh điều hướng trái: mỗi mục có biểu tượng; thu gọn còn cột biểu tượng 72 px (rê chuột/focus hiện tên). */
export function Sidebar({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const [tg, ghiTg] = useLuuTru(KHOA_THU_GON, "0");
  const thuGon = tg === "1";
  const nhom = gomTheoNhom(locMenuTheoVaiTro(vaiTro));

  return (
    <aside
      className={`nen-trang hidden shrink-0 flex-col border-r border-vien transition-[width] duration-150 ease-out lg:flex ${
        thuGon ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <div className={`flex h-14 shrink-0 items-center border-b border-vien ${thuGon ? "justify-center px-2" : "justify-between pl-5 pr-3"}`}>
        {thuGon ? <LogoMark size="md" /> : <Logo size="md" />}
        {!thuGon && (
          <button
            type="button"
            onClick={() => ghiTg("1")}
            title="Thu gọn menu"
            aria-label="Thu gọn menu"
            className="rounded-nho p-2 text-muc-3 hover:bg-giay-tram hover:text-muc"
          >
            <ChevronsLeft strokeWidth={1.5} className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Menu chính">
        {nhom.map((g) => (
          <div key={g.nhom}>
            {thuGon ? (
              <div className="mx-2 mb-2 h-px bg-vien" aria-hidden />
            ) : (
              <div className="nhan-muc px-3 pb-2">{g.nhom}</div>
            )}
            <ul className="space-y-0.5">
              {g.muc.map((muc) => {
                const dangChon = pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
                const Icon = muc.icon;
                return (
                  <li key={muc.duong_dan}>
                    <Link
                      href={muc.duong_dan}
                      title={thuGon ? muc.ten : muc.moTa}
                      aria-label={thuGon ? muc.ten : undefined}
                      aria-current={dangChon ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-nho border-l-2 py-2 text-[14px] transition-colors ${
                        thuGon ? "justify-center px-0" : "px-3"
                      } ${
                        dangChon
                          ? "border-nhan bg-giay-tram font-semibold text-muc"
                          : "border-transparent font-medium text-muc-2 hover:bg-giay-tram/70 hover:text-muc"
                      }`}
                    >
                      <Icon strokeWidth={1.5} className={`h-[19px] w-[19px] shrink-0 ${dangChon ? "text-nhan" : "text-muc-3 group-hover:text-muc-2"}`} />
                      {!thuGon && <span className="truncate">{muc.ten}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {thuGon && (
        <div className="border-t border-vien p-3">
          <button
            type="button"
            onClick={() => ghiTg("0")}
            title="Mở rộng menu"
            aria-label="Mở rộng menu"
            className="flex h-10 w-full items-center justify-center rounded-nho text-muc-3 hover:bg-giay-tram hover:text-muc"
          >
            <ChevronsRight strokeWidth={1.5} className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}
    </aside>
  );
}
