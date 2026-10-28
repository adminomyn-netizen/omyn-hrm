import type { MetadataRoute } from "next";

/** Cài lên màn hình chính điện thoại/máy tính (iPhone chỉ nhận thông báo đẩy khi đã cài như vậy). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OMYN · Nhân sự",
    short_name: "OMYN HRM",
    description: "Hệ thống quản trị nhân sự nội bộ của OMYN Cosmetics",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f7f7",
    theme_color: "#f4f7f7",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
