import { Trophy } from "lucide-react";

export type Hang = { id: string; ten: string; diem: number; hang: number; phu?: string };

const DIEM = (d: number) => `${d.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
const CAO = ["h-28", "h-20", "h-14"] as const;

/** Bục 1-2-3 (xếp 2 · 1 · 3), đồng hạng thì cùng bậc. `thuong` = chữ thưởng theo hạng nếu có. */
export function BucVinhDanh({ ds, thuong, nhanMinh }: { ds: Hang[]; thuong?: (hang: number) => string | null; nhanMinh?: string }) {
  const top = ds.filter((x) => x.hang <= 3).slice(0, 6);
  if (top.length === 0) return <p className="rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-3">Kỳ này chưa có kết quả nào được báo.</p>;
  const thuTu = [...top].sort((a, b) => (a.hang === 1 ? 1 : a.hang === 2 ? 0 : 2) - (b.hang === 1 ? 1 : b.hang === 2 ? 0 : 2) || a.ten.localeCompare(b.ten, "vi"));
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-3" aria-label="Bục xếp hạng">
      {thuTu.map((x) => (
        <li key={x.id} className="flex min-w-0 flex-col items-center text-center">
          <Trophy strokeWidth={1.6} className={`mb-1.5 h-5 w-5 ${x.hang === 1 ? "text-nhan-dam" : "text-muc-3"}`} aria-hidden />
          <div className="w-full truncate text-[14px] font-semibold text-muc" title={x.ten}>{x.ten}{nhanMinh === x.id ? " (bạn)" : ""}</div>
          <div className="chu-tieu-de text-[22px] leading-tight text-nhan-dam">{DIEM(x.diem)}</div>
          {x.phu && <div className="text-[12px] text-muc-3">{x.phu}</div>}
          {thuong?.(x.hang) && <div className="mt-0.5 text-[12px] font-medium text-muc-2">{thuong(x.hang)}</div>}
          <div className={`mt-2 flex w-full items-start justify-center rounded-t-nho border border-vien pt-2 text-[20px] font-semibold ${CAO[Math.min(x.hang, 3) - 1]} ${x.hang === 1 ? "nut-vang" : "bg-giay-tram text-muc-2"}`}>{x.hang}</div>
        </li>
      ))}
    </ol>
  );
}

/** Danh sách xếp hạng đầy đủ (từ hạng 1), dòng của người đang xem được tô nền nhạt. */
export function DanhSachHang({ ds, minh }: { ds: Hang[]; minh?: string | null }) {
  if (ds.length === 0) return null;
  return (
    <ol className="divide-y divide-vien rounded-nho border border-vien bg-giay-sang">
      {ds.map((x) => (
        <li key={x.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${minh === x.id ? "bg-nhan-nhat" : ""}`}>
          <span className="w-7 shrink-0 text-center text-[14px] font-semibold text-muc-2">{x.hang}</span>
          <span className="min-w-0 flex-1 truncate text-[14px] text-muc">{x.ten}{x.phu && <span className="ml-2 text-[12px] text-muc-3">{x.phu}</span>}</span>
          <span className="shrink-0 text-[14px] font-semibold text-nhan-dam">{DIEM(x.diem)}</span>
        </li>
      ))}
    </ol>
  );
}
