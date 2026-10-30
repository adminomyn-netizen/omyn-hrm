"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  chiaNhomNhanSu,
  duongDanDangChon,
  gomTheoNhom,
  locMenuTheoVaiTro,
  type MucMenu,
} from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import { useDemMenu } from "@/lib/dem-menu";

export const SU_KIEN_MO_MENU = "omyn-mo-menu";

/** Bảng "Thêm chức năng" cho điện thoại và máy tính bảng dọc: kéo từ dưới lên, các mục xếp lưới biểu tượng theo nhóm (không còn ngăn kéo dọc bên trái).
 *  Nút mở là tab "Thêm" ở thanh tab dưới, bắn sự kiện SU_KIEN_MO_MENU. Đổi trang thì tự đóng. */
export function MobileNav({ vaiTro }: { vaiTro: VaiTro | null }) {
  const pathname = usePathname();
  const menu = locMenuTheoVaiTro(vaiTro);
  const nhom = gomTheoNhom(menu);
  const chonDuong = duongDanDangChon(pathname, menu);
  const dem = useDemMenu();
  const [moTai, setMoTai] = useState<string | null>(null);
  const mo = moTai === pathname;
  const setMo = (b: boolean) => setMoTai(b ? pathname : null);

  useEffect(() => {
    const moMenu = () => setMoTai(pathname);
    window.addEventListener(SU_KIEN_MO_MENU, moMenu);
    return () => window.removeEventListener(SU_KIEN_MO_MENU, moMenu);
  }, [pathname]);

  useEffect(() => {
    if (!mo) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMoTai(null);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [mo]);

  if (!mo) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Thêm chức năng"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-muc/45"
        onClick={() => setMo(false)}
      />
      <div
        className="vao absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto bg-giay-sang px-4 pb-6 pt-3"
        style={{
          borderRadius: "18px 18px 0 0",
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          boxShadow: "0 -18px 40px -12px rgba(6,26,23,0.5)",
        }}
      >
        <div
          className="mx-auto mb-3 h-1 w-10 bg-vien-dam/50"
          style={{ borderRadius: 3 }}
          aria-hidden
        />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-muc">Thêm chức năng</h2>
          <button
            type="button"
            onClick={() => setMo(false)}
            aria-label="Đóng"
            className="-mr-2 p-2 text-muc-3 hover:text-muc"
          >
            <X strokeWidth={1.6} className="h-5 w-5" />
          </button>
        </div>
        {nhom.map((g) => {
          if (g.nhom === "Nhân sự") {
            const { trangChu, nhom: cacNhom } = chiaNhomNhanSu(g.muc);
            return (
              <section key={g.nhom} className="mb-4">
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muc-3">
                  {g.nhom}
                </h3>
                {trangChu && (
                  <ul className="mb-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                    <O muc={trangChu} chonDuong={chonDuong} dem={dem} />
                  </ul>
                )}
                {cacNhom.map((c) => (
                  <div key={c.so} className="mb-3">
                    <h4 className="mb-1.5 text-[12px] font-medium text-muc-2">
                      <span className="mr-1.5 tabular-nums text-muc-3">
                        {c.so}
                      </span>
                      {c.ten}
                    </h4>
                    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                      {c.muc.map((muc) => (
                        <O
                          key={muc.duong_dan}
                          muc={muc}
                          chonDuong={chonDuong}
                          dem={dem}
                        />
                      ))}
                      {c.sapCo.map((ten) => (
                        <li
                          key={ten}
                          className="flex min-h-[84px] flex-col items-center justify-center gap-1.5 border border-dashed border-vien px-1.5 py-2 text-center text-[12.5px] leading-tight text-muc-3"
                          style={{ borderRadius: 12 }}
                        >
                          {ten}
                          <span className="rounded-tag bg-giay-tram px-1.5 text-[10.5px] leading-[16px]">
                            Sắp có
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            );
          }
          return (
            <section key={g.nhom} className="mb-4">
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muc-3">
                {g.nhom}
              </h3>
              <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                {g.muc.map((muc) => (
                  <O
                    key={muc.duong_dan}
                    muc={muc}
                    chonDuong={chonDuong}
                    dem={dem}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function O({
  muc,
  chonDuong,
  dem,
}: {
  muc: MucMenu;
  chonDuong: string | null;
  dem: Record<string, number>;
}) {
  const dangChon = muc.duong_dan === chonDuong;
  const Icon = muc.icon;
  const so = dem[muc.duong_dan] ?? 0;
  return (
    <li>
      <Link
        href={muc.duong_dan}
        aria-current={dangChon ? "page" : undefined}
        className={`relative flex h-full min-h-[84px] flex-col items-center justify-center gap-2 border px-1.5 py-2 text-center text-[12.5px] font-medium leading-tight ${dangChon ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien bg-giay text-muc-2"}`}
        style={{ borderRadius: 12 }}
      >
        <Icon strokeWidth={1.6} className="h-6 w-6" />
        {muc.ten}
        {so > 0 && (
          <span
            className="nut-vang absolute right-1.5 top-1.5 min-w-[18px] px-1 text-center text-[10.5px] leading-[18px]"
            style={{ borderRadius: 9 }}
          >
            {so > 9 ? "9+" : so}
          </span>
        )}
      </Link>
    </li>
  );
}
