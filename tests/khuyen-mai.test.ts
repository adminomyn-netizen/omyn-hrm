import { describe, expect, it } from "vitest";
import { hieuQuaKhuyenMai, kiemTraDung, tinhGiam, trangThaiVoucher, type LanDung, type Voucher } from "@/lib/khuyen-mai";

const v = (o: Partial<Voucher> = {}): Voucher => ({ id: "v1", ma: "OMYN10", loai: "Giảm %", giaTri: 10, giamToiDa: 50000, donToiThieu: 200000, kenh: "Tất cả", tuNgay: "2026-11-01", denNgay: "2026-11-30", gioiHanLuot: 2, gioiHanMoiKhach: 1, bat: true, ...o });
const l = (o: Partial<LanDung> = {}): LanDung => ({ voucherId: "v1", khachId: "k1", ngay: "2026-11-05", kenh: "Shopee", soTienDon: 300000, soTienGiam: 30000, ...o });

describe("voucher", () => {
  it("tính giảm: % làm tròn xuống, có trần, tiền cố định không quá đơn", () => {
    expect(tinhGiam(v(), 333333)).toBe(33333);
    expect(tinhGiam(v(), 1000000)).toBe(50000);
    expect(tinhGiam(v({ loai: "Giảm tiền", giaTri: 100000, giamToiDa: null }), 80000)).toBe(80000);
    expect(tinhGiam(v({ loai: "Giảm tiền", giaTri: 100000, giamToiDa: null }), 500000)).toBe(100000);
  });
  it("trạng thái theo bật/tắt, ngày, lượt", () => {
    expect(trangThaiVoucher(v({ bat: false }), 0, "2026-11-05")).toBe("Tắt");
    expect(trangThaiVoucher(v(), 0, "2026-10-31")).toBe("Chưa tới ngày");
    expect(trangThaiVoucher(v(), 0, "2026-12-01")).toBe("Hết hạn");
    expect(trangThaiVoucher(v(), 2, "2026-11-05")).toBe("Hết lượt");
    expect(trangThaiVoucher(v(), 1, "2026-11-30")).toBe("Đang chạy");
  });
  it("kiểm lần dùng: ngày, kênh, đơn tối thiểu, lượt, mỗi khách", () => {
    const hopLe = { ngay: "2026-11-05", kenh: "Shopee", khachId: "k1", soTienDon: 300000 };
    expect(kiemTraDung(v(), hopLe, [])).toBeNull();
    expect(kiemTraDung(v({ bat: false }), hopLe, [])).toContain("tắt");
    expect(kiemTraDung(v(), { ...hopLe, ngay: "2026-12-01" }, [])).toContain("thời hạn");
    expect(kiemTraDung(v({ kenh: "Facebook" }), hopLe, [])).toContain("Facebook");
    expect(kiemTraDung(v(), { ...hopLe, soTienDon: 100000 }, [])).toContain("tối thiểu");
    expect(kiemTraDung(v(), hopLe, [l({ khachId: "k2" }), l({ khachId: "k3" })])).toContain("hết lượt");
    expect(kiemTraDung(v(), hopLe, [l()])).toContain("Khách này");
    expect(kiemTraDung(v({ gioiHanMoiKhach: null }), hopLe, [l()])).toBeNull();
  });
  it("hiệu quả theo kênh và theo voucher trong kỳ", () => {
    const r = hieuQuaKhuyenMai([v(), v({ id: "v2", ma: "KHAC", gioiHanLuot: null })], [l(), l({ kenh: "Facebook", soTienDon: 500000, soTienGiam: 50000 }), l({ voucherId: "v2", soTienGiam: 20000 }), l({ ngay: "2026-10-01" })], "2026-11-01", "2026-11-30");
    expect(r.theoKenh).toEqual([
      { kenh: "Facebook", luot: 1, doanhThu: 500000, giam: 50000, phanTramGiam: 10 },
      { kenh: "Shopee", luot: 2, doanhThu: 600000, giam: 50000, phanTramGiam: 8.3 },
    ]);
    expect(r.theoVoucher.map((x) => [x.ma, x.luot, x.giam, x.conLuot])).toEqual([["OMYN10", 2, 80000, 0], ["KHAC", 1, 20000, null]]);
  });
});
