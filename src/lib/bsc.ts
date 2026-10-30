/** Tính điểm BSC (hàm thuần, theo mô hình e-global-ops đã chốt):
 *  - % đạt một chỉ số đến tháng N: Cộng dồn = Σ thực tế / Σ kế hoạch (các tháng ≤ N có kế hoạch); Trung bình = trung bình % đạt từng tháng có đủ kế hoạch và thực tế; Cuối kỳ = % đạt của tháng gần nhất ≤ N có thực tế. Trần 120%.
 *  - Mục tiêu / góc nhìn / tổng: trung bình CÓ TRỌNG SỐ các chỉ số có điểm. Trọng số là tương đối (tự chuẩn hoá, không chặn lưu); toàn 0 thì chia đều.
 *  - Việc: trạng thái suy ra từ tiến độ và ngày, không ai chỉnh tay. */

export const TRAN_BSC = 120;
export type CachGop = "Cộng dồn" | "Trung bình" | "Cuối kỳ";
export type ThangSo = { thang: number; keHoach: number | null; thucTe: number | null };

const tron = (n: number) => Math.round(n * 10) / 10;
const phanTram = (thuc: number, ke: number) => Math.min(TRAN_BSC, (thuc / ke) * 100);

/** % đạt của một chỉ số đến hết `denThang` (1-12); null nếu chưa đủ số liệu để tính. */
export function diemChiSo(thangs: readonly ThangSo[], denThang: number, cach: CachGop): number | null {
  const t = thangs.filter((x) => x.thang >= 1 && x.thang <= denThang).sort((a, b) => a.thang - b.thang);
  if (cach === "Cộng dồn") {
    const cokh = t.filter((x) => x.keHoach !== null && x.keHoach > 0);
    const ke = cokh.reduce((a, x) => a + (x.keHoach ?? 0), 0);
    const co = cokh.filter((x) => x.thucTe !== null);
    if (ke <= 0 || co.length === 0) return null;
    return tron(phanTram(cokh.reduce((a, x) => a + (x.thucTe ?? 0), 0), ke));
  }
  const du = t.filter((x) => x.keHoach !== null && x.keHoach > 0 && x.thucTe !== null);
  if (du.length === 0) return null;
  if (cach === "Cuối kỳ") { const c = du[du.length - 1]; return tron(phanTram(c.thucTe!, c.keHoach!)); }
  return tron(du.reduce((a, x) => a + phanTram(x.thucTe!, x.keHoach!), 0) / du.length);
}

export type DiemCoTrongSo = { diem: number | null; trongSo: number };
/** Trung bình có trọng số các mục có điểm. `tongTrongSo` là tổng trọng số của TẤT CẢ mục (để cảnh báo nhóm ≠ 100). */
export function diemGop(ds: readonly DiemCoTrongSo[]): { diem: number | null; tongTrongSo: number; canhBao: boolean } {
  const tong = ds.reduce((a, x) => a + x.trongSo, 0);
  const co = ds.filter((x) => x.diem !== null);
  if (co.length === 0) return { diem: null, tongTrongSo: tong, canhBao: ds.length > 0 && Math.abs(tong - 100) > 0.01 };
  const tongCo = co.reduce((a, x) => a + x.trongSo, 0);
  const d = tongCo > 0 ? co.reduce((a, x) => a + x.diem! * x.trongSo, 0) / tongCo : co.reduce((a, x) => a + x.diem!, 0) / co.length;
  return { diem: tron(d), tongTrongSo: tong, canhBao: Math.abs(tong - 100) > 0.01 };
}

export type TrangThaiViec = "Chưa bắt đầu" | "Đang làm" | "Hoàn thành" | "Trễ hạn";
export function trangThaiViec(v: { tienDo: number; batDau: string; ketThuc: string }, homNay: string): TrangThaiViec {
  if (v.tienDo >= 100) return "Hoàn thành";
  if (homNay > v.ketThuc) return "Trễ hạn";
  if (v.tienDo > 0 || homNay >= v.batDau) return "Đang làm";
  return "Chưa bắt đầu";
}

/** Nhãn màu theo mức đạt: ≥100 tốt, ≥80 cần theo dõi, thấp hơn là chậm. null = chưa có số liệu. */
export function mucDat(d: number | null): "tot" | "theo-doi" | "cham" | "chua" {
  return d === null ? "chua" : d >= 100 ? "tot" : d >= 80 ? "theo-doi" : "cham";
}
