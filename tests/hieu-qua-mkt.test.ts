import { describe, expect, it } from "vitest";
import { tinhHieuQuaMkt } from "@/lib/hieu-qua-mkt";

describe("hiệu quả marketing", () => {
  it("tổng chi gồm Meta, TikTok, Shopee, KOL; tỷ lệ chi phí so doanh thu", () => {
    const r = tinhHieuQuaMkt({ chiMeta: 10_000_000, chiTikTok: 5_000_000, chiShopee: 3_000_000, chiKol: 2_000_000, nganSachDuyet: 25_000_000, doanhThu: 200_000_000 });
    expect(r.tongChi).toBe(20_000_000);
    expect(r.tiLeChiPhi).toBe(10);
    expect(r.vuotNganSach).toBe(false);
  });
  it("vượt ngân sách khi tổng chi lớn hơn ngân sách đã duyệt; chưa có ngân sách thì không báo", () => {
    expect(tinhHieuQuaMkt({ chiMeta: 30, chiTikTok: 0, chiShopee: 0, chiKol: 0, nganSachDuyet: 20, doanhThu: 100 }).vuotNganSach).toBe(true);
    expect(tinhHieuQuaMkt({ chiMeta: 30, chiTikTok: 0, chiShopee: 0, chiKol: 0, nganSachDuyet: 0, doanhThu: 100 }).vuotNganSach).toBe(false);
  });
  it("doanh thu bằng 0 thì không tính tỷ lệ", () => {
    expect(tinhHieuQuaMkt({ chiMeta: 5, chiTikTok: 0, chiShopee: 0, chiKol: 0, nganSachDuyet: 0, doanhThu: 0 }).tiLeChiPhi).toBeNull();
  });
});
