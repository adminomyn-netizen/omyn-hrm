"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, type EventProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { vi },
});

export type SuKienChamCong = {
  id: string;
  ngay: string; // "YYYY-MM-DD"
  hoTen: string;
  gioVao: string | null;
  gioRa: string | null;
  trangThai: string;
};

type SuKienLich = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  trangThai: string;
};

const MAU_THEO_TRANG_THAI: Record<string, { bg: string; border: string }> = {
  "Đúng giờ": { bg: "#ccfbf1", border: "#0f766e" },
  "Đi muộn": { bg: "#fef3c7", border: "#d97706" },
  "Vắng mặt": { bg: "#fee2e2", border: "#dc2626" },
  "Nghỉ phép": { bg: "#e0e7ff", border: "#4338ca" },
};

export function LichChamCong({
  suKien,
  nam,
  thang,
}: {
  suKien: SuKienChamCong[];
  nam: number;
  thang: number;
}) {
  const router = useRouter();

  const danhSachSuKien = useMemo<SuKienLich[]>(
    () =>
      suKien.map((s) => {
        const ngay = new Date(`${s.ngay}T00:00:00`);
        return {
          id: s.id,
          title: `${s.hoTen} · ${s.trangThai}`,
          start: ngay,
          end: ngay,
          trangThai: s.trangThai,
        };
      }),
    [suKien],
  );

  const ngayMacDinh = useMemo(() => new Date(nam, thang - 1, 1), [nam, thang]);

  return (
    <div className="omyn-rbc" style={{ height: 640 }}>
      <Calendar
        localizer={localizer}
        culture="vi"
        events={danhSachSuKien}
        defaultDate={ngayMacDinh}
        date={ngayMacDinh}
        view="month"
        views={["month"]}
        onView={() => {}}
        onNavigate={(ngayMoi) => {
          const n = ngayMoi.getFullYear();
          const t = ngayMoi.getMonth() + 1;
          router.push(`/cham-cong?nam=${n}&thang=${t}`);
        }}
        messages={{
          next: "Tháng sau",
          previous: "Tháng trước",
          today: "Hôm nay",
          noEventsInRange: "Không có dữ liệu chấm công trong khoảng này.",
        }}
        eventPropGetter={(event: SuKienLich) => {
          const mau = MAU_THEO_TRANG_THAI[event.trangThai] ?? { bg: "#e2e8f0", border: "#64748b" };
          return {
            style: {
              backgroundColor: mau.bg,
              borderLeft: `3px solid ${mau.border}`,
              color: "#0f172a",
            },
          };
        }}
        components={{
          event: ({ event }: EventProps<SuKienLich>) => (
            <span className="truncate text-xs font-medium">{event.title}</span>
          ),
        }}
      />
    </div>
  );
}
