/** Danh sách thanh tỷ lệ: nhãn + số bên trên, thanh mảnh dải vàng bên dưới. */
export function ThanhTyLe({ dong, donVi }: { dong: { nhan: string; so: number }[]; donVi: string }) {
  const lon = Math.max(1, ...dong.map((d) => d.so));
  return (
    <ul className="space-y-4">
      {dong.map((d) => (
        <li key={d.nhan}>
          <div className="flex justify-between text-[14px]">
            <span className="font-medium text-muc">{d.nhan}</span>
            <span className="tabular-nums text-muc-3">{d.so.toLocaleString("vi-VN")} {donVi}</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-giay-tram" style={{ borderRadius: 2 }}>
            <div className="h-1.5" style={{ width: `${Math.round((d.so / lon) * 100)}%`, background: "var(--gradient-vang)", borderRadius: 2 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
