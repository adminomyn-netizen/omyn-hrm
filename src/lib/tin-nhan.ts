import type { DiemKhach, DongDiem } from "./kinh-doanh";

export type MauTin = { id: string; kenh: "SMS" | "Zalo"; noiDung: string; dangDung: boolean };
export type KichBan = { id: string; suKien: string; soNgay: number; mauTinId: string; bat: boolean };
export type KhachTin = { id: string; ten: string; dienThoai: string | null; ngaySinh: string | null; dongYNhanTin: boolean };
export type DaCo = { khachId: string; kichBanId: string | null; ngay: string };
export type MucHangDoi = { khachId: string; kichBanId: string; kenh: "SMS" | "Zalo"; noiDung: string; ngayDuKien: string };

export const BIEN_TIN = ["ten", "hang", "diem"] as const;
const congNgay = (ngay: string, n: number) => new Date(Date.parse(ngay) + n * 864e5).toISOString().slice(0, 10);

/** Biến lạ trong mẫu (vd {sdt}) — dùng để báo lỗi trước khi lưu mẫu. */
export function bienLaTrongMau(noiDung: string): string[] {
  return [...new Set([...noiDung.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]))].filter((b) => !(BIEN_TIN as readonly string[]).includes(b));
}

/** Điền {ten} {hang} {diem}; chưa có hạng thì ghi "chưa có hạng". */
export function dienMau(noiDung: string, b: { ten: string; hang: string | null; diem: number }): string {
  return noiDung.replaceAll("{ten}", b.ten).replaceAll("{hang}", b.hang ?? "chưa có hạng").replaceAll("{diem}", b.diem.toLocaleString("vi-VN"));
}

/** Ngày sinh YYYY-MM-DD trùng tháng-ngày với `ngay` (29/02 chỉ trùng năm nhuận, chấp nhận). */
const trungSinhNhat = (ngaySinh: string, ngay: string) => ngaySinh.slice(5) === ngay.slice(5);

/**
 * Lập các tin cần gửi cho `homNay`. Quy tắc cứng:
 * - CHỈ khách đã đồng ý nhận tin và có số điện thoại; kịch bản và mẫu phải đang bật.
 * - Sinh nhật: sinh nhật rơi vào (hôm nay + số ngày báo trước). Sau khi mua / Nhắc mua lại: lần Mua gần nhất cách hôm nay đúng `số ngày`.
 * - Điểm sắp hết hạn: khách có điểm hết hạn trong 30 ngày tới; mỗi khách chỉ 1 tin trong 30 ngày.
 * - Không lập trùng: bỏ qua nếu đã có mục cùng khách + kịch bản (cùng ngày, hoặc trong 30 ngày với điểm hết hạn).
 */
export function lapHangDoi(
  khach: readonly KhachTin[], diem: readonly DiemKhach[], dong: readonly DongDiem[], kichBan: readonly KichBan[], mau: readonly MauTin[], daCo: readonly DaCo[], homNay: string,
): MucHangDoi[] {
  const ra: MucHangDoi[] = [];
  for (const kb of kichBan) {
    const m = mau.find((x) => x.id === kb.mauTinId);
    if (!kb.bat || !m || !m.dangDung) continue;
    for (const k of khach) {
      if (!k.dongYNhanTin || !k.dienThoai?.trim()) continue;
      const d = diem.find((x) => x.id === k.id);
      let dung = false;
      if (kb.suKien === "Sinh nhật") dung = !!k.ngaySinh && trungSinhNhat(k.ngaySinh, congNgay(homNay, kb.soNgay));
      else if (kb.suKien === "Sau khi mua" || kb.suKien === "Nhắc mua lại") {
        const cuoi = dong.filter((x) => x.khachId === k.id && x.loai === "Mua").map((x) => x.ngay).sort().pop();
        dung = cuoi === congNgay(homNay, -kb.soNgay);
      } else if (kb.suKien === "Điểm sắp hết hạn") dung = (d?.sapHet ?? 0) > 0;
      if (!dung) continue;
      const cua = kb.suKien === "Điểm sắp hết hạn" ? congNgay(homNay, -30) : homNay;
      if (daCo.some((c) => c.khachId === k.id && c.kichBanId === kb.id && c.ngay >= cua)) continue;
      ra.push({ khachId: k.id, kichBanId: kb.id, kenh: m.kenh, ngayDuKien: homNay, noiDung: dienMau(m.noiDung, { ten: k.ten, hang: d?.hang ?? null, diem: kb.suKien === "Điểm sắp hết hạn" ? (d?.sapHet ?? 0) : (d?.soDu ?? 0) }) });
    }
  }
  return ra;
}
