"use client";

import { useTransition } from "react";
import { duyetDonTu } from "@/app/don-tu/actions";

export function HanhDongDonTu({ id }: { id: string }) {
  const [dangXuLy, startXuLy] = useTransition();

  const guiHanhDong = (hanhDong: "duyet" | "tu_choi") => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("hanh_dong", hanhDong);
    startXuLy(() => duyetDonTu(fd));
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={dangXuLy}
        onClick={() => guiHanhDong("duyet")}
        className="rounded-md bg-omyn-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Duyệt
      </button>
      <button
        type="button"
        disabled={dangXuLy}
        onClick={() => guiHanhDong("tu_choi")}
        className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
      >
        Từ chối
      </button>
    </div>
  );
}
