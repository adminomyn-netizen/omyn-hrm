import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OMYN · Nhân sự",
  description: "Hệ thống quản trị nhân sự nội bộ của OMYN Cosmetics",
};

export const viewport: Viewport = {
  themeColor: "#f4f7f7",
};

// Chạy trước khi vẽ trang để khỏi nháy sáng→tối: chỉ bật tối khi người dùng đã tự chọn trước đó.
const KHOI_TAO_CHE_DO = `try{if(localStorage.getItem("omyn-hrm-che-do")==="toi")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${beVietnam.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: KHOI_TAO_CHE_DO }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
