"use client";

import { NUT_CHINH } from "@/components/ui/dinh-dang";

/** Nút in / lưu PDF phiếu lương (hộp thoại in của trình duyệt). Ẩn khi in. */
export function NutIn() {
  return (
    <button type="button" className={`${NUT_CHINH} khong-in`} onClick={() => window.print()}>In phiếu / Lưu PDF</button>
  );
}
