import { describe, expect, it } from "vitest";
import { khongCanChamCong, laChucDanhNhayCam, laGiamDoc } from "@/lib/chuc-danh";
import { HR_MUC } from "@/lib/hr-module";

describe("quyền nhập mức thưởng", () => {
  it("chỉ Tổng giám đốc/Giám đốc, không tính Phó giám đốc hay chức danh khác", () => {
    expect(laGiamDoc("Giám đốc")).toBe(true);
    expect(laGiamDoc("  tổng giám đốc ")).toBe(true);
    expect(laGiamDoc("Phó giám đốc")).toBe(false);
    expect(laGiamDoc("Kế toán trưởng")).toBe(false);
    expect(laGiamDoc(null)).toBe(false);
  });
  it("chỉ mục thưởng thi đua bị giới hạn cho giám đốc", () => {
    expect(HR_MUC.filter((m) => m.chiGiamDocSua).map((m) => m.ma)).toEqual(["kpi-thuong"]);
  });
  it("Phó giám đốc vẫn là chức danh nhạy cảm (chỉ Quản trị gắn tài khoản) như Phó tổng giám đốc trước đây", () => {
    expect(laChucDanhNhayCam("Phó giám đốc")).toBe(true);
    expect(laChucDanhNhayCam("Giám đốc")).toBe(false);
  });
  it("cờ quyền giám đốc theo từng người: Phó giám đốc có cờ vẫn miễn chấm công và sửa KPI, không có cờ thì không", () => {
    expect(laGiamDoc("Phó giám đốc", true)).toBe(true);
    expect(laGiamDoc("Phó giám đốc", false)).toBe(false);
    expect(laGiamDoc("Phó giám đốc")).toBe(false);
    expect(khongCanChamCong("nhan_vien", "Phó giám đốc", true)).toBe(true);
    expect(khongCanChamCong("nhan_vien", "Phó giám đốc", false)).toBe(false);
    expect(khongCanChamCong("nhan_vien", "Giám đốc", null)).toBe(true);
    expect(khongCanChamCong("nhan_vien", "Nhân viên", null)).toBe(false);
  });
});
