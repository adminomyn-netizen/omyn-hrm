export type Cot<T> = {
  nhan: string;
  hienThi: (dong: T) => React.ReactNode;
};

export function Bang<T>({
  cot,
  duLieu,
  khoa,
}: {
  cot: Cot<T>[];
  duLieu: T[];
  khoa: (dong: T) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-omyn-border text-left text-slate-500 dark:text-slate-400">
            {cot.map((c) => (
              <th key={c.nhan} className="pb-2 pr-4 font-medium">
                {c.nhan}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {duLieu.map((dong) => (
            <tr key={khoa(dong)} className="border-b border-omyn-border last:border-0">
              {cot.map((c) => (
                <td key={c.nhan} className="py-2.5 pr-4 text-slate-700 dark:text-slate-300">
                  {c.hienThi(dong)}
                </td>
              ))}
            </tr>
          ))}
          {duLieu.length === 0 && (
            <tr>
              <td colSpan={cot.length} className="py-6 text-center text-slate-400 dark:text-slate-500">
                Chưa có dữ liệu.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
