import { describe, expect, it } from "vitest";
import { chuanMaSan, dungBangGhep, ghepTrangThai, type DongGhep } from "@/lib/trang-thai-san";
import { docBangDonLe } from "@/lib/nhap-don-le";

const GHEP: DongGhep[] = [
  { nen_tang: "Shopee", ma_san: "COMPLETED", trang_thai_noi_bo: "Đã giao", hoat_dong: true },
  { nen_tang: "Shopee", ma_san: "READY_TO_SHIP", trang_thai_noi_bo: "Đang xử lý", hoat_dong: true },
  { nen_tang: "Shopee", ma_san: "TO_RETURN", trang_thai_noi_bo: "Hoàn trả", hoat_dong: true },
  { nen_tang: "Shopee", ma_san: "CANCELLED", trang_thai_noi_bo: "Huỷ", hoat_dong: false },
  { nen_tang: "TikTok Shop", ma_san: "DELIVERED", trang_thai_noi_bo: "Đã giao", hoat_dong: true },
  { nen_tang: "Shopee", ma_san: "LAM", trang_thai_noi_bo: "Không có", hoat_dong: true },
];

describe("chuanMaSan", () => {
  it("không phân biệt hoa thường, gạch dưới, khoảng trắng", () => {
    expect(chuanMaSan(" Ready_To_Ship ")).toBe("ready to ship");
    expect(chuanMaSan("READY TO  SHIP")).toBe("ready to ship");
  });
});

describe("ghepTrangThai", () => {
  const bang = dungBangGhep(GHEP, "Shopee");
  it("có dòng ghép thì dùng đúng, kể cả viết khác hoa thường", () => {
    expect(ghepTrangThai("completed", bang)).toEqual({ trangThai: "Đã giao", ghepDuoc: true });
    expect(ghepTrangThai("Ready To Ship", bang)).toEqual({ trangThai: "Đang xử lý", ghepDuoc: true });
    expect(ghepTrangThai("TO_RETURN", bang).trangThai).toBe("Hoàn trả");
  });
  it("chỉ lấy dòng đúng kênh, đang dùng và trạng thái nội bộ hợp lệ", () => {
    expect(bang.has("delivered")).toBe(false);
    expect(bang.has("cancelled")).toBe(false);
    expect(bang.has("lam")).toBe(false);
    expect(dungBangGhep(GHEP, "TikTok Shop").get("delivered")).toBe("Đã giao");
  });
  it("chưa ghép thì suy theo chữ và báo chưa ghép được", () => {
    expect(ghepTrangThai("CANCELLED", bang)).toEqual({ trangThai: "Huỷ", ghepDuoc: false });
    expect(ghepTrangThai("Đã hủy", bang).ghepDuoc).toBe(false);
  });
  it("trống thì Đang xử lý và không cần ghép", () => {
    expect(ghepTrangThai(null, bang)).toEqual({ trangThai: "Đang xử lý", ghepDuoc: true });
    expect(ghepTrangThai("  ", bang).ghepDuoc).toBe(true);
  });
});

describe("docBangDonLe giữ trạng thái gốc", () => {
  it("lưu chữ gốc của cột trạng thái; không có cột thì null", () => {
    const co = docBangDonLe("Mã đơn\tNgày\tTiền khách trả\tTrạng thái\nA1\t01/11/2026\t100000\tREADY_TO_SHIP\nA2\t02/11/2026\t50000\t");
    expect(co.don.map((d) => d.trangThaiSan)).toEqual(["READY_TO_SHIP", null]);
    const khong = docBangDonLe("Mã đơn\tNgày\tTiền khách trả\nA1\t01/11/2026\t100000");
    expect(khong.don[0].trangThaiSan).toBeNull();
  });
});
