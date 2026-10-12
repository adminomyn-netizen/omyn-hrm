export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-omyn-border bg-omyn-surface p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function ThongKe({
  nhan,
  giaTri,
  ghiChu,
}: {
  nhan: string;
  giaTri: string;
  ghiChu?: string;
}) {
  return (
    <Card>
      <div className="text-sm text-slate-500">{nhan}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{giaTri}</div>
      {ghiChu && <div className="mt-1 text-xs text-slate-400">{ghiChu}</div>}
    </Card>
  );
}
