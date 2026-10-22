/** Đường xu hướng nhỏ (SVG) cạnh chỉ số. Chuẩn hoá về khung 84×34; toàn số 0 thì vẽ đường phẳng ở giữa. */
export function DuongXuHuong({ diem }: { diem: number[] }) {
  const lon = Math.max(...diem);
  const be = Math.min(...diem);
  const bien = lon - be || 1;
  const pts = diem.map((v, i) => `${Math.round((i / Math.max(1, diem.length - 1)) * 84)},${lon === be ? 17 : Math.round(30 - ((v - be) / bien) * 26)}`).join(" ");
  return (
    <svg width="84" height="34" viewBox="0 0 84 34" fill="none" aria-hidden="true">
      <polyline points={pts} stroke="var(--nhan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
