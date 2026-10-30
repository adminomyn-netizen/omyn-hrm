import { describe, expect, it } from "vitest";
import { lenKeHoachDo } from "@/lib/phe-duyet-ap-dung";

const LE = new Set<string>();
describe("đổ phiếu đã duyệt vào hồ sơ", () => {
  it("làm thêm giờ → các đoạn tăng ca theo ngày", () => {
    const v = lenKeHoachDo("xac-nhan-lam-them-gio", { tu: "2026-10-30T18:00", den: "2026-10-30T20:30", ly_do: "chốt đơn" }, LE);
    expect(v).toEqual([{ kieu: "tang_ca", doan: [{ ngay: "2026-10-30", soGio: 2.5, loaiNgay: "Ngày thường" }], lyDo: "chốt đơn" }]);
    expect(lenKeHoachDo("xac-nhan-lam-them-gio", { tu: "x", den: "y" }, LE)).toEqual([]);
  });
  it("sai sót chấm công → sửa giờ vào hoặc giờ ra đúng ngày", () => {
    expect(lenKeHoachDo("dieu-chinh-sai-sot-cham-cong", { loai_cham_cong: "Thời gian check in", ngay_sua: "2026-10-29", gio_dung: "2026-10-29T08:05" }, LE)).toEqual([{ kieu: "cham_cong", ngay: "2026-10-29", cot: "gio_vao", gio: "08:05" }]);
    expect(lenKeHoachDo("dieu-chinh-sai-sot-cham-cong", { loai_cham_cong: "Thời gian check out", ngay_sua: "2026-10-29", gio_dung: "2026-10-29T17:40" }, LE)[0]).toMatchObject({ cot: "gio_ra", gio: "17:40" });
    expect(lenKeHoachDo("dieu-chinh-sai-sot-cham-cong", { loai_cham_cong: "Thời gian check in", loai_loi: "Đi muộn" }, LE)).toEqual([]);
  });
  it("điều chỉnh nhân sự: lương mới, luân chuyển, thăng chức", () => {
    expect(lenKeHoachDo("de-xuat-dieu-chinh-nhan-su", { loai: "Điều chỉnh lương", luong_moi: 15000000 }, LE)).toEqual([{ kieu: "luong", luongMoi: 15000000 }]);
    expect(lenKeHoachDo("de-xuat-dieu-chinh-nhan-su", { loai: "Luân chuyển", phong_ban_moi: "Phòng Kế Toán", chuc_vu_moi: "Kế toán" }, LE)).toEqual([{ kieu: "luan_chuyen", phongBan: "Phòng Kế Toán", chucVu: "Kế toán" }]);
    expect(lenKeHoachDo("de-xuat-dieu-chinh-nhan-su", { loai: "Thăng chức", chuc_vu_moi: "Trưởng phòng" }, LE)).toEqual([{ kieu: "luan_chuyen", phongBan: null, chucVu: "Trưởng phòng" }]);
  });
  it("phiếu khác không có việc", () => { expect(lenKeHoachDo("de-nghi-thanh-toan", {}, LE)).toEqual([]); });
});
