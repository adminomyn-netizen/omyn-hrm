"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { duongDanDangChon, gomTheoNhom, locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { useLuuTru } from "@/lib/luu-tru";
import { useDemMenu } from "@/lib/dem-menu";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";

export const KHOA_THU_GON = "omyn-hrm-sidebar-thu-gon";
const KHOA_MO_NHOM = "omyn-hrm-menu-nhom-mo";

/** Menu trái nền espresso (cả khi giao diện sáng): mục đang mở nền sáng nhẹ + biểu tượng vàng; số đếm dải vàng.
 * Thu gọn còn cột biểu tượng 72 px; rê chuột/focus hiện tên và mô tả. */
export function Sidebar({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const [tg, ghiTg] = useLuuTru(KHOA_THU_GON, "0");
  const dem = useDemMenu();
  const thuGon = tg === "1";
  const menu = locMenuTheoVaiTro(vaiTro, true);
  const nhom = gomTheoNhom(menu);
  const chonDuong = duongDanDangChon(pathname, menu);
  // Nhóm gọn lại cho đỡ rối: bấm tiêu đề nhóm nào cũng mở/đóng được (nhớ lại cho lần sau). Chưa chọn gì thì chỉ "Chung" và nhóm đang đứng trong đó mở.
  const [moRaw, ghiMo] = useLuuTru(KHOA_MO_NHOM, "{}");
  const mo = useMemo<Record<string, boolean>>(() => { try { return JSON.parse(moRaw); } catch { return {}; } }, [moRaw]);
  const coMucDangChon = (g: (typeof nhom)[number]) => g.muc.some((m) => m.duong_dan === chonDuong);
  const dangMo = (g: (typeof nhom)[number]) => thuGon || g.nhom === "Chung" || (g.nhom in mo ? mo[g.nhom] : coMucDangChon(g));

  return (
    <aside
      className={`thanh-ben-omyn sticky top-[84px] m-4 mr-0 hidden shrink-0 flex-col self-start rounded-[20px] text-menu-chu transition-[width] duration-150 ease-out lg:flex ${
        thuGon ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <div className={`flex shrink-0 items-center px-3 pt-3 ${thuGon ? "flex-col gap-2" : "justify-between"}`}>
        {/* Chỗ logo: đang dùng logo chữ OMYN tạm; khi có file logo chính thức chỉ cần thay các tệp trong public/brand (giữ nguyên tên, cùng tỉ lệ). */}
        <Link href="/dashboard" aria-label="Omyn — Tổng quan" className="flex h-10 items-center px-1.5">
          {thuGon ? <Image src="/brand/bieu-tuong-sang.svg" alt="Omyn" width={28} height={28} unoptimized /> : <Logo size="md" nenToi />}
        </Link>
        <button
          type="button"
          onClick={() => ghiTg(thuGon ? "0" : "1")}
          title={thuGon ? "Mở rộng menu" : "Thu nhỏ menu"}
          aria-label={thuGon ? "Mở rộng menu" : "Thu nhỏ menu"}
          className="rounded-nho p-2 text-menu-chu-phu hover:bg-menu-hover hover:text-menu-sang"
        >
          {thuGon ? <ChevronsRight strokeWidth={1.5} className="h-[18px] w-[18px]" /> : <ChevronsLeft strokeWidth={1.5} className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <nav className="cuon-an-thanh max-h-[calc(100vh-190px)] space-y-5 overflow-y-auto px-3.5 pb-5 pt-2" aria-label="Menu chính">
        {nhom.map((g) => (
          <div key={g.nhom}>
            {thuGon ? (
              <div className="mx-2 mb-2 h-px bg-menu-vien" aria-hidden />
            ) : (
              g.nhom === "Chung" ? (
                <div className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-menu-chu-phu">{g.nhom}</div>
              ) : (
                <button
                  type="button"
                  aria-expanded={dangMo(g)}
                  onClick={() => ghiMo(JSON.stringify({ ...mo, [g.nhom]: !dangMo(g) }))}
                  className="flex w-full items-center gap-2 rounded-nho px-2.5 pb-2 pt-1 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-menu-chu-phu hover:text-menu-chu"
                >
                  <span className="flex-1">{g.nhom}</span>
                  {!dangMo(g) && g.muc.some((m) => (dem[m.duong_dan] ?? 0) > 0) && <span aria-label="Có mục mới" className="h-2 w-2" style={{ background: "var(--gradient-vang)", borderRadius: 9999 }} />}
                  <ChevronDown strokeWidth={1.6} className={`h-3.5 w-3.5 transition-transform ${dangMo(g) ? "" : "-rotate-90"}`} />
                </button>
              )
            )}
            <ul className={`space-y-0.5 ${dangMo(g) ? "" : "hidden"}`}>
              {g.muc.map((muc) => {
                const dangChon = muc.duong_dan === chonDuong;
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

    </aside>
  );
}
