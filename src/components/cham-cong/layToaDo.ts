import type { ToaDo } from "@/lib/dinh-vi";

export type KetQuaGps = { toaDo: ToaDo } | { loi: string };

const LOI_GPS: Record<number, string> = {
  1: "Trình duyệt đang chặn định vị. Cho phép \"Vị trí\" cho trang này (biểu tượng ổ khoá cạnh địa chỉ) rồi bấm lại.",
  2: "Điện thoại chưa xác định được vị trí. Bật GPS/Dịch vụ định vị rồi thử lại.",
  3: "Lấy vị trí quá lâu. Ra chỗ thoáng hoặc bật \"vị trí chính xác\" rồi thử lại.",
};

/** Lấy vị trí hiện tại từ trình duyệt (độ chính xác cao, tối đa 15 giây, không dùng vị trí cũ trong bộ nhớ đệm). */
export function layToaDo(): Promise<KetQuaGps> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve({ loi: "Thiết bị này không hỗ trợ định vị." });
  return new Promise((xong) => {
    navigator.geolocation.getCurrentPosition(
      (p) => xong({ toaDo: { viDo: p.coords.latitude, kinhDo: p.coords.longitude, doChinhXac: Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null } }),
      (e) => xong({ loi: LOI_GPS[e.code] ?? "Chưa lấy được vị trí." }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
