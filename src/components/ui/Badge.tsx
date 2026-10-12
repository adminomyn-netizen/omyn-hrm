const mauTheo: Record<string, string> = {
  xanh: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  vang: "bg-amber-50 text-amber-700 ring-amber-600/20",
  do: "bg-rose-50 text-rose-700 ring-rose-600/20",
  xam: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function Badge({
  children,
  mau = "xam",
}: {
  children: React.ReactNode;
  mau?: keyof typeof mauTheo;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${mauTheo[mau]}`}
    >
      {children}
    </span>
  );
}
