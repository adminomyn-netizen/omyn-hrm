export type Cot<T> = {
  nhan: string;
  hienThi: (dong: T) => React.ReactNode;
  /** căn phải cho cột số */
  phai?: boolean;
};

/** Bảng dữ liệu kiểu biên tập: tiêu đề chữ hoa nhỏ, kẻ ngang mảnh, hàng 52 px, rê chuột nền be. */
export function Bang<T>({
  cot,
  duLieu,
  khoa,
  trong = "Chưa có dữ liệu.",
}: {
  cot: Cot<T>[];
  duLieu: T[];
  khoa: (dong: T) => string;
  trong?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[14px]">
        <thead>
          <tr className="nhan-muc border-b border-vien">
            {cot.map((c, i) => (
              <th key={`${c.nhan}-${i}`} className={`py-3 pr-4 font-medium ${c.phai ? "text-right" : ""}`}>
                {c.nhan}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {duLieu.map((dong) => (
            <tr key={khoa(dong)} className="h-[52px] border-b border-vien transition-colors hover:bg-giay-tram/60">
              {cot.map((c, i) => (
                <td key={`${c.nhan}-${i}`} className={`py-2 pr-4 text-muc-2 ${c.phai ? "text-right tabular-nums" : ""}`}>
                  {c.hienThi(dong)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {duLieu.length === 0 && <p className="chu-tieu-de py-12 text-center text-[24px] italic text-muc-3">{trong}</p>}
    </div>
  );
}
