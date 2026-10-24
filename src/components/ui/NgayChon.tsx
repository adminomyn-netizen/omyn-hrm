"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNoi } from "./noi";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const BONG = "shadow-[0_18px_40px_rgba(5,40,36,0.22)]";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const tach = (s: string) => {
  const kq = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return kq ? { y: +kq[1], m: +kq[2] - 1, d: +kq[3] } : null;
};
const homNayHCM = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
const soNgay = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
/** Thứ của ngày 1 trong tháng, tính từ thứ Hai = 0 */
const thuDau = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7;

/** Ô chọn ngày theo bộ nhận diện, thay cho <input type="date"> mặc định.
 * Chọn nhanh tháng và năm (bấm vào "Tháng 11" hoặc "2026"), có nút Hôm nay / Xoá ngày.
 * Giá trị luôn là chuỗi YYYY-MM-DD trong <input hidden name=…> để biểu mẫu lấy bằng FormData. */
export function NgayChon({
  ten,
  giaTri,
  giaTriMacDinh = "",
  onDoi,
  batBuoc,
  voHieu,
  tuNam = 1940,
  denNam = 2100,
  id,
  ariaLabel,
  className = "",
}: {
  ten?: string;
  giaTri?: string;
  giaTriMacDinh?: string;
  onDoi?: (giaTri: string) => void;
  batBuoc?: boolean;
  voHieu?: boolean;
  tuNam?: number;
  denNam?: number;
  id?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [noiBo, setNoiBo] = useState(giaTriMacDinh);
  const gia = giaTri ?? noiBo;
  const dangChon = tach(gia);
  const [mo, setMo] = useState(false);
  const [man, setMan] = useState<"ngay" | "thang" | "nam">("ngay");
  const [xem, setXem] = useState(() => dangChon ?? tach(homNayHCM())!);
  const [cuaSoNam, setCuaSoNam] = useState(0);
  const goc = useRef<HTMLDivElement>(null);
  const kiemTra = useRef<HTMLInputElement>(null);
  const nutRef = useRef<HTMLButtonElement>(null);
  const lichRef = useRef<HTMLDivElement>(null);
  const hom = homNayHCM();

  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => {
      const dich = e.target as Node;
      if (goc.current && !goc.current.contains(dich) && !lichRef.current?.contains(dich)) setMo(false);
    };
    document.addEventListener("mousedown", ngoai);
    return () => document.removeEventListener("mousedown", ngoai);
  }, [mo]);

  const moLich = () => {
    if (voHieu) return;
    setXem(tach(gia) ?? tach(homNayHCM())!);
    setMan("ngay");
    setMo(true);
  };

  const dat = (v: string) => {
    if (giaTri === undefined) setNoiBo(v);
    kiemTra.current?.setCustomValidity("");
    onDoi?.(v);
    setMo(false);
  };

  const dichThang = (n: number) => {
    const t = xem.m + n;
    const y = xem.y + Math.floor(t / 12);
    if (y < tuNam || y > denNam) return;
    setXem({ y, m: ((t % 12) + 12) % 12, d: 1 });
  };

  useNoi(mo, nutRef, lichRef, { rong: 312, caoUoc: 400 });

  const phim = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && mo) {
      e.stopPropagation();
      setMo(false);
    }
  };

  // lưới 6 tuần (42 ô)
  const dau = thuDau(xem.y, xem.m);
  const ngayTruoc = soNgay(xem.m === 0 ? xem.y - 1 : xem.y, (xem.m + 11) % 12);
  const o = Array.from({ length: 42 }, (_, i) => {
    const n = i - dau + 1;
    if (n < 1) {
      const m = (xem.m + 11) % 12;
      const y = xem.m === 0 ? xem.y - 1 : xem.y;
      return { y, m, d: ngayTruoc + n, ngoai: true };
    }
    if (n > soNgay(xem.y, xem.m)) {
      const m = (xem.m + 1) % 12;
      const y = xem.m === 11 ? xem.y + 1 : xem.y;
      return { y, m, d: n - soNgay(xem.y, xem.m), ngoai: true };
    }
    return { y: xem.y, m: xem.m, d: n, ngoai: false };
  });

  const batDauCuaSo = Math.max(tuNam, Math.min(denNam - 11, cuaSoNam || xem.y - 5));
  const hienThi = dangChon ? `${pad(dangChon.d)}/${pad(dangChon.m + 1)}/${dangChon.y}` : "";

  return (
    <div ref={goc} className={`relative ${className}`} onKeyDown={phim}>
      <button
        ref={nutRef}
        type="button"
        id={id}
        disabled={voHieu}
        aria-haspopup="dialog"
        aria-expanded={mo}
        aria-label={ariaLabel}
        onClick={() => (mo ? setMo(false) : moLich())}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-nho border bg-giay-sang px-3 text-left text-[15px] text-muc outline-none transition-colors disabled:opacity-60 ${
          mo ? "border-nhan ring-2 ring-nhan/25" : "border-vien-dam hover:border-nhan"
        } focus-visible:border-nhan focus-visible:ring-2 focus-visible:ring-nhan/25`}
      >
        <span className={hienThi ? "tabular-nums" : "text-muc-3"}>{hienThi || "dd/mm/yyyy"}</span>
        <CalendarDays strokeWidth={1.6} className="h-[18px] w-[18px] shrink-0 text-nhan" />
      </button>
      {ten && (
        <input
          ref={kiemTra}
          name={ten}
          value={gia}
          required={batBuoc}
          onChange={() => {}}
          onInvalid={(e) => e.currentTarget.setCustomValidity("Bạn chọn một ngày.")}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0 w-full opacity-0"
        />
      )}

      {mo &&
        createPortal(
        <div
          ref={lichRef}
          role="dialog"
          aria-label="Chọn ngày"
          style={{ position: "fixed", visibility: "hidden" }}
          className={`z-[70] overflow-y-auto rounded-[12px] border border-vien bg-giay-sang p-3.5 ${BONG}`}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={man === "nam" ? "Các năm trước" : "Tháng trước"}
              onClick={() => (man === "nam" ? setCuaSoNam(Math.max(tuNam, batDauCuaSo - 12)) : dichThang(-1))}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-nho border border-vien text-muc-2 hover:bg-giay-tram"
            >
              <ChevronLeft strokeWidth={1.8} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMan(man === "thang" ? "ngay" : "thang")}
              aria-expanded={man === "thang"}
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-nho border border-vien bg-giay text-[14px] font-semibold text-muc hover:border-nhan"
            >
              Tháng {xem.m + 1}
              <ChevronDown strokeWidth={2.2} className="h-3 w-3 text-nhan" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCuaSoNam(Math.max(tuNam, Math.min(denNam - 11, xem.y - 5)));
                setMan(man === "nam" ? "ngay" : "nam");
              }}
              aria-expanded={man === "nam"}
              className="flex h-8 w-[5.25rem] shrink-0 items-center justify-center gap-1.5 rounded-nho border border-vien bg-giay text-[14px] font-semibold tabular-nums text-muc hover:border-nhan"
            >
              {xem.y}
              <ChevronDown strokeWidth={2.2} className="h-3 w-3 text-nhan" />
            </button>
            <button
              type="button"
              aria-label={man === "nam" ? "Các năm sau" : "Tháng sau"}
              onClick={() => (man === "nam" ? setCuaSoNam(Math.min(denNam - 11, batDauCuaSo + 12)) : dichThang(1))}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-nho border border-vien text-muc-2 hover:bg-giay-tram"
            >
              <ChevronRight strokeWidth={1.8} className="h-4 w-4" />
            </button>
          </div>

          {man === "ngay" && (
            <>
              <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-[0.06em] text-muc-3">
                {THU.map((t) => (
                  <span key={t} className="py-1">{t}</span>
                ))}
              </div>
              <div className="mt-0.5 grid grid-cols-7 gap-0.5">
                {o.map((x) => {
                  const v = iso(x.y, x.m, x.d);
                  const chonRoi = v === gia;
                  const laHomNay = v === hom;
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-label={`${x.d} tháng ${x.m + 1} năm ${x.y}`}
                      aria-pressed={chonRoi}
                      onClick={() => dat(v)}
                      className={`flex h-9 items-center justify-center rounded-nho border text-[13px] tabular-nums transition-colors ${
                        chonRoi
                          ? "border-transparent font-semibold text-[var(--chu-tren-vang)]"
                          : `${laHomNay ? "border-nhan" : "border-transparent"} ${x.ngoai ? "text-muc-3" : "text-muc"} hover:bg-giay-tram`
                      }`}
                      style={chonRoi ? { background: "var(--gradient-vang)" } : undefined}
                    >
                      {x.d}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {man === "thang" && (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }, (_, m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setXem({ ...xem, m, d: 1 });
                    setMan("ngay");
                  }}
                  className={`h-10 rounded-nho text-[14px] ${m === xem.m ? "font-semibold text-[var(--chu-tren-vang)]" : "text-muc hover:bg-giay-tram"}`}
                  style={m === xem.m ? { background: "var(--gradient-vang)" } : undefined}
                >
                  Tháng {m + 1}
                </button>
              ))}
            </div>
          )}

          {man === "nam" && (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => batDauCuaSo + i).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setXem({ ...xem, y, d: 1 });
                    setMan("ngay");
                  }}
                  className={`h-10 rounded-nho text-[14px] tabular-nums ${y === xem.y ? "font-semibold text-[var(--chu-tren-vang)]" : "text-muc hover:bg-giay-tram"}`}
                  style={y === xem.y ? { background: "var(--gradient-vang)" } : undefined}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-vien pt-2.5 text-[13px]">
            <button type="button" onClick={() => dat(hom)} className="font-medium text-nhan-dam underline-offset-4 hover:underline">
              Hôm nay
            </button>
            {!batBuoc && (
              <button type="button" onClick={() => dat("")} className="font-medium text-muc-3 underline-offset-4 hover:text-muc hover:underline">
                Xoá ngày
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
