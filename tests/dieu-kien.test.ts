import { describe, expect, it } from "vitest";
import { danhGiaDieuKien, docDieuKien, moTaDieuKien, type DieuKien } from "@/lib/dieu-kien";
import { hangApDung, type HangLuong } from "@/lib/phe-duyet";

const hang = (buoc: number, dieuKien: DieuKien | null): HangLuong => ({ buoc, tenBuoc: null, kieu: "AND", loaiNguoi: "Quản lý trực tiếp", chucDanh: null, nhanVienId: null, dieuKienTruong: null, dieuKienGiaTri: null, dieuKien });

describe("điều kiện nhánh luồng duyệt", () => {
  const avi: DieuKien = { t: "don_vi", s: "la", v: ["AVI"] };
  const lon: DieuKien = { t: "tien", s: ">=", v: [10_000_000] };
  it("so sánh chữ và số tiền, ô trống thì sai", () => {
    expect(danhGiaDieuKien(avi, { don_vi: "AVI" })).toBe(true);
    expect(danhGiaDieuKien(avi, { don_vi: "ADL" })).toBe(false);
    expect(danhGiaDieuKien(avi, {})).toBe(false);
    expect(danhGiaDieuKien(lon, { tien: 10_000_000 })).toBe(true);
    expect(danhGiaDieuKien(lon, { tien: 9_999_999 })).toBe(false);
    expect(danhGiaDieuKien({ t: "tien", s: ">", v: [5] }, { tien: 5 })).toBe(false);
    expect(danhGiaDieuKien({ t: "tien", s: "<=", v: [5] }, { tien: 5 })).toBe(true);
    expect(danhGiaDieuKien(lon, { tien: "10000000" })).toBe(false);
  });
  it("hoặc / và / không", () => {
    const tm: DieuKien = { or: [{ t: "ht", s: "la", v: ["Tiền mặt"] }, { t: "ht", s: "la", v: ["Tiền mặt quỹ"] }] };
    expect(danhGiaDieuKien(tm, { ht: "Tiền mặt quỹ" })).toBe(true);
    expect(danhGiaDieuKien(tm, { ht: "Chuyển khoản" })).toBe(false);
    expect(danhGiaDieuKien({ khong: tm }, { ht: "Chuyển khoản" })).toBe(true);
    expect(danhGiaDieuKien({ and: [avi, lon] }, { don_vi: "AVI", tien: 20_000_000 })).toBe(true);
    expect(danhGiaDieuKien({ and: [avi, lon] }, { don_vi: "AVI", tien: 1 })).toBe(false);
    expect(danhGiaDieuKien(null, {})).toBe(true);
  });
  it("nhánh còn lại = không rơi vào nhánh nào đứng trước; chỉ hàng đúng nhánh được áp dụng, đúng thứ tự", () => {
    const luong = [
      hang(1, { and: [avi, lon] }), hang(2, { and: [avi, lon] }),
      hang(1, { and: [avi, { khong: lon }] }),
      hang(1, { and: [{ khong: avi }] }),
      hang(3, null),
    ];
    expect(hangApDung(luong, { don_vi: "AVI", tien: 20_000_000 }).map((h) => h.buoc)).toEqual([1, 2, 3]);
    expect(hangApDung(luong, { don_vi: "AVI", tien: 1 }).map((h) => h.buoc)).toEqual([1, 3]);
    expect(hangApDung(luong, { don_vi: "ADL", tien: 1 }).map((h) => h.buoc)).toEqual([1, 3]);
    expect(hangApDung(luong, { don_vi: "AVI", tien: 20_000_000 })).toHaveLength(3);
  });
  it("đọc từ DB: sai dạng thì bỏ, đúng dạng giữ; mô tả tiếng Việt", () => {
    expect(docDieuKien("x")).toBeNull();
    expect(docDieuKien({ t: "a", s: "??", v: [] })).toBeNull();
    expect(docDieuKien({ and: [avi, { khong: lon }] })).toEqual({ and: [avi, { khong: lon }] });
    expect(moTaDieuKien({ and: [avi, lon] }, (m) => ({ don_vi: "Đơn vị", tien: "Số tiền" })[m] ?? m)).toBe("Đơn vị là AVI và Số tiền từ 10.000.000 đ");
  });
});

import { khoaDacBiet, KHOA_CAP_NGUOI_NOP, KHOA_CHUC_DANH_NGUOI_NOP, KHOA_SO_NGAY_NGHI } from "@/lib/dieu-kien";

describe("khoá đặc biệt lấy từ người nộp và phiếu", () => {
  const ds = [
    { id: "a", quanLyId: null }, { id: "b", quanLyId: "a" }, { id: "c", quanLyId: "b" },
  ];
  it("cấp trong chuỗi quản lý: 0 là cao nhất", () => {
    expect(khoaDacBiet({}, { id: "a", chucDanh: "Giám đốc", quanLyId: null }, ds, "")[KHOA_CAP_NGUOI_NOP]).toBe(0);
    expect(khoaDacBiet({}, { id: "c", chucDanh: "Nhân viên", quanLyId: "b" }, ds, "")[KHOA_CAP_NGUOI_NOP]).toBe(2);
    // vòng lặp quản lý không làm treo
    expect(khoaDacBiet({}, { id: "x", chucDanh: null, quanLyId: "y" }, [{ id: "x", quanLyId: "y" }, { id: "y", quanLyId: "x" }], "")[KHOA_CAP_NGUOI_NOP]).toBeLessThanOrEqual(2);
  });
  it("chức danh người nộp không phân biệt hoa thường; số ngày nghỉ tính cả ngày đầu và cuối", () => {
    const k = khoaDacBiet({ nghi_tu: "2026-11-02T08:00", nghi_den: "2026-11-04T17:00" }, { id: "c", chucDanh: "Quản lý chi nhánh Vinh", quanLyId: null }, ds, "Kinh doanh");
    expect(k[KHOA_SO_NGAY_NGHI]).toBe(3);
    expect(danhGiaDieuKien({ t: KHOA_CHUC_DANH_NGUOI_NOP, s: "la", v: ["quản lý chi nhánh vinh"] }, k)).toBe(true);
    expect(danhGiaDieuKien({ t: KHOA_SO_NGAY_NGHI, s: ">=", v: [3] }, k)).toBe(true);
    expect(khoaDacBiet({ nghi_tu: "2026-11-02", nghi_den: "2026-11-02" }, null, ds, "")[KHOA_SO_NGAY_NGHI]).toBe(1);
    expect(KHOA_SO_NGAY_NGHI in khoaDacBiet({}, null, ds, "")).toBe(false);
  });
});
