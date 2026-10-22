"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Hộp thoại (popup) dùng chung: đóng bằng Esc, bấm nền hoặc nút X; giữ tiêu điểm trong hộp và
 * trả tiêu điểm về chỗ cũ khi đóng. Không bóng nặng, không mờ kính (Phụ lục E.4). */
export function Hop({
  mo,
  dong,
  tieuDe,
  moTa,
  rong = "vua",
  children,
}: {
  mo: boolean;
  dong: () => void;
  tieuDe: string;
  moTa?: string;
  rong?: "vua" | "rong";
  children: React.ReactNode;
}) {
  const hopRef = useRef<HTMLDivElement>(null);
  const truocDo = useRef<Element | null>(null);

  useEffect(() => {
    if (!mo) return;
    truocDo.current = document.activeElement;
    const o = hopRef.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-dong])");
    o?.focus();
    const khoaCuon = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const bam = (e: KeyboardEvent) => {
      if (e.key === "Escape") dong();
      if (e.key !== "Tab" || !hopRef.current) return;
      const ds = hopRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      if (!ds.length) return;
      const dau = ds[0];
      const cuoi = ds[ds.length - 1];
      if (e.shiftKey && document.activeElement === dau) {
        e.preventDefault();
        cuoi.focus();
      } else if (!e.shiftKey && document.activeElement === cuoi) {
        e.preventDefault();
        dau.focus();
      }
    };
    document.addEventListener("keydown", bam);
    return () => {
      document.removeEventListener("keydown", bam);
      document.body.style.overflow = khoaCuon;
      (truocDo.current as HTMLElement | null)?.focus?.();
    };
  }, [mo, dong]);

  if (!mo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 sm:py-14">
      <button aria-label="Đóng" tabIndex={-1} data-dong className="fixed inset-0 bg-muc/35" onClick={dong} />
      <div
        ref={hopRef}
        role="dialog"
        aria-modal="true"
        aria-label={tieuDe}
        className={`relative w-full rounded-hop border border-vien bg-giay-sang shadow-[0_24px_60px_rgba(0,0,0,0.30)] ${
          rong === "rong" ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4 rounded-t-hop border-b border-vien px-7 pb-4 pt-5" style={{ background: "linear-gradient(90deg, var(--nhan-nhat), transparent 72%)" }}>
          <div>
            <h2 className="chu-tieu-de text-[30px] text-muc">{tieuDe}</h2>
            {moTa && <p className="mt-1 text-[14px] text-muc-2">{moTa}</p>}
          </div>
          <button
            type="button"
            data-dong
            onClick={dong}
            aria-label="Đóng"
            className="-mr-2 mt-0.5 p-2 text-muc-3 hover:text-muc"
          >
            <X strokeWidth={1.5} className="h-5 w-5" />
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}
