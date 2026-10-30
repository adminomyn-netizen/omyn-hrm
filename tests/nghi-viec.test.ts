import { describe, expect, it } from "vitest";
import { CHECKLIST_MAU, baoTruocThieu, dieuKienDongHoSo, ngayBaoTruoc } from "@/lib/nghi-viec";

const tatCa = (xong: boolean) => CHECKLIST_MAU.map((m) => ({ ...m, xong }));
const PV = { pvTrangThai: "Đã phỏng vấn", pvNgay: "2026-11-10", pvLyDoThat: "Lương" };

describe("đóng hồ sơ nghỉ việc", () => {
  it("checklist mẫu có đủ bàn giao công việc, tài sản, nghĩa vụ tài chính, chốt công-lương-BHXH, chấm dứt hợp đồng", () => {
    expect([...new Set(CHECKLIST_MAU.map((m) => m.nhom))]).toEqual(["Bàn giao công việc", "Bàn giao tài sản", "Bàn giao nghĩa vụ tài chính", "Chốt công", "Chốt lương", "Chốt BHXH", "Chấm dứt hợp đồng"]);
    expect(CHECKLIST_MAU.every((m) => m.batBuoc)).toBe(true);
  });
  it("đủ mọi thứ thì đóng được", () => { expect(dieuKienDongHoSo(PV, tatCa(true), 0)).toEqual([]); });
  it("thiếu mục bắt buộc → liệt kê từng mục; mục không bắt buộc không chặn", () => {
    const muc = tatCa(true); muc[0].xong = false; muc[1] = { ...muc[1], xong: false, batBuoc: false };
    expect(dieuKienDongHoSo(PV, muc, 0)).toEqual([`Bàn giao công việc: ${CHECKLIST_MAU[0].ten}`]);
  });
  it("còn tài sản đang giữ vẫn chặn dù đã tick; chưa phỏng vấn thôi việc chặn; từ chối phỏng vấn thì qua", () => {
    expect(dieuKienDongHoSo(PV, tatCa(true), 2)).toEqual(["Bàn giao tài sản: còn 2 tài sản đang giữ, chưa trả"]);
    expect(dieuKienDongHoSo({ pvTrangThai: "Chưa phỏng vấn", pvNgay: null, pvLyDoThat: null }, tatCa(true), 0)[0]).toMatch(/Phỏng vấn thôi việc: chưa thực hiện/);
    expect(dieuKienDongHoSo({ pvTrangThai: "Từ chối phỏng vấn", pvNgay: null, pvLyDoThat: null }, tatCa(true), 0)).toEqual([]);
    expect(dieuKienDongHoSo({ pvTrangThai: "Đã phỏng vấn", pvNgay: "2026-11-10", pvLyDoThat: " " }, tatCa(true), 0)[0]).toMatch(/thiếu ngày phỏng vấn hoặc lý do thật/);
  });
});

describe("báo trước", () => {
  it("45 ngày không xác định thời hạn; xác định thời hạn 30 hoặc 3 ngày nếu dưới 12 tháng; thử việc không áp dụng", () => {
    expect(ngayBaoTruoc("Không xác định thời hạn")).toBe(45);
    expect(ngayBaoTruoc("Xác định thời hạn", "2026-01-01", "2027-06-30")).toBe(30);
    expect(ngayBaoTruoc("Xác định thời hạn", "2026-01-01", "2026-09-30")).toBe(3);
    expect(ngayBaoTruoc("Thử việc")).toBeNull();
    expect(ngayBaoTruoc(null)).toBeNull();
  });
  it("thiếu bao nhiêu ngày", () => {
    expect(baoTruocThieu("2026-11-01", "2026-11-20", 30)).toBe(11);
    expect(baoTruocThieu("2026-11-01", "2026-12-16", 45)).toBeNull();
    expect(baoTruocThieu("2026-11-01", "2026-11-02", null)).toBeNull();
  });
});
