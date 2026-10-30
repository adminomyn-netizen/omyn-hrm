import { describe, expect, it } from "vitest";
import { canhBaoHopDong, type HopDong } from "@/lib/hop-dong";
import { GIAY_TO_BAT_BUOC, GIAY_TO_THEO_LUAT, giayToConThieu, truongThieuTheoLuat } from "@/lib/ho-so";

const hd = (mo: Partial<HopDong>): HopDong => ({ nhan_vien_id: "a", loai: "Xác định thời hạn", tu_ngay: "2026-01-01", den_ngay: "2027-01-01", trang_thai: "Đang hiệu lực", ...mo });
const HN = "2026-10-30";

describe("cảnh báo hợp đồng", () => {
  it("chưa có hợp đồng → lỗi; chỉ xét người đang làm", () => {
    const r = canhBaoHopDong([], ["a"], HN);
    expect(r).toEqual([{ nhanVienId: "a", muc: "loi", noiDung: "Chưa có hợp đồng nào trong hồ sơ." }]);
    expect(canhBaoHopDong([], [], HN)).toEqual([]);
  });
  it("hợp đồng còn lâu thì sạch", () => {
    expect(canhBaoHopDong([hd({})], ["a"], HN)).toEqual([]);
  });
  it("hết hạn mà vẫn đang làm → không có hợp đồng hiệu lực", () => {
    const r = canhBaoHopDong([hd({ den_ngay: "2026-06-30", trang_thai: "Đã hết hạn" })], ["a"], HN);
    expect(r.map((x) => x.noiDung)).toContain("Không có hợp đồng đang hiệu lực (đã hết hạn hoặc chưa ký).");
  });
  it("sắp hết hạn trong 45 ngày được báo, quá 45 ngày thì không", () => {
    expect(canhBaoHopDong([hd({ den_ngay: "2026-12-01" })], ["a"], HN)[0].noiDung).toMatch(/còn 32 ngày/);
    expect(canhBaoHopDong([hd({ den_ngay: "2027-03-01" })], ["a"], HN)).toEqual([]);
  });
  it("ký xác định thời hạn: đủ 2 lần thì nhắc lần tới không xác định; quá 2 lần là lỗi; đã ký không xác định thì hết nhắc", () => {
    const hai = [hd({ tu_ngay: "2024-01-01", den_ngay: "2025-01-01", trang_thai: "Đã hết hạn" }), hd({ tu_ngay: "2025-01-02", den_ngay: "2027-01-02" })];
    expect(canhBaoHopDong(hai, ["a"], HN).some((x) => /lần tới phải ký không xác định thời hạn/.test(x.noiDung))).toBe(true);
    const ba = [...hai, hd({ tu_ngay: "2023-01-01", den_ngay: "2023-12-31", trang_thai: "Đã hết hạn" })];
    expect(canhBaoHopDong(ba, ["a"], HN).some((x) => x.muc === "loi" && /vượt 2 lần/.test(x.noiDung))).toBe(true);
    expect(canhBaoHopDong([...hai, hd({ loai: "Không xác định thời hạn", den_ngay: null, tu_ngay: "2026-02-01" })], ["a"], HN).some((x) => /lần tới/.test(x.noiDung))).toBe(false);
  });
  it("thử việc quá 60 ngày kèm ghi chú chờ xác nhận", () => {
    const r = canhBaoHopDong([hd({ loai: "Thử việc", tu_ngay: "2026-10-01", den_ngay: "2026-12-30" })], ["a"], HN);
    expect(r.some((x) => /Thử việc dài hơn 60 ngày.*chờ kế toán\/luật sư xác nhận/.test(x.noiDung))).toBe(true);
    expect(canhBaoHopDong([hd({ loai: "Thử việc", tu_ngay: "2026-10-01", den_ngay: "2026-11-29" })], ["a"], HN).some((x) => /Thử việc dài hơn/.test(x.noiDung))).toBe(false);
  });
});

describe("hồ sơ bắt buộc theo luật", () => {
  it("6 giấy tờ theo luật + 2 theo công ty", () => {
    expect([...GIAY_TO_THEO_LUAT]).toEqual(["CCCD mặt trước", "CCCD mặt sau", "Sơ yếu lý lịch", "Bằng cấp", "Giấy khám sức khoẻ", "Sổ BHXH"]);
    expect(GIAY_TO_BAT_BUOC).toHaveLength(8);
  });
  it("thiếu giấy tờ và thiếu trường mã số thuế/BHXH/CCCD", () => {
    expect(giayToConThieu([{ loai: "Bằng cấp", da_go: false, trang_thai: "Đã xác nhận" }])).toHaveLength(7);
    expect(giayToConThieu(GIAY_TO_BAT_BUOC.map((l) => ({ loai: l, da_go: false, trang_thai: "Chờ xác nhận" })))).toEqual([]);
    expect(truongThieuTheoLuat(null)).toEqual(["Số CCCD", "Mã số thuế", "Số sổ BHXH"]);
    expect(truongThieuTheoLuat({ cccd: "0123", ma_so_thue: " ", so_bhxh: "9" })).toEqual(["Mã số thuế"]);
  });
});
