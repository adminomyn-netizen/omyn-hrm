import { LogoMark } from "@/components/brand/Logo";

/** Khung chung cho trang Đăng nhập / Đăng ký — panel thương hiệu bên trái
 * trên desktop, form bên phải; chỉ còn logo gọn trên di động. */
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
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-omyn-primary to-omyn-primary-dark p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10"
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark size="md" />
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">OMYN</div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-white/70">HRM nội bộ</div>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-semibold leading-tight">
            Quản trị nhân sự Omyn Cosmetics — gọn, đúng việc, dùng thật.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/75">
            Hồ sơ nhân sự, chấm công, đơn từ, lương và tuyển dụng trong một hệ thống nội bộ, cho cả
            bộ phận quản lý và từng nhân viên.
          </p>
        </div>

        <div className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Công ty Cổ phần OMYN Cosmetics
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden">
            <LogoMark size="lg" />
          </div>
          <div className="mb-6 text-center lg:text-left">
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{tieuDe}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{moTa}</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
