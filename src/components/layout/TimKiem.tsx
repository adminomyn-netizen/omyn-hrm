"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CornerDownLeft,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { locMenuTheoVaiTro } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";
import type { KetQuaTim } from "@/app/api/tim-kiem/route";

type Muc = {
  khoa: string;
  tieuDe: string;
  phu: string;
  href: string;
  Icon: typeof Users;
  nhom: string;
};

/** Hộp tìm nhanh (⌘K / Ctrl+K): nhảy tới trang, nhân viên, ứng viên, tin tuyển dụng. Quản lý tìm cả dữ liệu; nhân viên chỉ nhảy trang. */
export function TimKiem({ vaiTro, duocMo }: { vaiTro: VaiTro; duocMo?: string[] }) {
  const router = useRouter();
  const laQuanLy = vaiTro === "admin" || vaiTro === "ky_thuat";
  const [mo, setMo] = useState(false);
  const [q, setQ] = useState("");
  const [tu, setTu] = useState<KetQuaTim[]>([]);
  const [dangTro, setDangTro] = useState(0);
  const oRef = useRef<HTMLInputElement>(null);
  const truoc = useRef<Element | null>(null);

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        truoc.current = document.activeElement;
        setMo((m) => !m);
      }
    };
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  }, []);

  useEffect(() => {
    if (!mo) return;
    oRef.current?.focus();
    const khoa = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = khoa;
      (truoc.current as HTMLElement | null)?.focus?.();
    };
  }, [mo]);

  // gọi máy chủ sau khi ngừng gõ 180 ms
  useEffect(() => {
    if (!mo || !laQuanLy || q.trim().length < 2) return;
    let huy = false;
    const h = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/tim-kiem?q=${encodeURIComponent(q.trim())}`,
          { cache: "no-store" },
        );
        if (!r.ok) return;
        const j = (await r.json()) as { ketQua: KetQua };
        if (!huy) setTu(j.ketQua);
      } catch {
        // mất mạng thoáng qua: giữ kết quả cũ
      }
    }, 180);
    return () => {
      huy = true;
      clearTimeout(h);
    };
  }, [q, mo, laQuanLy]);

  type KetQua = KetQuaTim[];
  const muc = useMemo<Muc[]>(() => {
    const k = q.trim().toLowerCase();
    const trang: Muc[] = locMenuTheoVaiTro(vaiTro, false, duocMo)
      .filter((m) => !k || m.ten.toLowerCase().includes(k))
      .slice(0, k ? 5 : 6)
      .map((m) => ({
        khoa: `t-${m.duong_dan}`,
        tieuDe: m.ten,
        phu: m.moTa,
        href: m.duong_dan,
        Icon: m.icon,
        nhom: "Trang",
      }));
    const du: Muc[] =
      k.length >= 2
        ? tu.map((x) => ({
            khoa: `${x.loai}-${x.id}`,
            tieuDe: x.tieuDe,
            phu: x.phu,
            href: x.href,
            Icon:
              x.loai === "nhan_vien"
                ? Users
                : x.loai === "ung_vien"
                  ? UserPlus
                  : Briefcase,
            nhom:
              x.loai === "nhan_vien"
                ? "Nhân viên"
                : x.loai === "ung_vien"
                  ? "Ứng viên"
                  : "Tin tuyển dụng",
          }))
        : [];
    return [...du, ...trang];
  }, [q, tu, vaiTro]);

  const dong = () => {
    setMo(false);
    setQ("");
    setTu([]);
    setDangTro(0);
  };
  const di = (m: Muc) => {
    dong();
    router.push(m.href);
  };

  const phim = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      dong();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setDangTro((i) => Math.min(muc.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDangTro((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && muc[dangTro]) {
      e.preventDefault();
      di(muc[dangTro]);
    }
  };

  let nhomTruoc = "";
  return (
    <>
      <button
        type="button"
        onClick={() => {
          truoc.current = document.activeElement;
          setMo(true);
        }}
        aria-label="Tìm kiếm"
        className="flex h-9 items-center gap-2.5 rounded-nho border border-vien bg-giay-sang px-3 text-[13px] text-muc-3 hover:border-nhan sm:w-[22rem] sm:max-w-full"
      >
        <Search strokeWidth={1.6} className="h-4 w-4 shrink-0" />
        <span className="hidden flex-1 truncate text-left sm:block">
          {laQuanLy ? "Tìm nhân viên, ứng viên, tin tuyển dụng" : "Tìm trang"}
        </span>
        <kbd className="hidden rounded-[4px] border border-vien px-1.5 py-px text-[11px] sm:block">
          ⌘K
        </kbd>
      </button>

      {mo && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          onKeyDown={phim}
        >
          <button
            aria-label="Đóng tìm kiếm"
            tabIndex={-1}
            className="fixed inset-0 bg-muc/45"
            onClick={dong}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tìm kiếm"
            className="relative w-full max-w-xl overflow-hidden rounded-hop border border-vien bg-giay-sang shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center gap-3 border-b border-vien px-4">
              <Search
                strokeWidth={1.6}
                className="h-[18px] w-[18px] shrink-0 text-nhan"
              />
              <input
                ref={oRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setDangTro(0);
                }}
                role="combobox"
                aria-expanded="true"
                aria-controls="tk-ds"
                aria-activedescendant={
                  muc[dangTro] ? `tk-${muc[dangTro].khoa}` : undefined
                }
                placeholder={
                  laQuanLy
                    ? "Gõ tên nhân viên, ứng viên, vị trí hoặc tên trang"
                    : "Gõ tên trang"
                }
                className="h-14 flex-1 bg-transparent text-[16px] text-muc outline-none placeholder:text-muc-3"
              />
              <kbd className="rounded-[4px] border border-vien px-1.5 py-px text-[11px] text-muc-3">
                Esc
              </kbd>
            </div>
            <ul
              id="tk-ds"
              role="listbox"
              className="max-h-[50vh] overflow-y-auto p-2"
            >
              {muc.map((m, i) => {
                const dauNhom = m.nhom !== nhomTruoc;
                nhomTruoc = m.nhom;
                return (
                  <li key={m.khoa} role="presentation">
                    {dauNhom && (
                      <div className="px-3 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muc-3">
                        {m.nhom}
                      </div>
                    )}
                    <div
                      id={`tk-${m.khoa}`}
                      role="option"
                      aria-selected={i === dangTro}
                      onMouseEnter={() => setDangTro(i)}
                      onClick={() => di(m)}
                      className={`flex cursor-pointer items-center gap-3 rounded-nho px-3 py-2.5 ${i === dangTro ? "bg-giay-tram" : ""}`}
                    >
                      <m.Icon
                        strokeWidth={1.6}
                        className="h-[18px] w-[18px] shrink-0 text-nhan"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-muc">
                          {m.tieuDe}
                        </span>
                        <span className="block truncate text-[12px] text-muc-3">
                          {m.phu}
                        </span>
                      </span>
                      {i === dangTro && (
                        <CornerDownLeft
                          strokeWidth={1.6}
                          className="h-4 w-4 shrink-0 text-muc-3"
                        />
                      )}
                    </div>
                  </li>
                );
              })}
              {muc.length === 0 && (
                <li className="px-3 py-10 text-center text-[14px] text-muc-3">
                  Không tìm thấy &ldquo;{q}&rdquo;.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
