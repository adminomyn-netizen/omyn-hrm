import { Logo } from "@/components/brand/Logo";

/** Khung màn đăng nhập: nền giấy, một cột 360 px ở giữa — logo, tiêu đề
 * serif, biểu mẫu, một dòng chú thích. Không ảnh minh hoạ, không gradient. */
export function AuthShell({
  children,
  tieuDe,
  moTa,
}: {
  children: React.ReactNode;
  tieuDe: string;
  moTa: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-giay">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[360px]">
          <Logo size="lg" />
          <h1 className="chu-tieu-de mt-12 text-[36px] text-muc">{tieuDe}</h1>
          <p className="mt-2 text-[15px] text-muc-2">{moTa}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <footer className="px-4 pb-6 text-center text-[12px] text-muc-3">
        Công ty Cổ phần OMYN Cosmetics · Hệ thống nội bộ
      </footer>
    </div>
  );
}
