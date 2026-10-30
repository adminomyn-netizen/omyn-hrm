import { describe, expect, it } from "vitest";
import { duongDanDangChon } from "@/lib/nav";

describe("mục menu đang chọn", () => {
  const menu = [{ duong_dan: "/ky-thuat" }, { duong_dan: "/ky-thuat/luong-phieu" }, { duong_dan: "/phe-duyet" }];
  it("chỉ chọn mục khớp dài nhất, không làm sáng mục cha", () => {
    expect(duongDanDangChon("/ky-thuat/luong-phieu", menu)).toBe("/ky-thuat/luong-phieu");
    expect(duongDanDangChon("/ky-thuat/luong-phieu/x", menu)).toBe("/ky-thuat/luong-phieu");
    expect(duongDanDangChon("/ky-thuat", menu)).toBe("/ky-thuat");
    expect(duongDanDangChon("/phe-duyet/abc", menu)).toBe("/phe-duyet");
  });
  it("không khớp tiền tố chữ cái và không có mục nào thì null", () => {
    expect(duongDanDangChon("/ky-thuatx", menu)).toBeNull();
    expect(duongDanDangChon("/khac", menu)).toBeNull();
  });
});
