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

describe("menu Nhân sự 10 nhóm", () => {
  it("có đúng 10 nhóm theo mẫu, mỗi mục menu chỉ ở một nhóm", async () => {
    const { chiaNhomNhanSu, NHOM_NHAN_SU, menuChinh, locMenuTheoVaiTro } = await import("@/lib/nav");
    expect(NHOM_NHAN_SU).toHaveLength(10);
    const { nhom, trangChu } = chiaNhomNhanSu(locMenuTheoVaiTro("admin"));
    expect(nhom.map((g) => g.so)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(trangChu?.duong_dan).toBe("/trang-chu-nhan-su");
    const duong = nhom.flatMap((g) => g.muc.map((m) => m.duong_dan));
    expect(new Set(duong).size).toBe(duong.length);
    expect(menuChinh.find((m) => m.duong_dan === "/danh-gia")?.an).toBe(true);
  });
});
