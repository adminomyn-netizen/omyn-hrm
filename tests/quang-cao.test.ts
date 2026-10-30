import { describe, expect, it } from "vitest";
import { kyShopee, tiLeChiPhi, tongNenTang, chiTieuTheoNgay, gopTheo, khoangNgay, tongHop, trangThaiKhoa } from "@/lib/quang-cao";

const d = (chiTieu: number, hienThi: number, nhap: number, ketQua = 0) => ({ chiTieu, hienThi, nhap, ketQua });

describe("tongHop", () => {
  it("tỉ lệ tính lại từ tổng, không trung bình tỉ lệ từng ngày", () => {
    // ngày 1: chi 100k, 1000 hiện, 10 nhấp (CTR 1%); ngày 2: chi 900k, 100000 hiện, 2000 nhấp (CTR 2%). Trung bình tỉ lệ = 1,5% là SAI; đúng = 2010/101000.
    const t = tongHop([d(100, 1000, 10), d(900, 100000, 2000)]);
    expect(t).toMatchObject({ chiTieu: 1000, hienThi: 101000, nhap: 2010 });
    expect(t.ctr).toBe(1.99);
    expect(t.cpc).toBe(0.5);
    expect(t.cpm).toBe(9.9);
  });
  it("chia cho 0 cho null, không NaN/Infinity", () => {
    expect(tongHop([])).toEqual({ chiTieu: 0, hienThi: 0, nhap: 0, ketQua: 0, ctr: null, cpc: null, cpm: null, chiPhiKetQua: null });
    expect(tongHop([d(50, 0, 0)]).ctr).toBeNull();
    expect(tongHop([d(50, 1000, 0)]).ctr).toBe(0); // có hiển thị nhưng chưa ai nhấp = 0%, không phải "không có"
  });
  it("chi phí trên kết quả", () => {
    expect(tongHop([d(300, 1000, 10, 3)]).chiPhiKetQua).toBe(100);
  });
});

describe("gopTheo, chiTieuTheoNgay, khoảng ngày, khoá", () => {
  it("gộp theo khoá rồi tổng hợp từng khoá", () => {
    const m = gopTheo([{ k: "a", ...d(10, 100, 1) }, { k: "b", ...d(20, 100, 2) }, { k: "a", ...d(30, 100, 3) }], (x) => x.k);
    expect(m.get("a")).toMatchObject({ chiTieu: 40, hienThi: 200, nhap: 4 });
    expect(m.get("b")?.chiTieu).toBe(20);
  });
  it("chi tiêu theo ngày có ngày trống = 0", () => {
    expect(chiTieuTheoNgay([{ ngay: "2026-10-29", chiTieu: 5 }, { ngay: "2026-10-29", chiTieu: 1.5 }, { ngay: "2026-10-31", chiTieu: 2 }], "2026-10-29", "2026-10-31")).toEqual([{ ngay: "2026-10-29", chiTieu: 6.5 }, { ngay: "2026-10-30", chiTieu: 0 }, { ngay: "2026-10-31", chiTieu: 2 }]);
  });
  it("khoảng xem nhanh", () => {
    const k = khoangNgay("2026-10-30");
    expect(k[0]).toMatchObject({ tu: "2026-10-24", den: "2026-10-30" });
    expect(k[1].tu).toBe("2026-10-01");
    expect(k[2].tu).toBe("2026-10-01");
  });
  it("trạng thái khoá chỉ trả có/không", () => {
    expect(trangThaiKhoa({})).toEqual({ facebook: false, tiktok: false, shopee: false });
    expect(trangThaiKhoa({ META_ADS_ACCESS_TOKEN: "x", TIKTOK_ADS_APP_ID: "a", TIKTOK_ADS_APP_SECRET: "b" })).toEqual({ facebook: true, tiktok: false, shopee: false });
    expect(JSON.stringify(trangThaiKhoa({ META_ADS_ACCESS_TOKEN: "bí-mật" }))).not.toContain("bí-mật");
  });
});

describe("so sánh nền tảng + chữ ký Shopee", () => {
  it("chi phí/doanh thu: null khi chưa có doanh thu, làm tròn 1 số lẻ", () => {
    expect(tiLeChiPhi(100, 0)).toBeNull();
    expect(tiLeChiPhi(250, 1000)).toBe(25);
    expect(tiLeChiPhi(1, 3)).toBe(33.3);
  });
  it("hàng tổng cộng đủ và tính tỉ lệ từ tổng, không trung bình tỉ lệ", () => {
    const t = tongNenTang([{ ten: "A", chiTieu: 100, don: 1, doanhThu: 100 }, { ten: "B", chiTieu: 300, don: 5, doanhThu: 1900 }]);
    expect(t).toEqual({ ten: "Tổng", chiTieu: 400, don: 6, doanhThu: 2000, tiLe: 20 });
  });
  it("chữ ký Shopee: HMAC-SHA256 hex ổn định, đổi bất kỳ thành phần nào là đổi chữ ký", async () => {
    const o = { doiTacId: "1", duongDan: "/api/v2/order/get_order_list", thoiGian: 1700000000, accessToken: "tok", shopId: "9" };
    const k = await kyShopee("khoa", o);
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    expect(await kyShopee("khoa", o)).toBe(k);
    expect(await kyShopee("khoa", { ...o, shopId: "10" })).not.toBe(k);
    expect(await kyShopee("khac", o)).not.toBe(k);
  });
});
