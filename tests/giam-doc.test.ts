import { describe, expect, it } from "vitest";
import { laGiamDoc } from "@/lib/chuc-danh";
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
});
