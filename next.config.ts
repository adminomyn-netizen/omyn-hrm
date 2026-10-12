import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Omyn HRM là dashboard nội bộ, dữ liệu phải luôn mới theo từng lượt xem —
  // tắt Cache Components/PPR (mặc định của create-next-app) để khỏi phải tự
  // đánh dấu "use cache" cho từng trang; mặc định cổ điển render động là đúng ý ở đây.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
