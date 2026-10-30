import { describe, expect, it } from "vitest";
import { danhGiaCanNhac, kyCanBaoXepHang, nhanHan, offerCanNhac, phutToiPhongVan, soNgayTu, tinXepHang, tomTatHcns } from "@/lib/nhac-hr";

describe("danhGiaCanNhac", () => {
  it("vào làm 01/10: mốc 30 ngày = 31/10, nhắc khi còn 3 ngày, đúng hạn, trễ 2 ngày", () => {
    expect(danhGiaCanNhac("2026-10-01", "2026-10-28", [])).toEqual([{ moc: "30 ngày", han: "2026-10-31", con: 3 }]);
    expect(danhGiaCanNhac("2026-10-01", "2026-10-31", [])[0]).toMatchObject({ moc: "30 ngày", con: 0 });
    expect(danhGiaCanNhac("2026-10-01", "2026-11-02", [])[0]).toMatchObject({ con: -2 });
  });
  it("không nhắc ngày lẻ, hoặc mốc đã có đánh giá", () => {
    expect(danhGiaCanNhac("2026-10-01", "2026-10-29", [])).toEqual([]);
    expect(danhGiaCanNhac("2026-10-01", "2026-10-31", ["30 ngày"])).toEqual([]);
  });
  it("mốc 60 ngày theo số ngày thử việc của hồ sơ", () => {
    expect(danhGiaCanNhac("2026-10-01", "2026-11-27", [], 60)[0]).toMatchObject({ moc: "60 ngày", han: "2026-11-30", con: 3 });
    expect(danhGiaCanNhac("2026-10-01", "2026-12-05", [], 90)).toEqual([]);
  });
});

describe("offer, phỏng vấn, tóm tắt, xếp hạng", () => {
  it("offer: chỉ trạng thái đang chờ trả lời và đúng ngày nhắc", () => {
    expect(offerCanNhac("2026-11-02", "Đã gửi", "2026-10-30")).toBe(3);
    expect(offerCanNhac("2026-11-02", "Thương lượng", "2026-10-30")).toBe(3);
    expect(offerCanNhac("2026-11-02", "Đồng ý", "2026-10-30")).toBeNull();
    expect(offerCanNhac("2026-11-02", "Soạn", "2026-10-30")).toBeNull();
    expect(offerCanNhac("2026-11-01", "Đã gửi", "2026-10-30")).toBeNull();
    expect(offerCanNhac(null, "Đã gửi", "2026-10-30")).toBeNull();
    expect(offerCanNhac("2026-10-28", "Đã gửi", "2026-10-30")).toBe(-2);
  });
  it("phỏng vấn: nhắc trong 65 phút trước giờ, không nhắc buổi đã qua hoặc còn xa", () => {
    const now = Date.parse("2026-10-30T09:00:00Z");
    expect(phutToiPhongVan(now + 60 * 60_000, now)).toBe(60);
    expect(phutToiPhongVan(now + 65 * 60_000, now)).toBe(65);
    expect(phutToiPhongVan(now + 66 * 60_000, now)).toBeNull();
    expect(phutToiPhongVan(now, now)).toBeNull();
    expect(phutToiPhongVan(now - 60_000, now)).toBeNull();
  });
  it("tóm tắt HCNS: gom các việc có số, không có việc thì không gửi, trỏ vào việc gấp nhất", () => {
    expect(tomTatHcns({ phongVanHomNay: 0, offerCanNhac: 0, danhGiaCanNhac: 0, deXuatCho: 0 })).toBeNull();
    const t = tomTatHcns({ phongVanHomNay: 2, offerCanNhac: 0, danhGiaCanNhac: 1, deXuatCho: 3 })!;
    expect(t.noiDung).toBe("2 buổi phỏng vấn hôm nay · 1 đánh giá thử việc đến hạn · 3 đề xuất chờ duyệt");
    expect(t.url).toBe("/hr/onboarding");
  });
  it("nhãn hạn và khoảng ngày", () => {
    expect(nhanHan(3)).toBe("còn 3 ngày"); expect(nhanHan(0)).toBe("đến hạn hôm nay"); expect(nhanHan(-2)).toBe("trễ 2 ngày");
    expect(soNgayTu("2026-10-30", "2026-11-02")).toBe(3);
  });
  it("kỳ báo xếp hạng: ngày thường chỉ ngày trước; ngày 1 thêm tháng; đầu quý thêm quý", () => {
    expect(kyCanBaoXepHang("2026-10-30", "2026-10-29")).toEqual(["2026-10-29"]);
    expect(kyCanBaoXepHang("2026-11-01", "2026-10-31")).toEqual(["2026-10-31", "2026-10"]);
    expect(kyCanBaoXepHang("2027-01-01", "2026-12-31")).toEqual(["2026-12-31", "2026-12", "2026-Q4"]);
    expect(kyCanBaoXepHang("2026-10-01", "2026-09-30")).toEqual(["2026-09-30", "2026-09", "2026-Q3"]);
  });
  it("tin xếp hạng: nêu hạng cá nhân, phòng, và người dẫn đầu khi không nằm trong top 3", () => {
    const t = tinXepHang({ kyNhan: "Tháng 10/2026", kyMa: "2026-10", hangCaNhan: 5, tongNguoi: 40, diem: 87.25, phong: { ten: "Kinh doanh", hang: 2, tong: 4 }, top: "An" });
    expect(t.khung).toBe("xh_2026-10");
    expect(t.noiDung).toContain("hạng 5/40");
    expect(t.noiDung).toContain("Phòng Kinh doanh hạng 2/4");
    expect(t.noiDung).toContain("Dẫn đầu: An");
    expect(tinXepHang({ kyNhan: "x", kyMa: "k", hangCaNhan: 2, tongNguoi: 9, diem: 100, top: "An" }).noiDung).not.toContain("Dẫn đầu");
  });
});
