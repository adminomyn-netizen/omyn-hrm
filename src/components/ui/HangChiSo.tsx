/** Hàng chỉ số: số lớn + nhãn nhỏ, đặt trong một thẻ nổi, ngăn bằng đường kẻ dọc mảnh. */
export function HangChiSo({ muc }: { muc: { nhan: string; so: string; ghiChu?: string }[] }) {
  const cot = muc.length >= 4 ? "sm:grid-cols-4" : muc.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <dl className={`the-noi the-noi-thap grid grid-cols-2 gap-y-6 px-2 py-6 ${cot}`}>
      {muc.map((m, i) => (
        <div key={m.nhan} className={`px-1 sm:px-6 ${i % 2 === 1 ? "border-l border-vien sm:border-l" : ""} ${i > 0 ? "sm:border-l sm:border-vien" : ""}`}>
          <dd className="text-[30px] font-medium leading-none tabular-nums text-muc">{m.so}</dd>
          <dt className="mt-2 text-[13px] text-muc-3">{m.nhan}</dt>
          {m.ghiChu && <dd className="mt-0.5 text-[12px] text-muc-3">{m.ghiChu}</dd>}
        </div>
      ))}
    </dl>
  );
}
