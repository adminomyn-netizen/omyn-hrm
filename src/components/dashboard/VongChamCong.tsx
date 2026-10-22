/** Vòng tiến độ (SVG): số người đã chấm công / tổng. Nét dải vàng, nền mờ. */
export function VongChamCong({ da, tong, kichThuoc = 150 }: { da: number; tong: number; kichThuoc?: number }) {
  const r = 62;
  const chuVi = 2 * Math.PI * r;
  const tyLe = tong > 0 ? Math.min(1, da / tong) : 0;
  return (
    <div className="relative shrink-0" style={{ width: kichThuoc, height: kichThuoc }}>
      <svg width={kichThuoc} height={kichThuoc} viewBox="0 0 150 150" role="img" aria-label={`${da} trên ${tong} người đã chấm công`}>
        <defs>
          <linearGradient id="vong-vang" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F0D896" />
            <stop offset="1" stopColor="#B8923A" />
          </linearGradient>
        </defs>
        <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(243,234,216,.14)" strokeWidth="10" />
        {tyLe > 0 && (
          <circle cx="75" cy="75" r={r} fill="none" stroke="url(#vong-vang)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${chuVi * tyLe} ${chuVi}`} transform="rotate(-90 75 75)" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[38px] font-medium leading-none tabular-nums">
          {da}
          <span className="text-[20px] text-[#A89A7C]">/{tong}</span>
        </span>
        <span className="mt-1 text-[11px] text-[#CDBFA3]">đã chấm công</span>
      </div>
    </div>
  );
}
