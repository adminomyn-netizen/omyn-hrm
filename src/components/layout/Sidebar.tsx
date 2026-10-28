"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { gomTheoNhom, locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { useLuuTru } from "@/lib/luu-tru";
import { useDemMenu } from "@/lib/dem-menu";

export const KHOA_THU_GON = "omyn-hrm-sidebar-thu-gon";

/** Menu trái nền espresso (cả khi giao diện sáng): mục đang mở nền sáng nhẹ + biểu tượng vàng; số đếm dải vàng.
 * Thu gọn còn cột biểu tượng 72 px; rê chuột/focus hiện tên và mô tả. */
export function Sidebar({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const [tg, ghiTg] = useLuuTru(KHOA_THU_GON, "0");
  const dem = useDemMenu();
  const thuGon = tg === "1";
  const nhom = gomTheoNhom(locMenuTheoVaiTro(vaiTro));

  return (
    <aside
      className={`thanh-ben-omyn sticky top-3 m-3 mr-0 hidden h-[calc(100vh-24px)] shrink-0 flex-col self-start rounded-[14px] text-menu-chu transition-[width] duration-150 ease-out lg:flex ${
        thuGon ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center ${thuGon ? "justify-center px-2" : "justify-between pl-6 pr-3"}`}>
        {thuGon ? (
          <span className="chu-tieu-de text-[26px] tracking-[0.05em] text-menu-sang">O</span>
        ) : (
          <>
            <span className="flex items-center gap-2">
              <span className="chu-tieu-de text-[30px] leading-none tracking-[0.2em] text-menu-sang">OMYN</span>
              <span aria-hidden className="h-2 w-2" style={{ background: "var(--gradient-vang)", borderRadius: 9999 }} />
            </span>
            <button
              type="button"
              onClick={() => ghiTg("1")}
              title="Thu gọn menu"
              aria-label="Thu gọn menu"
              className="rounded-nho p-2 text-menu-chu-phu hover:bg-menu-hover hover:text-menu-sang"
            >
              <ChevronsLeft strokeWidth={1.5} className="h-[18px] w-[18px]" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 pb-6 pt-3" aria-label="Menu chính">
        {nhom.map((g) => (
          <div key={g.nhom}>
            {thuGon ? (
              <div className="mx-2 mb-2 h-px bg-menu-vien" aria-hidden />
            ) : (
              <div className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-menu-chu-phu">{g.nhom}</div>
            )}
            <ul className="space-y-0.5">
              {g.muc.map((muc) => {
                const dangChon = pathname === muc.duong_dan || pathname.startsWith(muc.duong_dan + "/");
                const Icon = muc.icon;
                const so = dem[muc.duong_dan] ?? 0;
                return (
                  <li key={muc.duong_dan}>
                    <Link
                      href={muc.duong_dan}
                      title={thuGon ? muc.ten : muc.moTa}
                      aria-label={thuGon && so ? `${muc.ten}, ${so} mục mới` : thuGon ? muc.ten : undefined}
                      aria-current={dangChon ? "page" : undefined}
                      className={`group relative flex items-center gap-3 rounded-nho py-2.5 text-[14px] transition-colors ${
                        thuGon ? "justify-center px-0" : "px-2.5"
                      } ${dangChon ? "muc-menu-omyn-dang" : "font-medium text-menu-chu hover:bg-menu-hover hover:text-menu-sang"}`}
                    >
                      <Icon strokeWidth={1.6} className={`h-[19px] w-[19px] shrink-0 ${dangChon ? "" : "text-menu-chu-phu group-hover:text-menu-chu"}`} />
                      {!thuGon && <span className="flex-1 truncate">{muc.ten}</span>}
                      {so > 0 && !thuGon && (
                        <span className="nut-vang min-w-[20px] rounded-[10px] px-1.5 py-px text-center text-[11px] leading-[18px]">{so > 99 ? "99+" : so}</span>
                      )}
                      {so > 0 && thuGon && <span aria-hidden className="absolute right-3 top-2 h-2 w-2" style={{ background: "var(--gradient-vang)", borderRadius: 9999 }} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {thuGon && (
        <div className="border-t border-menu-vien p-3.5">
          <button
            type="button"
            onClick={() => ghiTg("0")}
            title="Mở rộng menu"
            aria-label="Mở rộng menu"
            className="flex h-10 w-full items-center justify-center rounded-nho text-menu-chu-phu hover:bg-menu-hover hover:text-menu-sang"
          >
            <ChevronsRight strokeWidth={1.5} className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}
    </aside>
  );
}
