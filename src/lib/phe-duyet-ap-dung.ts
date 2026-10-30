/** Phiếu phê duyệt đã duyệt xong thì tự đổ vào hồ sơ/chấm công/lương (không nhập hai lần). Phần này chỉ LẬP KẾ HOẠCH thuần từ dữ liệu phiếu; phe-duyet-ap-dung-data.ts thực hiện. */
import { tachTangCa, type DoanTangCa } from "./tang-ca";
import type { DuLieu } from "./phe-duyet";
import { NHOM_BAN_GIAO } from "./nghi-viec";

export type ViecDo =
  | { kieu: "tang_ca"; doan: DoanTangCa[]; lyDo: string }
  | { kieu: "cham_cong"; ngay: string; cot: "gio_vao" | "gio_ra"; gio: string }
  | { kieu: "luong"; luongMoi: number }
  | { kieu: "luan_chuyen"; phongBan: string | null; chucVu: string | null }
  | { kieu: "nghi_viec"; loai: "Đúng hạn" | "Trước hạn"; ngayNop: string; ngayCuoi: string; lyDo: string }
  | { kieu: "ban_giao"; nhom: string };

const s = (v: unknown) => (typeof v === "string" ? v : "");
const NGAY_GIO = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;

/** Việc cần làm khi một loại phiếu được duyệt xong. Loại phiếu khác (hoặc dữ liệu thiếu) → không có việc, không lỗi. */
export function lenKeHoachDo(maPhieu: string, du: DuLieu, ngayLe: ReadonlySet<string>): ViecDo[] {
  switch (maPhieu) {
    case "xac-nhan-lam-them-gio": {
      const doan = tachTangCa(s(du.tu), s(du.den), ngayLe);
      return doan.length ? [{ kieu: "tang_ca", doan, lyDo: s(du.ly_do).slice(0, 300) }] : [];
    }
    case "dieu-chinh-sai-sot-cham-cong": {
      const ngay = s(du.ngay_sua), m = NGAY_GIO.exec(s(du.gio_dung));
      if (!ngay || !m) return [];
      return [{ kieu: "cham_cong", ngay, cot: s(du.loai_cham_cong) === "Thời gian check out" ? "gio_ra" : "gio_vao", gio: m[2] }];
    }
    case "de-xuat-dieu-chinh-nhan-su": {
      const loai = s(du.loai);
      if (loai === "Điều chỉnh lương") return typeof du.luong_moi === "number" ? [{ kieu: "luong", luongMoi: du.luong_moi }] : [];
      if (loai === "Luân chuyển") return [{ kieu: "luan_chuyen", phongBan: s(du.phong_ban_moi) || null, chucVu: s(du.chuc_vu_moi) || null }];
      if (loai === "Thăng chức") return [{ kieu: "luan_chuyen", phongBan: null, chucVu: s(du.chuc_vu_moi) || null }];
      return [];
    }
    case "xin-nghi-viec": {
      const ngayCuoi = s(du.ngay_lam_viec_cuoi), ngayNop = s(du.thoi_gian_lam_don);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayCuoi) || !/^\d{4}-\d{2}-\d{2}$/.test(ngayNop)) return [];
      return [{ kieu: "nghi_viec", loai: s(du.loai_nghi_viec) === "Trước hạn" ? "Trước hạn" : "Đúng hạn", ngayNop, ngayCuoi, lyDo: [s(du.ly_do), s(du.ly_do_khac)].filter(Boolean).join(" — ").slice(0, 400) }];
    }
    case "ban-giao-cong-viec": return [{ kieu: "ban_giao", nhom: NHOM_BAN_GIAO.congViec }];
    case "ban-giao-tai-san": return [{ kieu: "ban_giao", nhom: NHOM_BAN_GIAO.taiSan }];
    case "ban-giao-nghia-vu-tai-chinh": return [{ kieu: "ban_giao", nhom: NHOM_BAN_GIAO.taiChinh }];
    default:
      return [];
  }
}
