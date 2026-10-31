"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { VaiTro } from "@/lib/auth";
import { cumCuaDuongDan, tabCuaCum } from "@/lib/nav";

/** Thanh tab đầu trang cho các màn đã gộp thành một cụm (xem CUM_TAB trong nav.tsx). Chỉ hiện tab người dùng đủ quyền; còn dưới 2 tab thì không hiện. */
export function ThanhTabCum({ vaiTro, duocMo }: { vaiTro: VaiTro | null; duocMo?: string[] }) {
  const pathname = usePathname();
  const c = cumCuaDuongDan(pathname);
  if (!c) return null;
  const tabs = tabCuaCum(c, vaiTro, duocMo);
  if (tabs.length < 2) return null;
  // Tab đang chọn: đường dẫn tab dài nhất khớp trang hiện tại.
  const dang = tabs.filter((t) => pathname === t.duong_dan || (t.duong_dan !== "/hr" && pathname.startsWith(t.duong_dan + "/"))).sort((a, b) => b.duong_dan.length - a.duong_dan.length)[0]?.duong_dan;
  return (
    <nav aria-label={c.ten} className="-mt-1 mb-5 flex gap-1 overflow-x-auto border-b border-vien">
      {tabs.map((t) => {
        const chon = t.duong_dan === dang;
        return (
          <Link
            key={t.duong_dan}
            href={t.duong_dan}
            aria-current={chon ? "page" : undefined}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[14px] font-medium transition-colors ${chon ? "border-nhan text-nhan-dam" : "border-transparent text-muc-2 hover:text-muc"}`}
          >
            {t.ten}
          </Link>
        );
      })}
    </nav>
  );
}
