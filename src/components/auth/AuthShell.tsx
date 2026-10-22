import { Logo } from "@/components/brand/Logo";

/** Khung màn đăng nhập/đăng ký: trái là mảng espresso ánh vàng mang thương hiệu
 * (chỉ từ 1024 px trở lên), phải là biểu mẫu trên nền ngà. */
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
    <div className="flex min-h-screen">
      <aside className="nen-toi relative hidden w-[46%] flex-col justify-between p-12 lg:flex">
        <Logo size="lg" nenToi />
        <div>
          <p className="chu-tieu-de text-[44px] italic leading-[1.15] text-[#f6ebd0]">
            Làm đẹp bắt đầu từ
            <br />
            <span className="chu-vang">một đội ngũ được chăm chút.</span>
          </p>
          <div className="mt-8 h-px w-24 bg-gradient-to-r from-[#e2be66] to-transparent" />
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[#d9ccb0]">
            Hồ sơ, chấm công, đơn từ và lương của OMYN Cosmetics trong một nơi gọn gàng.
          </p>
        </div>
        <p className="text-[12px] text-[#b8a67e]">Công ty Cổ phần OMYN Cosmetics</p>
      </aside>

      <div className="nen-trang flex min-h-screen flex-1 flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-[360px]">
            <div className="lg:hidden">
              <Logo size="lg" />
            </div>
            <h1 className="chu-tieu-de mt-10 text-[36px] text-muc lg:mt-0">{tieuDe}</h1>
            <p className="mt-2 text-[15px] text-muc-2">{moTa}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
        <footer className="px-4 pb-6 text-center text-[12px] text-muc-3 lg:hidden">
          Công ty Cổ phần OMYN Cosmetics · Hệ thống nội bộ
        </footer>
      </div>
    </div>
  );
}
