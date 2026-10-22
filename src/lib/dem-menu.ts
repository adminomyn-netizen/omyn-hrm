"use client";

import { useSyncExternalStore } from "react";

/** Số đếm nhỏ cạnh mục menu (đơn chờ duyệt, tài khoản chờ duyệt, ứng viên mới).
 * Chuông thông báo tải số liệu rồi ghi vào đây; menu đọc ra. Không qua máy chủ thêm lần nữa. */
export type DemMenu = Record<string, number>;
const RONG: DemMenu = {};
let hienTai: DemMenu = RONG;
const nguoiNghe = new Set<() => void>();

export function datDemMenu(moi: DemMenu) {
  hienTai = moi;
  nguoiNghe.forEach((f) => f());
}

export function useDemMenu(): DemMenu {
  return useSyncExternalStore(
    (cb) => {
      nguoiNghe.add(cb);
      return () => nguoiNghe.delete(cb);
    },
    () => hienTai,
    () => RONG,
  );
}

/** Số thông báo chưa đọc (chuông ghi, thanh tab dưới cùng đọc). */
let chuaDoc = 0;
const ngheChuaDoc = new Set<() => void>();
export function datChuaDoc(n: number) {
  if (n === chuaDoc) return;
  chuaDoc = n;
  ngheChuaDoc.forEach((f) => f());
}
export function useChuaDoc(): number {
  return useSyncExternalStore(
    (cb) => {
      ngheChuaDoc.add(cb);
      return () => ngheChuaDoc.delete(cb);
    },
    () => chuaDoc,
    () => 0,
  );
}
