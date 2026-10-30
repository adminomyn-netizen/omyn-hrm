"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  chiaNhomNhanSu,
  duongDanDangChon,
  gomTheoNhom,
  locMenuTheoVaiTro,
  type MucMenu,
} from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { useLuuTru } from "@/lib/luu-tru";
import { useDemMenu } from "@/lib/dem-menu";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";

export const KHOA_THU_GON = "omyn-hrm-sidebar-thu-gon";
const KHOA_MO_NHOM = "omyn-hrm-menu-nhom-mo";

/** Menu trái nền espresso (cả khi giao diện sáng): mục đang mở nền sáng nhẹ + biểu tượng vàng; số đếm dải vàng.
 * Thu gọn còn cột biểu tượng 72 px; rê chuột/focus hiện tên và mô tả. */
export function Sidebar({ vaiTro, duocMo }: { vaiTro: VaiTro | null; duocMo?: string[] }) {
  const pathname = usePathname();
  const [tg, ghiTg] = useLuuTru(KHOA_THU_GON, "0");
  const dem = useDemMenu();
  const thuGon = tg === "1";
  const menu = locMenuTheoVaiTro(vaiTro, true, duocMo);
  const nhom = gomTheoNhom(menu);
  const chonDuong = duongDanDangChon(pathname, menu);
  // Nhóm gọn lại cho đỡ rối: bấm tiêu đề nhóm nào cũng mở/đóng được (nhớ lại cho lần sau). Chưa chọn gì thì chỉ "Chung" và nhóm đang đứng trong đó mở.
  const [moRaw, ghiMo] = useLuuTru(KHOA_MO_NHOM, "{}");
  const mo = useMemo<Record<string, boolean>>(() => {
    try {
      return JSON.parse(moRaw);
    } catch {
      return {};
    }
  }, [moRaw]);
  const coMucDangChon = (g: (typeof nhom)[number]) =>
    g.muc.some((m) => m.duong_dan === chonDuong);
  const dangMo = (g: (typeof nhom)[number]) =>
    thuGon ||
    (g.nhom in mo ? mo[g.nhom] : g.nhom === "Chung" || coMucDangChon(g));

  return (
    <aside
      className={`thanh-ben-omyn sticky top-[84px] m-4 mr-0 hidden shrink-0 flex-col self-start rounded-[20px] text-menu-chu transition-[width] duration-150 ease-out lg:flex ${
        thuGon ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <div
        className={`flex shrink-0 items-center px-3 pt-3 ${thuGon ? "flex-col gap-2" : "justify-between"}`}
      >
        {/* Chỗ logo: đang dùng logo chữ OMYN tạm; khi có file logo chính thức chỉ cần thay các tệp trong public/brand (giữ nguyên tên, cùng tỉ lệ). */}
        <Link
          href="/dashboard"
          aria-label="Omyn — Tổng quan"
          className="flex h-10 items-center px-1.5"
        >
          {thuGon ? (
            <Image
              src="/brand/bieu-tuong-sang.svg"
              alt="Omyn"
              width={28}
              height={28}
              unoptimized
            />
          ) : (
            <Logo size="md" nenToi />
          )}
        </Link>
        <button
          type="button"
          onClick={() => ghiTg(thuGon ? "0" : "1")}
          title={thuGon ? "Mở rộng menu" : "Thu nhỏ menu"}
          aria-label={thuGon ? "Mở rộng menu" : "Thu nhỏ menu"}
          className="rounded-nho p-2 text-menu-chu-phu hover:bg-menu-hover hover:text-menu-sang"
        >
          {thuGon ? (
            <ChevronsRight strokeWidth={1.5} className="h-[18px] w-[18px]" />
          ) : (
            <ChevronsLeft strokeWidth={1.5} className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      <nav
        className="cuon-an-thanh max-h-[calc(100vh-190px)] space-y-5 overflow-y-auto px-3.5 pb-5 pt-2"
        aria-label="Menu chính"
      >
        {nhom.map((g) => (
          <div key={g.nhom}>
            {thuGon ? (
              <div className="mx-2 mb-2 h-px bg-menu-vien" aria-hidden />
            ) : (
              <button
                type="button"
                aria-expanded={dangMo(g)}
                onClick={() =>
                  ghiMo(JSON.stringify({ ...mo, [g.nhom]: !dangMo(g) }))
                }
                className="flex w-full items-center gap-2 rounded-nho px-2.5 pb-2 pt-1 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-menu-chu-phu hover:text-menu-chu"
              >
                <span className="flex-1">{g.nhom}</span>
                {!dangMo(g) &&
                  g.muc.some((m) => (dem[m.duong_dan] ?? 0) > 0) && (
                    <span
                      aria-label="Có mục mới"
                      className="h-2 w-2"
                      style={{
                        background: "var(--gradient-vang)",
                        borderRadius: 9999,
                      }}
                    />
                  )}
                <ChevronDown
                  strokeWidth={1.6}
                  className={`h-3.5 w-3.5 transition-transform ${dangMo(g) ? "" : "-rotate-90"}`}
                />
              </button>
            )}
            {g.nhom === "Nhân sự" && !thuGon ? (
              <NhanSuCon
                muc={g.muc}
                chonDuong={chonDuong}
                dem={dem}
                mo={mo}
                ghiMo={(k, v) => ghiMo(JSON.stringify({ ...mo, [k]: v }))}
                hien={dangMo(g)}
              />
            ) : (
              <ul className={`space-y-0.5 ${dangMo(g) ? "" : "hidden"}`}>
                {g.muc.map((muc) => (
                  <MucLink
                    key={muc.duong_dan}
                    muc={muc}
                    dangChon={muc.duong_dan === chonDuong}
                    so={dem[muc.duong_dan] ?? 0}
                    thuGon={thuGon}
                  />
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function MucLink({
  muc,
  dangChon,
  so,
  thuGon,
  nho,
}: {
  muc: MucMenu;
  dangChon: boolean;
  so: number;
  thuGon: boolean;
  nho?: boolean;
}) {
  const Icon = muc.icon;
  return (
    <li>
      <Link
        href={muc.duong_dan}
        title={thuGon ? muc.ten : muc.moTa}
        aria-label={
          thuGon && so
            ? `${muc.ten}, ${so} mục mới`
            : thuGon
              ? muc.ten
              : undefined
        }
        aria-current={dangChon ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-nho text-[14px] transition-colors ${nho ? "py-2" : "py-2.5"} ${thuGon ? "justify-center px-0" : "px-2.5"} ${dangChon ? "muc-menu-omyn-dang" : "font-medium text-menu-chu hover:bg-menu-hover hover:text-menu-sang"}`}
      >
        <Icon
          strokeWidth={1.6}
          className={`h-[19px] w-[19px] shrink-0 ${dangChon ? "" : "text-menu-chu-phu group-hover:text-menu-chu"}`}
        />
        {!thuGon && <span className="flex-1 truncate">{muc.ten}</span>}
        {so > 0 && !thuGon && (
          <span className="nut-vang min-w-[20px] rounded-[10px] px-1.5 py-px text-center text-[11px] leading-[18px]">
            {so > 99 ? "99+" : so}
          </span>
        )}
        {so > 0 && thuGon && (
          <span
            aria-hidden
            className="absolute right-3 top-2 h-2 w-2"
            style={{ background: "var(--gradient-vang)", borderRadius: 9999 }}
          />
        )}
      </Link>
    </li>
  );
}

