"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const DINH_DANG_GIO = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const DINH_DANG_NGAY = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Đồng hồ realtime theo giờ Hồ Chí Minh — chỉ chạy ở client, tránh lệch giờ
 * server (Vercel chạy UTC) và tránh hydration mismatch (render null lúc đầu). */
export function DongHoHCM() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const batDau = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(batDau);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-omyn-primary to-omyn-primary-dark px-5 py-4 text-white shadow-sm">
      <Clock className="h-6 w-6 shrink-0 opacity-90" />
      <div>
        <div className="font-mono text-2xl font-semibold tabular-nums leading-tight">
          {now ? DINH_DANG_GIO.format(now) : "--:--:--"}
        </div>
        <div className="text-xs capitalize text-white/80">
          {now ? `${DINH_DANG_NGAY.format(now)} · Giờ Hồ Chí Minh (UTC+7)` : "Đang đồng bộ giờ..."}
        </div>
      </div>
    </div>
  );
}
