"use client";

import { useEffect, useState } from "react";

const GIO = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const NGAY = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "numeric", month: "long", year: "numeric" });
const GIO_SO = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", hour12: false });

/** Lời chào theo giờ Hồ Chí Minh: 05–11 sáng · 11–13 trưa · 13–18 chiều · 18–05 tối. */
export function loiChaoTheoGio(gio: number) {
  if (gio >= 5 && gio < 11) return "Chào buổi sáng";
  if (gio >= 11 && gio < 13) return "Chào buổi trưa";
  if (gio >= 13 && gio < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Đầu trang Tổng quan: ngày, lời chào và ĐỒNG HỒ chạy realtime theo giờ HCM (cập nhật mỗi giây; lời chào tự đổi khi sang buổi mới).
 * Lúc dựng trên máy chủ dùng `batDau` (mốc giờ của máy chủ) để không lệch khi hydrate. */
export function LoiChaoDongHo({ ten, batDau, phu, children }: { ten: string; batDau: number; phu: React.ReactNode; children?: React.ReactNode }) {
  const [now, setNow] = useState(() => new Date(batDau));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const tuc = setTimeout(() => setNow(new Date()), 0);
    return () => {
      clearInterval(timer);
      clearTimeout(tuc);
    };
  }, []);

  const gio = Number(GIO_SO.format(now));
  return (
    <section className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div className="min-w-0">
        <div className="nhan-muc capitalize">{NGAY.format(now)}</div>
        <h1 className="chu-tieu-de mt-1.5 text-[40px] leading-[1.1] text-muc lg:text-[52px]">
          {loiChaoTheoGio(gio)}, {ten}.
        </h1>
        <p className="mt-2 text-[15px] text-muc-2">{phu}</p>
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <div className="sm:text-right" aria-live="off">
          <div className="nhan-muc">Giờ Hồ Chí Minh</div>
          <time dateTime={now.toISOString()} className="mt-0.5 block text-[44px] font-medium leading-none tabular-nums text-muc lg:text-[52px]" suppressHydrationWarning>
            {GIO.format(now)}
          </time>
        </div>
        <div className="flex gap-2.5">{children}</div>
      </div>
    </section>
  );
}
