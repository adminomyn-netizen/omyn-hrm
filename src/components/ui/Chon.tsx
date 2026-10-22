"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type LuaChon = { gia_tri: string; nhan: string };

const BONG = "shadow-[0_14px_32px_rgba(42,34,24,0.18)]";

/** Ô chọn (dropdown) theo bộ nhận diện, thay cho <select> mặc định của trình duyệt.
 * - Dùng trong biểu mẫu: có <input hidden name=…> nên FormData lấy được giá trị; `batBuoc` vẫn báo lỗi bằng hộp thoại của trình duyệt.
 * - Điều khiển bằng bàn phím: mũi tên, Enter/Space, Esc, gõ chữ cái đầu để nhảy tới mục.
 * - Tự mở lên trên nếu bên dưới không đủ chỗ. */
export function Chon({
  ten,
  luaChon,
  giaTri,
  giaTriMacDinh = "",
  onDoi,
  trong = "Chọn",
  batBuoc,
  voHieu,
  nho,
  id,
  ariaLabel,
  className = "",
}: {
  ten?: string;
  luaChon: LuaChon[];
  giaTri?: string;
  giaTriMacDinh?: string;
  onDoi?: (giaTri: string) => void;
  trong?: string;
  batBuoc?: boolean;
  voHieu?: boolean;
  nho?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [noiBo, setNoiBo] = useState(giaTriMacDinh);
  const gia = giaTri ?? noiBo;
  const [mo, setMo] = useState(false);
  const [len, setLen] = useState(false);
  const [dangTro, setDangTro] = useState(0);
  const goc = useRef<HTMLDivElement>(null);
  const kiemTra = useRef<HTMLInputElement>(null);
  const idDs = useId();
  const chon = luaChon.find((l) => l.gia_tri === gia);

  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => goc.current && !goc.current.contains(e.target as Node) && setMo(false);
    document.addEventListener("mousedown", ngoai);
    return () => document.removeEventListener("mousedown", ngoai);
  }, [mo]);

  const moDs = () => {
    if (voHieu) return;
    const r = goc.current?.getBoundingClientRect();
    if (r) setLen(window.innerHeight - r.bottom < 280 && r.top > window.innerHeight - r.bottom);
    setDangTro(Math.max(0, luaChon.findIndex((l) => l.gia_tri === gia)));
    setMo(true);
  };

  const dat = (v: string) => {
    if (giaTri === undefined) setNoiBo(v);
    kiemTra.current?.setCustomValidity("");
    onDoi?.(v);
    setMo(false);
  };

  const phim = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && mo) {
      e.stopPropagation();
      setMo(false);
      return;
    }
    if (!mo) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        moDs();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDangTro((i) => Math.min(luaChon.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDangTro((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (luaChon[dangTro]) dat(luaChon[dangTro].gia_tri);
    } else if (e.key.length === 1) {
      const tim = luaChon.findIndex((l, i) => i > dangTro && l.nhan.toLowerCase().startsWith(e.key.toLowerCase()));
      const dau = tim >= 0 ? tim : luaChon.findIndex((l) => l.nhan.toLowerCase().startsWith(e.key.toLowerCase()));
      if (dau >= 0) setDangTro(dau);
    }
  };

  return (
    <div ref={goc} className={`relative ${className}`} onKeyDown={phim}>
      <button
        type="button"
        id={id}
        disabled={voHieu}
        aria-haspopup="listbox"
        aria-expanded={mo}
        aria-controls={mo ? idDs : undefined}
        aria-label={ariaLabel}
        onClick={() => (mo ? setMo(false) : moDs())}
        className={`flex w-full items-center justify-between gap-2 rounded-nho border bg-giay-sang text-left text-muc outline-none transition-colors disabled:opacity-60 ${
          nho ? "h-9 px-2.5 text-[13px]" : "h-11 px-3 text-[15px]"
        } ${mo ? "border-nhan ring-2 ring-nhan/25" : "border-vien-dam hover:border-nhan"} focus-visible:border-nhan focus-visible:ring-2 focus-visible:ring-nhan/25`}
      >
        <span className={`truncate ${chon ? "" : "text-muc-3"}`}>{chon ? chon.nhan : trong}</span>
        <ChevronDown strokeWidth={1.8} className={`h-4 w-4 shrink-0 text-nhan transition-transform ${mo ? "rotate-180" : ""}`} />
      </button>
      {ten && (
        <input
          ref={kiemTra}
          name={ten}
          value={gia}
          required={batBuoc}
          onChange={() => {}}
          onInvalid={(e) => e.currentTarget.setCustomValidity("Bạn chọn một mục trong danh sách.")}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0 w-full opacity-0"
        />
      )}
      {mo && (
        <ul
          id={idDs}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 right-0 z-40 max-h-64 min-w-[10rem] overflow-y-auto rounded-vua border border-vien bg-giay-sang p-1.5 ${BONG} ${len ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}
        >
          {luaChon.map((l, i) => {
            const dangChon = l.gia_tri === gia;
            return (
              <li
                key={l.gia_tri || `trong-${i}`}
                role="option"
                aria-selected={dangChon}
                onMouseEnter={() => setDangTro(i)}
                onClick={() => dat(l.gia_tri)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-nho px-3 py-2.5 text-[14px] ${
                  i === dangTro ? "bg-giay-tram" : ""
                } ${dangChon ? "font-semibold text-muc" : "text-muc-2"}`}
              >
                <span className="truncate">{l.nhan}</span>
                {dangChon && <Check strokeWidth={2} className="h-4 w-4 shrink-0 text-nhan" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
