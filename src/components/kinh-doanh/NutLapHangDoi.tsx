"use client";

import { useState, useTransition } from "react";
import { lapHangDoiHomNay } from "@/app/(app)/kinh-doanh/tin-nhan/actions";

export function NutLapHangDoi() {
  const [dang, bat] = useTransition();
  const [tb, datTb] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={dang}
        onClick={() => bat(async () => {
          const r = await lapHangDoiHomNay();
          datTb(r.loi ?? (r.them ? `Đã thêm ${r.them} tin vào hàng đợi (chưa gửi).` : "Không có tin mới cần lập hôm nay."));
        })}
        className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium disabled:opacity-60"
      >
        {dang ? "Đang lập" : "Lập hàng đợi hôm nay"}
      </button>
      {tb && <span role="status" className="text-[13px] text-muc-2">{tb}</span>}
    </div>
  );
}
