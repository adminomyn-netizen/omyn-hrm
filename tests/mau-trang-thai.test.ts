import { describe, expect, it } from "vitest";
import { BUOC_UNG_VIEN } from "@/lib/tuyen-dung";
import { SAC_BUOC_UNG_VIEN, sacTuTrangThai } from "@/lib/mau-trang-thai";

describe("màu trạng thái", () => {
  it("mỗi giai đoạn ứng viên có một sắc riêng, không trùng nhau", () => {
    const sac = BUOC_UNG_VIEN.map((b) => SAC_BUOC_UNG_VIEN[b]);
    expect(sac.every(Boolean)).toBe(true);
    expect(new Set(sac).size).toBe(BUOC_UNG_VIEN.length);
  });
  it("đoán sắc theo chữ trạng thái quen dùng", () => {
    expect(sacTuTrangThai("Đã duyệt")).toBe("la");
    expect(sacTuTrangThai("Chờ duyệt")).toBe("vang");
    expect(sacTuTrangThai("Từ chối")).toBe("do");
    expect(sacTuTrangThai("Đang đăng")).toBe("luc");
    expect(sacTuTrangThai("Đã gỡ")).toBe("xam");
    expect(sacTuTrangThai("Chữ lạ")).toBeNull();
  });
});
