import { describe, expect, it } from "vitest";
import { MANG, MANG_THEO_NHOM, maSoTuDuongDan, quyenSauChucVu, tuTruongBoPhan } from "../src/lib/quyen-mang";

describe("quyền màn nghiệp vụ theo khối", () => {
  it("sáu mảng, tên nhóm menu ra đúng mã mảng", () => {
    expect(MANG).toHaveLength(6);
    expect(MANG_THEO_NHOM["Tài chính & Kho"]).toBe("tai-chinh-kho");
    expect(MANG_THEO_NHOM["Số liệu báo cáo HR"]).toBeUndefined();
  });
  it("thực tập sinh bị hạ xuống chỉ xem, người khác giữ nguyên", () => {
    expect(quyenSauChucVu("nhap", "Thực tập sinh")).toBe("xem");
    expect(quyenSauChucVu("nhap", "Nhân viên")).toBe("nhap");
    expect(quyenSauChucVu("xem", "Trưởng bộ phận")).toBe("xem");
    expect(quyenSauChucVu(undefined, "Nhân viên")).toBeNull();
  });
  it("xoá bản ghi: từ Trưởng bộ phận trở lên, Leader và nhân viên thì không", () => {
    expect(tuTruongBoPhan("Trưởng bộ phận")).toBe(true);
    expect(tuTruongBoPhan("Giám đốc")).toBe(true);
    expect(tuTruongBoPhan("Leader")).toBe(false);
    expect(tuTruongBoPhan(null)).toBe(false);
  });
  it("đường dẫn /hr/<mã> ra mã sổ, trang khác thì không", () => {
    expect(maSoTuDuongDan("/hr/nhap-xuat-kho")).toBe("nhap-xuat-kho");
    expect(maSoTuDuongDan("/ton-kho")).toBeNull();
  });
});
