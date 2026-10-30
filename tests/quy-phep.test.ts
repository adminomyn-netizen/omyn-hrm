import { describe, expect, it } from "vitest";
import { namLamViecDen, phepNamDuoc } from "@/lib/quy-phep";

describe("quỹ phép theo thâm niên", () => {
  it("12 ngày cho người mới; đủ 5 năm +1; đủ 10 năm +2; thiếu ngày vào làm thì 12", () => {
    expect(phepNamDuoc("2026-03-01", 2026)).toBe(12);
    expect(phepNamDuoc("2021-03-01", 2026)).toBe(13);
    expect(phepNamDuoc("2016-01-10", 2026)).toBe(14);
    expect(phepNamDuoc(null, 2026)).toBe(12);
    expect(phepNamDuoc("hỏng", 2026)).toBe(12);
  });
  it("số năm làm việc tính tới cuối năm, không âm", () => {
    expect(namLamViecDen("2021-06-01", 2026)).toBe(5);
    expect(namLamViecDen("2030-06-01", 2026)).toBe(0);
  });
});
