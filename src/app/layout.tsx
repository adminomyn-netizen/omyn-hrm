import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Omyn HRM",
  description: "Hệ thống quản trị nhân sự nội bộ của Omyn",
};

const KHOI_TAO_CHE_DO = `
try {
  if (localStorage.getItem("omyn-hrm-che-do") === "dark") {
    document.documentElement.classList.add("dark");
  }
} catch {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Chạy trước khi vẽ trang để khỏi nhoáng sáng rồi tối — mặc định
         * luôn là sáng, chỉ bật tối khi người dùng đã tự chọn trước đó. */}
        <script dangerouslySetInnerHTML={{ __html: KHOI_TAO_CHE_DO }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
