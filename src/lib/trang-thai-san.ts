/** Hai lớp trạng thái đơn sàn: lớp 1 = mã gốc của sàn (vd COMPLETED), lớp 2 = trạng thái nội bộ của Omyn (4 trạng thái). Hàm thuần, không chạm DB. */
import { docTrangThai, type TrangThaiDonLe } from "@/lib/nhap-don-le";

export type DongGhep = { nen_tang: string; ma_san: string; trang_thai_noi_bo: string; hoat_dong: boolean };

const TT_NOI_BO: readonly string[] = ["Đang xử lý", "Đã giao", "Hoàn trả", "Huỷ"];

/** Chuẩn hoá mã để so khớp: bỏ khoảng trắng đầu cuối, thường hoá, gộp khoảng trắng/gạch dưới (READY_TO_SHIP = ready to ship). */
export const chuanMaSan = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, " ");

/** Dựng bảng tra theo kênh từ các dòng ghép đang hoạt động. */
export function dungBangGhep(dong: readonly DongGhep[], kenh: string): Map<string, TrangThaiDonLe> {
  const m = new Map<string, TrangThaiDonLe>();
  for (const d of dong) {
    if (!d.hoat_dong || d.nen_tang !== kenh || !TT_NOI_BO.includes(d.trang_thai_noi_bo)) continue;
    m.set(chuanMaSan(d.ma_san), d.trang_thai_noi_bo as TrangThaiDonLe);
  }
  return m;
}

export type KetQuaGhep = { trangThai: TrangThaiDonLe; /** true = có dòng ghép; false = suy theo chữ (đoán) */ ghepDuoc: boolean };

/**
 * Trạng thái nội bộ cho mã gốc của sàn: có dòng ghép thì dùng đúng; chưa có thì suy theo chữ như trước (ghepDuoc=false)
 * để người dùng biết cần thêm dòng ghép. Trống thì "Đang xử lý" và coi là không cần ghép.
 */
export function ghepTrangThai(maSan: string | null | undefined, bang: ReadonlyMap<string, TrangThaiDonLe>): KetQuaGhep {
  const ma = (maSan ?? "").trim();
  if (!ma) return { trangThai: "Đang xử lý", ghepDuoc: true };
  const co = bang.get(chuanMaSan(ma));
  if (co) return { trangThai: co, ghepDuoc: true };
  return { trangThai: docTrangThai(ma), ghepDuoc: false };
}
