"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Đặt vị trí cho hộp nổi (danh sách thả xuống, lịch) được vẽ qua portal ở <body>, nên KHÔNG bị cắt bởi bảng/khung cuộn/hộp thoại chứa nó.
 * Tự mở lên trên nếu bên dưới không đủ chỗ, giới hạn chiều cao theo chỗ trống, bám theo khi cuộn hoặc đổi cỡ cửa sổ.
 * Gán thẳng vào style của phần tử (không qua state) để khỏi vẽ lại. */
function datViTri(h: HTMLElement, t: HTMLElement, rongYeuCau: number | undefined, caoUoc: number) {
  const r = t.getBoundingClientRect();
  const rong = rongYeuCau ?? Math.max(r.width, 160);
  const duoi = window.innerHeight - r.bottom - 10;
  const tren = r.top - 10;
  const len = duoi < Math.min(caoUoc, 320) && tren > duoi;
  const trai = Math.max(8, Math.min(r.left, window.innerWidth - rong - 8));
  h.style.position = "fixed";
  h.style.left = `${trai}px`;
  h.style.width = `${rong}px`;
  h.style.maxHeight = `${Math.max(140, len ? tren : duoi)}px`;
  if (len) {
    h.style.top = "auto";
    h.style.bottom = `${window.innerHeight - r.top + 6}px`;
  } else {
    h.style.bottom = "auto";
    h.style.top = `${r.bottom + 6}px`;
  }
  h.style.visibility = "visible";
}

export function useNoi(mo: boolean, trigger: RefObject<HTMLElement | null>, hop: RefObject<HTMLElement | null>, opts: { rong?: number; caoUoc: number }) {
  const { rong, caoUoc } = opts;
  useLayoutEffect(() => {
    if (!mo) return;
    const dat = () => {
      if (trigger.current && hop.current) datViTri(hop.current, trigger.current, rong, caoUoc);
    };
    dat();
    window.addEventListener("resize", dat);
    window.addEventListener("scroll", dat, true);
    return () => {
      window.removeEventListener("resize", dat);
      window.removeEventListener("scroll", dat, true);
    };
  }, [mo, trigger, hop, rong, caoUoc]);
}
