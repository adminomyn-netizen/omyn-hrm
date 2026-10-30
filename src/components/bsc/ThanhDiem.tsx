import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { mucDat } from "@/lib/bsc";

const KIEU = { tot: "tot", "theo-doi": "cho", cham: "loi", chua: "tram" } as const;
export const dinhDangDiem = (d: number | null) => (d === null ? "Chưa có số" : `${d.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`);

/** Thanh tiến độ + nhãn % theo mức đạt (≥100 tốt, ≥80 theo dõi, dưới đó chậm). Thanh tối đa 100% bề rộng dù điểm tới 120%. */
export function ThanhDiem({ diem, nho = false }: { diem: number | null; nho?: boolean }) {
  const m = mucDat(diem);
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 overflow-hidden rounded-tag bg-giay-tram ${nho ? "h-1.5" : "h-2"}`} role="progressbar" aria-valuenow={diem === null ? undefined : Math.round(diem)} aria-valuemin={0} aria-valuemax={120} aria-label="Mức đạt">
        <div className={`h-full ${m === "cham" ? "bg-loi" : m === "theo-doi" ? "bg-canh-bao" : "bg-nhan"}`} style={{ width: `${diem === null ? 0 : Math.min(100, diem)}%` }} />
      </div>
      <NhanTrangThai kieu={KIEU[m]}>{dinhDangDiem(diem)}</NhanTrangThai>
    </div>
  );
}
