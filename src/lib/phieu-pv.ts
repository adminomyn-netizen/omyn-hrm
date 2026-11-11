/** Phiếu đánh giá phỏng vấn: tiêu chí mặc định, kết luận, kiểm dữ liệu và điểm trung bình (hàm thuần, có test). */
export const VONG_PV = ["Sàng lọc điện thoại", "Vòng 1", "Vòng 2", "Vòng cuối"] as const;
export const KET_LUAN_PV = ["Đạt", "Cân nhắc", "Không đạt"] as const;

/** Bộ tiêu chí mặc định (chấm 1–5). Mỗi phiếu lưu kèm tên tiêu chí nên sửa danh sách này không làm đổi phiếu cũ. */
export const TIEU_CHI_PV_MAC_DINH = ["Chuyên môn", "Kinh nghiệm", "Giao tiếp", "Thái độ", "Phù hợp văn hóa", "Khả năng gắn bó"] as const;
export const NHAN_DIEM_PV: Record<number, string> = { 1: "Yếu", 2: "Dưới mức cần", 3: "Đạt yêu cầu", 4: "Tốt", 5: "Rất tốt" };

export type TieuChiDiem = { ten: string; diem: number | null };

/** Điểm trung bình các tiêu chí đã chấm (bỏ tiêu chí để trống). Chưa chấm tiêu chí nào → null. Làm tròn 1 chữ số. */
export function diemTrungBinhPv(tc: TieuChiDiem[]): number | null {
  const co = tc.filter((t) => typeof t.diem === "number" && t.diem >= 1 && t.diem <= 5);
  if (co.length === 0) return null;
  return Math.round((co.reduce((s, t) => s + (t.diem as number), 0) / co.length) * 10) / 10;
}

/** Đọc cột jsonb về danh sách tiêu chí hợp lệ (bỏ phần tử sai dạng). */
export function docTieuChi(x: unknown): TieuChiDiem[] {
  if (!Array.isArray(x)) return [];
  return x.flatMap((t) => {
    if (!t || typeof t !== "object") return [];
    const ten = String((t as { ten?: unknown }).ten ?? "").trim();
    const d = (t as { diem?: unknown }).diem;
    const diem = typeof d === "number" && Number.isInteger(d) && d >= 1 && d <= 5 ? d : null;
    return ten ? [{ ten, diem }] : [];
  });
}

/** Ghép điểm người dùng nhập (`d0, d1, …` ứng theo `TIEU_CHI_PV_MAC_DINH`) thành danh sách tiêu chí. Điểm sai (ngoài 1–5, không nguyên) → lỗi. */
export function ghepTieuChi(lay: (i: number) => string, ten: readonly string[] = TIEU_CHI_PV_MAC_DINH): { tc?: TieuChiDiem[]; loi?: string } {
  const tc: TieuChiDiem[] = [];
  for (let i = 0; i < ten.length; i++) {
    const tho = lay(i).trim();
    if (tho === "") { tc.push({ ten: ten[i], diem: null }); continue; }
    const n = Number(tho);
    if (!Number.isInteger(n) || n < 1 || n > 5) return { loi: `Điểm "${ten[i]}" phải từ 1 đến 5.` };
    tc.push({ ten: ten[i], diem: n });
  }
  return { tc };
}
