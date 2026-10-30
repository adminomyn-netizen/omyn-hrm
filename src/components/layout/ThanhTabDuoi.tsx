"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  FolderOpen,
  Grid2x2,
  Inbox,
  LayoutDashboard,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { VaiTro } from "@/lib/auth";
import { useDemMenu } from "@/lib/dem-menu";
import { SU_KIEN_MO_MENU } from "./MobileNav";

type Tab = { ten: string; Icon: LucideIcon; href?: string; sk?: string };

const TAB_NHAN_VIEN: Tab[] = [
  { ten: "Tổng quan", Icon: LayoutDashboard, href: "/dashboard" },
  { ten: "Chấm công", Icon: Clock, href: "/cham-cong" },
  { ten: "Đơn từ", Icon: Inbox, href: "/don-tu" },
  { ten: "Hồ sơ", Icon: FolderOpen, href: "/ho-so-cua-toi" },
  { ten: "Thêm", Icon: Grid2x2, sk: SU_KIEN_MO_MENU },
];
const TAB_QUAN_LY: Tab[] = [
  { ten: "Tổng quan", Icon: LayoutDashboard, href: "/dashboard" },
  { ten: "Nhân sự", Icon: Users, href: "/nhan-su" },
  { ten: "Tuyển dụng", Icon: UserPlus, href: "/tuyen-dung" },
  { ten: "Đơn từ", Icon: Inbox, href: "/don-tu" },
  { ten: "Thêm", Icon: Grid2x2, sk: SU_KIEN_MO_MENU },
];

/** Thanh tab dưới cùng cho điện thoại (ẩn từ 1024 px): vào thẳng việc hay dùng, ngón cái với tới được.
 * Nhân viên: Tổng quan · Chấm công · Đơn từ · Hồ sơ · Thêm. Quản lý: Tổng quan · Nhân sự · Tuyển dụng · Đơn từ · Thêm (mở bảng đủ mục kéo từ dưới lên). Thông báo và tài khoản nằm ở đầu trang. */
export function ThanhTabDuoi({ vaiTro }: { vaiTro: VaiTro }) {
  const pathname = usePathname();
  const dem = useDemMenu();
  const tabs = vaiTro === "nhan_vien" ? TAB_NHAN_VIEN : TAB_QUAN_LY;

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="relative z-40 shrink-0 border-t border-vien bg-giay-sang lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((t) => {
          const dangChon =
            !!t.href &&
            (pathname === t.href || pathname.startsWith(t.href + "/"));
          const so = t.href ? (dem[t.href] ?? 0) : 0;
          const noiDung = (
            <>
              {dangChon && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-0 h-[2px] w-8 -translate-x-1/2"
                  style={{ background: "var(--gradient-vang)" }}
                />
              )}
              <span className="relative">
                <t.Icon strokeWidth={1.6} className="h-[22px] w-[22px]" />
                {so > 0 && (
                  <span
                    className="nut-vang absolute -right-2.5 -top-1.5 min-w-[16px] rounded-[8px] px-1 text-center text-[10px] leading-4"
                    aria-label={`${so} mục mới`}
                  >
                    {so > 9 ? "9+" : so}
                  </span>
                )}
              </span>
              <span>{t.ten}</span>
            </>
          );
          const lop = `relative flex h-[62px] w-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${dangChon ? "text-nhan-dam" : "text-muc-3"}`;
          return (
            <li key={t.ten}>
              {t.href ? (
                <Link
                  href={t.href}
                  aria-current={dangChon ? "page" : undefined}
                  className={lop}
                >
                  {noiDung}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(t.sk!))}
                  className={lop}
                >
                  {noiDung}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
