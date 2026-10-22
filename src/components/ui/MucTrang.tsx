/** Một khu trong trang: tiêu đề nhỏ đậm + đường kẻ mảnh, hành động nhỏ bên phải. Không khung, không thẻ. */
export function MucTrang({
  tieuDe,
  phai,
  children,
}: {
  tieuDe: string;
  phai?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-4 border-b border-vien pb-2.5">
        <h2 className="text-[15px] font-semibold text-muc">{tieuDe}</h2>
        {phai && <div className="text-[13px]">{phai}</div>}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}
