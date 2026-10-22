"use client";

import { useTransition } from "react";
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
      className="text-[13px] font-medium text-muc-2 underline-offset-4 hover:text-muc hover:underline disabled:opacity-50"
    >
      Đăng xuất
    </button>
  );
}
