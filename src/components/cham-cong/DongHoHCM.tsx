"use client";

import { useEffect, useState } from "react";

const GIO = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const NGAY = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Đồng hồ giờ Hồ Chí Minh chạy ở trình duyệt (server Vercel chạy UTC). Lúc đầu để trống để khỏi lệch khi hydrate. */
export function DongHoHCM({ canGiua }: { canGiua?: boolean }) {
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
    <div className={canGiua ? "text-center" : ""}>
      <div className="nhan-muc">Giờ Hồ Chí Minh</div>
      <div className="mt-1 text-[56px] font-medium leading-none tabular-nums text-muc">{now ? GIO.format(now) : "--:--:--"}</div>
      <div className="chu-tieu-de mt-2 text-[28px] italic capitalize text-muc-2">{now ? NGAY.format(now) : " "}</div>
    </div>
  );
}
