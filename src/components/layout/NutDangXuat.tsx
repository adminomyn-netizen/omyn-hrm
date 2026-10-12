"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { dangXuat } from "@/lib/actions";

/** Nút type="button" gọi action thẳng qua onClick — KHÔNG đặt trong một
 * <form> có thể submit thật, xem ghi chú trong src/lib/actions.ts. */
export function NutDangXuat() {
  const [dangXuLy, startXuLy] = useTransition();

  return (
    <button
      type="button"
      disabled={dangXuLy}
      onClick={() => startXuLy(() => dangXuat())}
      title="Đăng xuất"
      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
