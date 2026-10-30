import { describe, expect, it } from "vitest";
import { GIOI_HAN_MAC_DINH, loaiNgay, tachTangCa, tongGioTheoLoai, viPhamGioiHan } from "@/lib/tang-ca";

const LE = new Set(["2026-11-04"]);

describe("tách tăng ca", () => {
  it("trong một ngày; Chủ nhật = nghỉ tuần; ngày lễ", () => {
    expect(tachTangCa("2026-10-30T18:00", "2026-10-30T21:30", LE)).toEqual([{ ngay: "2026-10-30", soGio: 3.5, loaiNgay: "Ngày thường" }]);
    expect(loaiNgay("2026-11-01", LE)).toBe("Ngày nghỉ tuần");
    expect(loaiNgay("2026-11-04", LE)).toBe("Ngày lễ");
  });
  it("qua nửa đêm tách hai ngày; làm tròn 0,5; sai thứ tự thì rỗng", () => {
    expect(tachTangCa("2026-10-31T22:00", "2026-11-01T02:00", LE)).toEqual([{ ngay: "2026-10-31", soGio: 2, loaiNgay: "Ngày thường" }, { ngay: "2026-11-01", soGio: 2, loaiNgay: "Ngày nghỉ tuần" }]);
    expect(tachTangCa("2026-10-30T18:00", "2026-10-30T18:20", LE)).toEqual([{ ngay: "2026-10-30", soGio: 0.5, loaiNgay: "Ngày thường" }]);
    expect(tachTangCa("2026-10-30T18:00", "2026-10-30T17:00", LE)).toEqual([]);
  });
});

describe("giới hạn tăng ca", () => {
  const co = { thang: { "2026-10": 38 }, nam: 190, theoNgay: {} };
  const moi = tachTangCa("2026-10-30T18:00", "2026-10-30T21:00", LE);
  it("vượt tháng và năm được báo, đủ điều kiện thì sạch", () => {
    const loi = viPhamGioiHan(moi, co, GIOI_HAN_MAC_DINH);
    expect(loi.some((x) => /Tháng 10\/2026: tăng ca 41 giờ, vượt 40/.test(x))).toBe(true);
    expect(loi.some((x) => /Cả năm: tăng ca 193 giờ, vượt 200/.test(x))).toBe(false);
    expect(viPhamGioiHan(moi, { thang: {}, nam: 0, theoNgay: {} }, GIOI_HAN_MAC_DINH)).toEqual([]);
    expect(viPhamGioiHan(moi, { thang: {}, nam: 199, theoNgay: {} }, GIOI_HAN_MAC_DINH).some((x) => /Cả năm/.test(x))).toBe(true);
  });
  it("tổng giờ làm + tăng ca/ngày: ngày thường tính thêm 8 giờ chuẩn, Chủ nhật thì không", () => {
    const dai = tachTangCa("2026-10-30T18:00", "2026-10-30T23:00", LE); // 5 giờ + 8 = 13 > 12
    expect(viPhamGioiHan(dai, { thang: {}, nam: 0, theoNgay: {} }, GIOI_HAN_MAC_DINH).some((x) => /tổng giờ làm và tăng ca 13 giờ/.test(x))).toBe(true);
    const cn = tachTangCa("2026-11-01T08:00", "2026-11-01T20:00", LE); // 12 giờ chủ nhật
    expect(viPhamGioiHan(cn, { thang: {}, nam: 0, theoNgay: {} }, GIOI_HAN_MAC_DINH)).toEqual([]);
  });
  it("cộng theo loại ngày", () => {
    expect(tongGioTheoLoai([{ so_gio: "2.5", loai_ngay: "Ngày thường" }, { so_gio: 3, loai_ngay: "Ngày nghỉ tuần" }, { so_gio: 4, loai_ngay: "Ngày lễ" }, { so_gio: 1, loai_ngay: "Ngày thường" }])).toEqual({ thuong: 3.5, nghiTuan: 3, le: 4 });
  });
});
