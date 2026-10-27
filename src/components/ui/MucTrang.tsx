/** Một khu trong trang: thẻ nổi có tiêu đề nhỏ đậm + đường kẻ mảnh, hành động nhỏ bên phải. */
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
    <section className="the-noi the-noi-thap min-w-0">
      <div className="flex items-baseline justify-between gap-4 border-b border-vien px-5 pb-3 pt-5">
        <h2 className="text-[15px] font-semibold text-muc">{tieuDe}</h2>
        {phai && <div className="text-[13px]">{phai}</div>}
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </section>
  );
}
