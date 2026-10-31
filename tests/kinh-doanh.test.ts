import { describe, expect, it } from "vitest";
import { ngayChotCuaCoHoi, tinhCongNo, tinhDoanhSo, tinhDoanhSoTheoNguoi } from "@/lib/kinh-doanh";

describe("công nợ đại lý", () => {
  it("số dư, vượt hạn mức, quá hạn theo thứ tự trừ khoản cũ nhất trước", () => {
    const r = tinhCongNo(
      [{ id: "a", ten: "Đại lý A", hanMuc: 15_000_000 }, { id: "b", ten: "Khách B", hanMuc: null }, { id: "c", ten: "Chưa phát sinh", hanMuc: null }],
      [
        { daiLyId: "a", ngay: "2026-09-01", loai: "Phát sinh", soTien: 10_000_000, hanThanhToan: "2026-09-30" },
        { daiLyId: "a", ngay: "2026-10-05", loai: "Phát sinh", soTien: 8_000_000, hanThanhToan: "2026-11-20" },
        { daiLyId: "a", ngay: "2026-10-10", loai: "Đã thu", soTien: 4_000_000, hanThanhToan: null },
        { daiLyId: "b", ngay: "2026-10-01", loai: "Phát sinh", soTien: 2_000_000, hanThanhToan: "2026-10-15" },
        { daiLyId: "b", ngay: "2026-10-12", loai: "Đã thu", soTien: 2_000_000, hanThanhToan: null },
      ],
      "2026-10-31",
    );
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
    expect(r[0]).toMatchObject({ phatSinh: 18_000_000, daThu: 4_000_000, soDu: 14_000_000, vuotHanMuc: false, quaHan: 6_000_000 });
    expect(r[1]).toMatchObject({ soDu: 0, quaHan: 0, vuotHanMuc: false });
  });
  it("vượt hạn mức khi số dư lớn hơn hạn mức", () => {
    const r = tinhCongNo([{ id: "a", ten: "A", hanMuc: 5 }], [{ daiLyId: "a", ngay: "2026-10-01", loai: "Phát sinh", soTien: 9, hanThanhToan: null }], "2026-10-31");
    expect(r[0].vuotHanMuc).toBe(true);
  });
});

describe("doanh số so chỉ tiêu", () => {
  it("sàn trừ hoàn, sỉ chỉ tính đơn đã chốt trở đi, tổng không cộng livestream", () => {
    const r = tinhDoanhSo(
      [{ kenh: "Tổng", chiTieu: 200_000_000 }, { kenh: "Sàn", chiTieu: 100_000_000 }],
      120_000_000,
      20_000_000,
      [{ trangThai: "Báo giá", giaTri: 50 }, { trangThai: "Đã giao", giaTri: 30_000_000 }, { trangThai: "Huỷ", giaTri: 9 }],
      40_000_000,
    );
    const lay = (k: string) => r.find((x) => x.kenh === k)!;
    expect(lay("Sàn")).toMatchObject({ thucDat: 100_000_000, chiTieu: 100_000_000, phanTram: 100 });
    expect(lay("Sỉ và đại lý")).toMatchObject({ thucDat: 30_000_000, chiTieu: null, phanTram: null });
    expect(lay("Tổng")).toMatchObject({ thucDat: 130_000_000, phanTram: 65 });
    expect(lay("Livestream").thucDat).toBe(40_000_000);
  });
});

describe("công nợ nhà cung cấp dùng chung hàm, dòng trả là 'Đã trả'", () => {
  it("trừ khoản đã trả vào nợ cũ nhất", () => {
    const r = tinhCongNo(
      [{ id: "Cty A", ten: "Cty A", hanMuc: null }],
      [
        { daiLyId: "Cty A", ngay: "2026-09-01", loai: "Phát sinh", soTien: 100, hanThanhToan: "2026-10-01" },
        { daiLyId: "Cty A", ngay: "2026-10-01", loai: "Đã trả", soTien: 40, hanThanhToan: null },
      ],
      "2026-10-31",
      "Đã trả",
    );
    expect(r[0]).toMatchObject({ soDu: 60, quaHan: 60 });
  });
});

describe("doanh số theo người", () => {
  it("gom sàn theo người vận hành, sỉ theo người phụ trách, live theo host, đếm cơ hội chốt; không cộng các cột", () => {
    const r = tinhDoanhSoTheoNguoi({
      ten: new Map([["n1", "An"], ["n2", "Bình"]]),
      sanTheoGianHang: [{ nguoiVanHanhId: "n1", doanhThu: 100, hoan: 10 }, { nguoiVanHanhId: null, doanhThu: 999, hoan: 0 }],
      donSi: [{ nguoiId: "n2", trangThai: "Đã giao", giaTri: 50 }, { nguoiId: "n2", trangThai: "Báo giá", giaTri: 70 }, { nguoiId: "n1", trangThai: "Huỷ", giaTri: 5 }],
      live: [{ hostId: "n1", doanhThu: 30 }],
      coHoi: [{ nguoiId: "n2", giaiDoan: "Đã chốt" }, { nguoiId: "n2", giaiDoan: "Mất" }],
    });
    expect(r.map((x) => x.nguoiId)).toEqual(["n1", "n2"]);
    expect(r[0]).toMatchObject({ san: 90, si: 0, live: 30, soDonSi: 0 });
    expect(r[1]).toMatchObject({ san: 0, si: 50, soDonSi: 1, coHoiChot: 1 });
  });
});

describe("ngày chốt của cơ hội", () => {
  it("dùng ngày chốt nếu có, không thì ngày tạo theo giờ Việt Nam", () => {
    expect(ngayChotCuaCoHoi("2026-10-15", "2026-09-01T10:00:00Z")).toBe("2026-10-15");
    expect(ngayChotCuaCoHoi(null, "2026-09-30T18:00:00Z")).toBe("2026-10-01");
  });
});
