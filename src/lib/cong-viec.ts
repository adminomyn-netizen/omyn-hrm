/** Quy tắc hiển thị công việc (hàm thuần). Một việc có "số lượng cần làm": việc một lần cộng dồn tới mục tiêu; việc lặp hằng ngày tính riêng từng ngày. */

export type Viec = {
  id: string; tieuDe: string; loai: "Hằng ngày" | "Vận hành"; nguoiLamId: string; han: string | null; uuTien: "Cao" | "Trung bình" | "Thấp";
  mucTieu: number; daLam: number; donVi: string; lapLai: "Không" | "Hằng ngày"; trangThai: "Chưa làm" | "Đang làm" | "Hoàn thành" | "Huỷ";
};

/** Số đã làm hôm nay (việc lặp) hoặc cộng dồn (việc một lần). */
export const daLamHienTai = (v: Pick<Viec, "lapLai" | "daLam">, homNay: number) => (v.lapLai === "Hằng ngày" ? homNay : v.daLam);

export const phanTramTienDo = (daLam: number, mucTieu: number) => (mucTieu > 0 ? Math.min(100, Math.round((daLam / mucTieu) * 100)) : 0);

export type TinhTrang = "xong" | "huy" | "qua-han" | "hom-nay" | "dang-lam" | "chua-lam";
/** Tình trạng để tô màu và xếp tab. Việc lặp hằng ngày "xong" khi đủ số lượng HÔM NAY (ngày mai lại tính lại). */
export function tinhTrang(v: Viec, daLamHomNay: number, homNay: string): TinhTrang {
  if (v.trangThai === "Huỷ") return "huy";
  const da = daLamHienTai(v, daLamHomNay);
  if (v.trangThai === "Hoàn thành" || da >= v.mucTieu) return "xong";
  if (v.lapLai === "Không" && v.han && v.han < homNay) return "qua-han";
  if (v.han === homNay || v.lapLai === "Hằng ngày") return "hom-nay";
  return da > 0 || v.trangThai === "Đang làm" ? "dang-lam" : "chua-lam";
}

const THU_TU: Record<TinhTrang, number> = { "qua-han": 0, "hom-nay": 1, "dang-lam": 2, "chua-lam": 3, xong: 4, huy: 5 };
const UU_TIEN: Record<Viec["uuTien"], number> = { Cao: 0, "Trung bình": 1, Thấp: 2 };
/** Quá hạn lên đầu, rồi hôm nay, đang làm, chưa làm, đã xong; cùng nhóm thì ưu tiên cao trước, hạn gần trước. */
export function xepViec<T extends { v: Viec; tt: TinhTrang }>(ds: readonly T[]): T[] {
  return [...ds].sort((a, b) => THU_TU[a.tt] - THU_TU[b.tt] || UU_TIEN[a.v.uuTien] - UU_TIEN[b.v.uuTien] || (a.v.han ?? "9999").localeCompare(b.v.han ?? "9999") || a.v.tieuDe.localeCompare(b.v.tieuDe, "vi"));
}

export function demTheoTinhTrang(ds: readonly TinhTrang[]) {
  const d: Record<TinhTrang, number> = { xong: 0, huy: 0, "qua-han": 0, "hom-nay": 0, "dang-lam": 0, "chua-lam": 0 };
  for (const t of ds) d[t]++;
  return d;
}

/** Ghi nhận thêm `them` (có thể âm để chỉnh lại): không xuống dưới 0, không quá 1000 một lần bấm. */
export const apDungGhiNhan = (hienCo: number, them: number) => Math.max(0, Math.min(hienCo + Math.max(-1000, Math.min(1000, Math.trunc(them))), 1_000_000));

/** Việc một lần: đủ số lượng thì tự Hoàn thành; chỉnh lại xuống dưới mục tiêu thì quay về Đang làm/Chưa làm. */
export function trangThaiSauGhiNhan(truoc: Viec["trangThai"], daLamMoi: number, mucTieu: number): Viec["trangThai"] {
  if (truoc === "Huỷ") return "Huỷ";
  return daLamMoi >= mucTieu ? "Hoàn thành" : daLamMoi > 0 ? "Đang làm" : "Chưa làm";
}
