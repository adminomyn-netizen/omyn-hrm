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
  khoiTen: string;
  gioVao: string | null;
  gioRa: string | null;
  trangThai: string;
};

type SuKienLich = {
  id: string;
  hoTen: string;
  khoiTen: string;
  gio: string;
  title: string;
  start: Date;
  end: Date;
  trangThai: string;
};

// Màu theo trạng thái dùng biến màu của giao diện nên tự đổi theo chế độ sáng/tối.
const MAU_THEO_TRANG_THAI: Record<string, { bg: string; border: string; chu: string }> = {
  "Đúng giờ": { bg: "var(--nhan-nhat)", border: "var(--nhan)", chu: "var(--nhan-dam)" },
  "Đi muộn": { bg: "var(--canh-bao-nen)", border: "var(--canh-bao)", chu: "var(--canh-bao)" },
  "Vắng mặt": { bg: "var(--loi-nen)", border: "var(--loi)", chu: "var(--loi)" },
  "Nghỉ phép": { bg: "var(--giay-tram)", border: "var(--vien-dam)", chu: "var(--muc-2)" },
};

const hhmm = (g: string | null) => (g ? g.slice(0, 5) : null);
/** "08:20 – 17:35"; chưa chấm ra thì "08:20 – …". */
export const gioLam = (vao: string | null, ra: string | null) => (vao ? `${hhmm(vao)} – ${hhmm(ra) ?? "…"}` : "Chưa chấm vào");

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
          hoTen: s.hoTen,
          khoiTen: s.khoiTen,
          gio: gioLam(s.gioVao, s.gioRa),
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
    // overflow-x-auto khoanh vùng lịch này — lưới RBC có bề rộng cố định tối
    // thiểu, không bọc thì nó đẩy tràn ngang cả trang trên di động.
    <div className="overflow-x-auto">
      <div className="omyn-rbc" style={{ height: 760, minWidth: 720 }}>
        <Calendar
          localizer={localizer}
          culture="vi"
          events={danhSachSuKien}
          defaultDate={ngayMacDinh}
          date={ngayMacDinh}
          view="month"
          toolbar={false}
          popup
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
            showMore: (n: number) => `+${n} người nữa`,
          }}
          eventPropGetter={(event: SuKienLich) => {
            const mau = MAU_THEO_TRANG_THAI[event.trangThai] ?? { bg: "var(--giay-tram)", border: "var(--vien-dam)", chu: "var(--muc-2)" };
            return {
              style: {
                backgroundColor: mau.bg,
                borderLeft: `3px solid ${mau.border}`,
                borderRadius: 3,
                color: mau.chu,
              },
            };
          }}
          components={{
            event: ({ event }: EventProps<SuKienLich>) => (
              <span className="block leading-tight" title={`${event.hoTen} · ${event.trangThai}`}>
                <span className="block truncate text-xs font-semibold">{event.hoTen}{event.khoiTen ? ` - ${event.khoiTen}` : ""}</span>
                <span className="block truncate text-[11px] tabular-nums opacity-90">{event.gio}</span>
              </span>
            ),
          }}
        />
      </div>
    </div>
  );
}
