"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { useDemMenu } from "@/lib/dem-menu";

/** Menu ngang cho máy tính (≥1024px), thay menu dọc: TOÀN BỘ chức năng hiện thẳng thành các nút có biểu tượng,
 * không gom nhóm; nút đang mở sáng vàng, số đếm nhỏ cạnh mục có việc chờ. Hẹp thì xuống dòng. */
export function MenuNgang({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const dem = useDemMenu();
  return (
    <nav aria-label="Menu chính" className="menu-ngang-omyn sticky top-[60px] z-20 hidden px-3 py-2 lg:block lg:px-8">
      <ul className="flex flex-wrap gap-1.5">
        {locMenuTheoVaiTro(vaiTro).map((m) => {
          const dang = pathname === m.duong_dan || pathname.startsWith(m.duong_dan + "/");
          const Icon = m.icon;
          const so = dem[m.duong_dan] ?? 0;
          return (
            <li key={m.duong_dan}>
              <Link href={m.duong_dan} title={m.moTa} aria-current={dang ? "page" : undefined}
                className={`muc-menu-omyn flex h-10 items-center gap-2 whitespace-nowrap rounded-nho px-3.5 text-[14px] ${dang ? "muc-menu-omyn-dang" : ""}`}>
                <Icon strokeWidth={1.7} className="h-[18px] w-[18px] shrink-0" aria-hidden />{m.ten}
                {so > 0 && <span className="nut-vang min-w-[20px] rounded-[10px] px-1.5 py-px text-center text-[11px] leading-[18px]">{so > 99 ? "99+" : so}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
