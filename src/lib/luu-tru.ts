"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Đọc/ghi một giá trị chuỗi trong localStorage như một "store" của React: không cần useEffect + setState,
 * đồng bộ giữa các tab (sự kiện storage) và trong cùng tab (sự kiện tuỳ biến). Máy chủ luôn trả `macDinh`. */
const SU_KIEN = "omyn-luu-tru";

export function docLuuTru(khoa: string): string | null {
  try {
    return localStorage.getItem(khoa);
  } catch {
    return null;
  }
}

export function ghiLuuTru(khoa: string, giaTri: string) {
  try {
    localStorage.setItem(khoa, giaTri);
  } catch {
    // trình duyệt chặn lưu trữ: bỏ qua, giao diện vẫn dùng được trong phiên này
  }
  window.dispatchEvent(new Event(SU_KIEN));
}

export function useLuuTru(khoa: string, macDinh: string): [string, (v: string) => void] {
  const dangKy = useCallback((cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener(SU_KIEN, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(SU_KIEN, cb);
    };
  }, []);
  const gia = useSyncExternalStore(
    dangKy,
    () => docLuuTru(khoa) ?? macDinh,
    () => macDinh,
  );
  const ghi = useCallback((v: string) => ghiLuuTru(khoa, v), [khoa]);
  return [gia, ghi];
}
