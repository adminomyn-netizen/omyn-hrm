/* OMYN HRM — service worker chỉ lo thông báo đẩy (không lưu đệm trang: dữ liệu nhân sự và lương luôn lấy mới từ máy chủ).
 * Máy chủ gửi {tieuDe, noiDung, url, tag}. Chạm vào thông báo thì mở/tập trung vào OMYN đúng trang. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { noiDung: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.tieuDe || "OMYN · Nhân sự", {
    body: d.noiDung || "", icon: "/icon-192.png", badge: "/icon-192.png", tag: d.tag || undefined, renotify: !!d.tag,
    data: { url: d.url || "/dashboard" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/dashboard", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ds) => {
    const co = ds.find((c) => c.url.startsWith(self.location.origin));
    return co ? co.focus().then((c) => ("navigate" in c ? c.navigate(url) : c)) : self.clients.openWindow(url);
  }));
});
