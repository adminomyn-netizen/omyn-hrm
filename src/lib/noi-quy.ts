import { DUOI_TEP, kiemTep, duoiTep } from "@/lib/tep-dinh-kem";

/** Nội quy & chính sách: các nhóm tài liệu chung. Thứ tự hiển thị theo mảng này. */
export const LOAI_NOI_QUY = [
  { ma: "noi_quy", ten: "Nội quy lao động" },
  { ma: "thuong_phat", ten: "Quy chế thưởng phạt" },
  { ma: "hop_dong_mau", ten: "Mẫu hợp đồng (thử việc, hợp đồng lao động)" },
  { ma: "khac", ten: "Tài liệu khác" },
] as const;
export type LoaiNoiQuy = (typeof LOAI_NOI_QUY)[number]["ma"];

export const laLoaiNoiQuy = (v: string): v is LoaiNoiQuy => LOAI_NOI_QUY.some((l) => l.ma === v);
export const tenLoaiNoiQuy = (v: string) => LOAI_NOI_QUY.find((l) => l.ma === v)?.ten ?? v;

/** Chỉ Quản trị và Kỹ thuật tải lên, thay, xoá. Người khác chỉ xem và tải. */
export const duocQuanLyNoiQuy = (vaiTro: string | null | undefined) => vaiTro === "admin" || vaiTro === "ky_thuat";

/** Đường dẫn trong kho: noi-quy/<uuid>.<đuôi>. Đuôi lấy từ tên tệp gốc. */
export const duongDanNoiQuy = (ma: string, tenTep: string) => `noi-quy/${ma}.${duoiTep(tenTep)}`;
export const duongDanNoiQuyHopLe = (duongDan: string) =>
  new RegExp(`^noi-quy/[0-9a-f-]{36}\\.(${DUOI_TEP.join("|")})$`).test(duongDan);

/** Kiểm tệp trước khi nhận: đuôi và dung lượng dùng chung với tệp đính kèm HR (tối đa 25 MB). */
export const kiemTepNoiQuy = (tenTep: string, kichThuoc: number) => kiemTep(tenTep, kichThuoc);

/** Ghi chú và tên hiển thị: bỏ khoảng trắng thừa, cắt theo giới hạn cột. */
export const chuanHoaChu = (s: string, toiDa: number) => s.replace(/\s+/g, " ").trim().slice(0, toiDa);
