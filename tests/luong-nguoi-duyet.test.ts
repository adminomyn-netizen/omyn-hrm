import { describe, expect, it } from "vitest";
import { buocKeTiep, duocDatKhauTru10, duocDuyetLuong, NGUOI_DUYET_LUONG } from "@/lib/luong/nguoi-duyet";

describe("người duyệt bảng lương", () => {
  it("chỉ chị Lâm và chị Linh được duyệt", () => {
    expect(new Set(Object.values(NGUOI_DUYET_LUONG))).toEqual(new Set(["chị Lâm", "chị Linh"]));
    for (const id of Object.keys(NGUOI_DUYET_LUONG)) expect(duocDuyetLuong(id)).toBe(true);
  });
  it("Phượng (người lập), anh Nam, người lạ, rỗng, tên đặc biệt đều không duyệt được", () => {
    expect(duocDuyetLuong("afa13a1f-035c-4dcc-ba20-9dd4c6161eee")).toBe(false);
    expect(duocDuyetLuong("03bedad0-7f28-428c-80bb-14216ba92f31")).toBe(false);
    expect(duocDuyetLuong("")).toBe(false);
    expect(duocDuyetLuong(null)).toBe(false);
    expect(duocDuyetLuong(undefined)).toBe(false);
    expect(duocDuyetLuong("toString")).toBe(false);
    expect(duocDuyetLuong("__proto__")).toBe(false);
  });
  it("kỳ đi mở → đã lập → đã duyệt → đã chi, không còn bước kiểm", () => {
    expect(buocKeTiep("mo")).toBe("da_lap");
    expect(buocKeTiep("da_lap")).toBe("da_duyet");
    expect(buocKeTiep("da_duyet")).toBe("da_chi");
    expect(buocKeTiep("da_chi")).toBeNull();
  });
  it("kỳ cũ còn kẹt ở đã kiểm vẫn đi tiếp sang duyệt", () => {
    expect(buocKeTiep("da_kiem")).toBe("da_duyet");
    expect(buocKeTiep("khong-co")).toBeNull();
  });
  it("chỉ chị Lâm/chị Linh bật tắt khấu trừ 10%, nhân sự (Phượng) và Kỹ thuật không", () => {
    for (const id of Object.keys(NGUOI_DUYET_LUONG)) expect(duocDatKhauTru10(id)).toBe(true);
    expect(duocDatKhauTru10("afa13a1f-035c-4dcc-ba20-9dd4c6161eee")).toBe(false);
    expect(duocDatKhauTru10("03bedad0-7f28-428c-80bb-14216ba92f31")).toBe(false);
  });
});
