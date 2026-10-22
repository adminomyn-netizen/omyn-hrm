/** Đầu mỗi trang: tiêu đề serif lớn + một dòng phụ, hành động chính bên phải (Phụ lục design.md §6). */
export function TieuDeTrang({
  tieuDe,
  phu,
  children,
}: {
  tieuDe: string;
  phu?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-6">
      <div className="min-w-0">
        <h1 className="chu-tieu-de text-[36px] leading-[1.1] text-muc lg:text-[44px]">{tieuDe}</h1>
        {phu && <div className="mt-1.5 text-[14px] text-muc-3">{phu}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}
