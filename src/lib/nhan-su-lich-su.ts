import "server-only";
import { dbHr } from "@/lib/hr-db";

export type NguoiSua = { id: string; hoTen: string };

/** Lịch sử thay đổi dùng chung cho mảng Nhân sự: ai, lúc nào, sửa gì (trước/sau). Không bao giờ làm hỏng thao tác chính. */
export async function ghiLichSuNhanSu(v: { nhanVienId: string | null; doiTuong: string; doiTuongId: string | null; hanhDong: "Thêm" | "Sửa" | "Xoá"; moTa: string; truoc?: unknown; sau?: unknown; nguoi: NguoiSua }) {
  try {
    await dbHr().from("nhan_su_lich_su").insert({
      nhan_vien_id: v.nhanVienId, doi_tuong: v.doiTuong, doi_tuong_id: v.doiTuongId, hanh_dong: v.hanhDong, mo_ta: v.moTa.slice(0, 500),
      truoc: v.truoc ?? null, sau: v.sau ?? null, user_id: v.nguoi.id, ten_nguoi: v.nguoi.hoTen,
    });
  } catch (e) {
    console.error("[nhan_su_lich_su] lỗi", e);
  }
}

/** Các cột thật sự đổi giữa hai bản ghi, để mô tả "sửa gì". */
export function cotDoi(truoc: Record<string, unknown> | null, sau: Record<string, unknown>): string[] {
  return Object.keys(sau).filter((k) => JSON.stringify(truoc?.[k] ?? null) !== JSON.stringify(sau[k] ?? null));
}
