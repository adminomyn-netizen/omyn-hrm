"use client";

import dynamic from "next/dynamic";

/** Lịch (react-big-calendar + date-fns) khá nặng: chỉ tải khi vào trang chấm công và không chặn phần còn lại của trang. */
export const LichChamCongTre = dynamic(() => import("./LichChamCong").then((m) => m.LichChamCong), {
  ssr: false,
  loading: () => <div aria-busy="true" className="h-[560px] animate-pulse bg-giay-tram" style={{ borderRadius: 6 }} />,
});