/** Mục Nhân sự chia ĐÚNG 10 nhóm theo mẫu của chị Lâm: Trang chủ ở đầu, mỗi nhóm gấp/mở được, mục chưa có màn hiện nhãn "Sắp có". Mỗi màn chỉ xuất hiện ở một nhóm. */
function NhanSuCon({
  muc,
  chonDuong,
  dem,
  mo,
  ghiMo,
  hien,
}: {
  muc: MucMenu[];
  chonDuong: string | null;
  dem: Record<string, number>;
  mo: Record<string, boolean>;
  ghiMo: (k: string, v: boolean) => void;
  hien: boolean;
}) {
  const { trangChu, nhom } = chiaNhomNhanSu(muc);
  return (
    <div className={hien ? "" : "hidden"}>
      <ul className="space-y-0.5">
        {trangChu && (
          <MucLink
            muc={trangChu}
            dangChon={trangChu.duong_dan === chonDuong}
            so={0}
            thuGon={false}
          />
        )}
      </ul>
      {nhom.map((g) => {
        const co = g.muc.some((m) => m.duong_dan === chonDuong);
        const khoa = `ns${g.so}`;
        const mocua = khoa in mo ? mo[khoa] : co;
        const trong = g.muc.length === 0;
        return (
          <div key={g.so} className="mt-1">
            <button
              type="button"
              aria-expanded={mocua}
              onClick={() => ghiMo(khoa, !mocua)}
              data-m={g.so}
              className="mau-nhom flex w-full items-center gap-2 rounded-nho px-2.5 py-1.5 text-left text-[12.5px] font-medium text-menu-chu-phu hover:bg-menu-hover hover:text-menu-chu"
            >
              <span className="mau-chip flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-tag text-[11px] font-semibold tabular-nums">
                {g.so}
              </span>
              <span className="flex-1 truncate">{g.ten}</span>
              {trong && (
                <span className="rounded-tag border border-menu-vien px-1.5 text-[10.5px] leading-[16px] text-menu-chu-phu">
                  Sắp có
                </span>
              )}
              <ChevronDown
                strokeWidth={1.6}
                className={`h-3.5 w-3.5 transition-transform ${mocua ? "" : "-rotate-90"}`}
              />
            </button>
            {mocua && (
              <ul className="space-y-0.5 pl-3">
                {g.muc.map((m) => (
                  <MucLink
                    key={m.duong_dan}
                    muc={m}
                    dangChon={m.duong_dan === chonDuong}
                    so={dem[m.duong_dan] ?? 0}
                    thuGon={false}
                    nho
                  />
                ))}
                {g.sapCo.map((ten) => (
                  <li
                    key={ten}
                    className="flex items-center gap-3 px-2.5 py-2 text-[13.5px] text-menu-chu-phu/80"
                  >
                    <span className="h-[19px] w-[19px] shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{ten}</span>
                    <span className="rounded-tag border border-menu-vien px-1.5 text-[10.5px] leading-[16px]">
                      Sắp có
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
