"use client";

import { useState, useTransition } from "react";
import { themViecTuMau } from "@/app/(app)/cong-viec/actions";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import type { MauCv } from "@/lib/mau-cong-viec";

/** Khung "Thêm từ mẫu": bấm một nút là thêm cả bộ việc hằng ngày của mảng đó (số lượng = 1, chỉnh lại sau). Hiện khi chưa có việc hằng ngày nào. */
export function MauCongViec({ mau }: { mau: Pick<MauCv, "ma" | "ten" | "viec">[] }) {
  const [dang, bat] = useTransition();
  const [tb, setTb] = useState("");
  const them = (ma: string) => bat(async () => { const r = await themViecTuMau(ma); setTb(r.loi ?? (r.them ? `Đã thêm ${r.them} việc hằng ngày.` : "Các việc này đã có sẵn.")); });
  return (
    <section aria-label="Thêm từ mẫu" className="mb-6 rounded-nho border border-vien bg-giay-sang p-4">
      <h2 className="text-[15px] font-semibold text-muc">Chưa có việc hằng ngày? Thêm từ mẫu</h2>
      <p className="mt-0.5 text-[13px] text-muc-3">Mẫu gợi ý theo từng mảng, chỉnh lại tên và số lượng cho đúng thực tế sau khi thêm.</p>
      <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {mau.map((m) => (
          <li key={m.ma} className="flex items-start justify-between gap-3 rounded-nho border border-vien p-3">
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-muc">{m.ten}</div>
              <div className="mt-0.5 line-clamp-2 text-[12px] text-muc-3">{m.viec.join(" · ")}</div>
            </div>
            <button type="button" onClick={() => them(m.ma)} disabled={dang} className={`${NUT_PHU} !h-8 shrink-0 !px-3`}>Thêm</button>
          </li>
        ))}
      </ul>
      {tb && <p role="status" className="mt-3 text-[13px] text-muc-2">{tb}</p>}
    </section>
  );
}
