/** Tổng hợp số liệu quảng cáo (hàm thuần). Tỉ lệ (CTR, CPC, CPM, chi phí/kết quả) luôn TÍNH LẠI từ tổng, không bao giờ trung bình các tỉ lệ từng ngày — trung bình tỉ lệ cho ra con số sai khi ngày chi nhiều/ít khác nhau. */

export type DongSoLieu = { quangCaoId: string; ngay: string; chiTieu: number; hienThi: number; nhap: number; tiepCan?: number; ketQua?: number };
export type TongSo = { chiTieu: number; hienThi: number; nhap: number; ketQua: number; ctr: number | null; cpc: number | null; cpm: number | null; chiPhiKetQua: number | null };

const chia = (a: number, b: number) => (b > 0 ? a / b : null);
const r2 = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);
const nhan = (n: number | null, k: number) => (n === null ? null : n * k);

export function tongHop(ds: readonly Pick<DongSoLieu, "chiTieu" | "hienThi" | "nhap" | "ketQua">[]): TongSo {
  const t = ds.reduce<{ chiTieu: number; hienThi: number; nhap: number; ketQua: number }>((a, x) => ({ chiTieu: a.chiTieu + x.chiTieu, hienThi: a.hienThi + x.hienThi, nhap: a.nhap + x.nhap, ketQua: a.ketQua + (x.ketQua ?? 0) }), { chiTieu: 0, hienThi: 0, nhap: 0, ketQua: 0 });
  return { ...t, chiTieu: r2(t.chiTieu)!, ctr: r2(nhan(chia(t.nhap, t.hienThi), 100)), cpc: r2(chia(t.chiTieu, t.nhap)), cpm: r2(nhan(chia(t.chiTieu, t.hienThi), 1000)), chiPhiKetQua: r2(chia(t.chiTieu, t.ketQua)) };
}

/** Gộp dòng số liệu theo khoá (chiến dịch / nhóm / quảng cáo) rồi tổng hợp từng khoá. */
export function gopTheo<T extends Pick<DongSoLieu, "chiTieu" | "hienThi" | "nhap" | "ketQua">>(ds: readonly T[], khoa: (x: T) => string): Map<string, TongSo> {
  const m = new Map<string, T[]>();
  for (const x of ds) (m.get(khoa(x)) ?? m.set(khoa(x), []).get(khoa(x))!).push(x);
  return new Map([...m].map(([k, v]) => [k, tongHop(v)]));
}

/** Chi tiêu từng ngày trong [tu, den], ngày không có số liệu = 0 (để vẽ đường liên tục). */
export function chiTieuTheoNgay(ds: readonly Pick<DongSoLieu, "ngay" | "chiTieu">[], tu: string, den: string): { ngay: string; chiTieu: number }[] {
  const m = new Map<string, number>();
  for (const x of ds) m.set(x.ngay, (m.get(x.ngay) ?? 0) + x.chiTieu);
  const ra: { ngay: string; chiTieu: number }[] = [];
  for (let t = Date.parse(`${tu}T00:00:00Z`); t <= Date.parse(`${den}T00:00:00Z`) && ra.length < 400; t += 864e5) {
    const d = new Date(t).toISOString().slice(0, 10);
    ra.push({ ngay: d, chiTieu: Math.round((m.get(d) ?? 0) * 100) / 100 });
  }
  return ra;
}

export type KhoangNgay = { ma: string; nhan: string; tu: string; den: string };
/** Các khoảng xem nhanh tính từ hôm nay: 7 ngày, 30 ngày, tháng này. */
export function khoangNgay(homNay: string): KhoangNgay[] {
  const lui = (n: number) => new Date(Date.parse(`${homNay}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);
  return [
    { ma: "7", nhan: "7 ngày", tu: lui(6), den: homNay },
    { ma: "30", nhan: "30 ngày", tu: lui(29), den: homNay },
    { ma: "thang", nhan: "Tháng này", tu: `${homNay.slice(0, 7)}-01`, den: homNay },
  ];
}

/** Khoá API đã khai trong biến môi trường chưa — chỉ trả có/không, không bao giờ trả giá trị khoá. */
export function trangThaiKhoa(env: Record<string, string | undefined>) {
  const co = (...k: string[]) => k.every((x) => !!env[x]?.trim());
  return { facebook: co("META_ADS_ACCESS_TOKEN"), tiktok: co("TIKTOK_ADS_APP_ID", "TIKTOK_ADS_APP_SECRET", "TIKTOK_ADS_ACCESS_TOKEN") };
}
