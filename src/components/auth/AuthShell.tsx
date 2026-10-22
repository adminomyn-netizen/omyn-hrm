import { Logo } from "@/components/brand/Logo";

/** Khung màn đăng nhập/đăng ký (design.md §7): trái là mảng espresso ánh vàng có hoa văn vòng tròn mảnh (chỉ từ 1024 px), phải là biểu mẫu trên nền ngà chuyển sắc. */
export function AuthShell({ children, tieuDe, moTa }: { children: React.ReactNode; tieuDe: string; moTa: string }) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <aside className="nen-toi relative hidden min-h-screen w-[46%] flex-col justify-between overflow-hidden p-14 lg:flex">
        <svg aria-hidden width="640" height="640" viewBox="0 0 640 640" fill="none" className="pointer-events-none absolute -bottom-[200px] -right-[180px] opacity-50">
          {[300, 240, 180, 120].map((r, i) => (
            <circle key={r} cx="320" cy="320" r={r} stroke="rgba(226,190,102,0.35)" strokeOpacity={1 - i * 0.18} strokeWidth="1" />
          ))}
        </svg>
        <Logo size="lg" nenToi className="relative" />
        <div className="relative max-w-[520px]">
          <p className="chu-tieu-de text-[52px] italic leading-[1.12] text-[#f6ebd0]">
            Làm đẹp bắt đầu từ
            <br />
            <span className="chu-vang">một đội ngũ được chăm chút.</span>
          </p>
          <div className="my-7 h-px w-24" style={{ background: "linear-gradient(90deg,#E2BE66,transparent)" }} />
          <p className="max-w-sm text-[15px] leading-relaxed text-[#d9ccb0]">Hồ sơ, chấm công, đơn từ và lương của OMYN Cosmetics trong một nơi gọn gàng.</p>
        </div>
        <p className="relative text-[12px] text-[#b8a67e]">Công ty Cổ phần OMYN Cosmetics</p>
      </aside>

      <div className="nen-trang flex min-h-screen flex-1 basis-[420px] flex-col">
        <main className="flex flex-1 items-center justify-center px-5 py-12">
          <div className="w-full max-w-[380px]">
            <div className="lg:hidden">
              <Logo size="lg" />
            </div>
            <h1 className="chu-tieu-de mt-10 text-[40px] leading-[1.1] text-muc lg:mt-0 lg:text-[44px]">{tieuDe}</h1>
            <p className="mt-2 text-[15px] text-muc-2">{moTa}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
        <footer className="px-4 pb-6 text-center text-[12px] text-muc-3 lg:hidden">Công ty Cổ phần OMYN Cosmetics · Hệ thống nội bộ</footer>
      </div>
    </div>
  );
}
