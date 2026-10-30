"use client";

import { useEffect } from "react";

/** Đăng ký service worker để nhận thông báo đẩy (chỉ trên bản chạy thật, https). */
export function DangKyUngDung() {
  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    )
      return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* trình duyệt chặn: bỏ qua, ứng dụng vẫn chạy bình thường */
    });
  }, []);
  return null;
}
