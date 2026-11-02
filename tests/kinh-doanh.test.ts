import { describe, expect, it } from "vitest";
import { gopDoanhThuSan, ngayChotCuaCoHoi, tinhCongNo, tinhDoanhSo, tinhDoanhSoTheoNguoi, doiChieuDonSi, thanhTienDong, tinhDiemKhach, congThang } from "@/lib/kinh-doanh";

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
    expect(r[0]).toMatchObject({ phatSinh: 18_000_000, daThu: 4_000_000, soDu: 14_000_000, vuotHanMuc: false, quaHan: 6_000_000, denHan7Ngay: expect.any(Number) });
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

describe("doanh thu sàn 3 nguồn", () => {
  const tay = [
    { ngay: "2026-10-01", nenTang: "Shopee", doanhThu: 100, hoan: 10 },
    { ngay: "2026-10-02", nenTang: "Shopee", doanhThu: 50, hoan: 0 },
    { ngay: "2026-10-01", nenTang: "TikTok Shop", doanhThu: 30, hoan: 5 },
    { ngay: "2026-10-01", nenTang: "Facebook", doanhThu: 20, hoan: 0 },
  ];
  it("chưa có số Shopee tự kéo thì dùng hết số nhập tay, đủ 3 nguồn", () => {
    const { theoNguon } = gopDoanhThuSan(tay, []);
    expect(theoNguon.map((x) => x.nguon)).toEqual(["Shopee", "TikTok Shop", "Facebook"]);
    expect(theoNguon[0]).toMatchObject({ doanhThu: 150, hoan: 10, rong: 140, tuKeo: false });
    expect(theoNguon[1].rong).toBe(25);
  });
  it("ngày Shopee đã kéo về thì số tự kéo thay số nhập tay ngày đó; ngày chưa kéo giữ số nhập tay; nguồn khác không đổi", () => {
    const { theoNguon, ngayShopeeKeo } = gopDoanhThuSan(tay, [{ ngay: "2026-10-01", doanhThu: 120, soDon: 3 }, { ngay: "2026-10-03", doanhThu: 0, soDon: 0 }]);
    expect([...ngayShopeeKeo]).toEqual(["2026-10-01"]);
    expect(theoNguon[0]).toMatchObject({ doanhThu: 170, hoan: 0, rong: 170, tuKeo: true });
    expect(theoNguon[1].rong).toBe(25);
    expect(theoNguon[2].rong).toBe(20);
  });
});

describe("công nợ đến hạn 7 ngày", () => {
  it("chỉ tính khoản có hạn từ hôm nay đến +7 ngày, trừ tiền đã thu vào khoản cũ nhất trước", () => {
    const r = tinhCongNo(
      [{ id: "a", ten: "A", hanMuc: null }],
      [
        { daiLyId: "a", ngay: "2026-10-01", loai: "Phát sinh", soTien: 100, hanThanhToan: "2026-11-05" },
        { daiLyId: "a", ngay: "2026-10-02", loai: "Phát sinh", soTien: 50, hanThanhToan: "2026-11-09" },
        { daiLyId: "a", ngay: "2026-10-03", loai: "Phát sinh", soTien: 30, hanThanhToan: "2026-11-20" },
        { daiLyId: "a", ngay: "2026-10-04", loai: "Đã thu", soTien: 40, hanThanhToan: null },
      ],
      "2026-11-02",
    );
    expect(r[0]).toMatchObject({ quaHan: 0, denHan7Ngay: 110 });
  });
});

describe("đối chiếu đơn sỉ với dòng hàng", () => {
  it("thành tiền có chiết khấu, tổng dòng so với giá trị đơn, đơn chưa có dòng thì không so", () => {
    expect(thanhTienDong(10, 100_000, 10)).toBe(900_000);
    const r = doiChieuDonSi(
      [{ id: "d1", ma: "S1", giaTri: 1_500_000 }, { id: "d2", ma: "S2", giaTri: 500 }],
      [{ donSiId: "d1", soLuong: 10, donGia: 100_000, chietKhau: 10 }, { donSiId: "d1", soLuong: 5, donGia: 120_000, chietKhau: 0 }],
    );
    expect(r[0]).toMatchObject({ tongDong: 1_500_000, soDong: 2, lech: 0 });
    expect(r[1]).toMatchObject({ tongDong: 0, soDong: 0, lech: null });
  });
});

describe("điểm và hạng khách lẻ (tham số tạm)", () => {
  const ch = { dongMoiDiem: 10_000, dongGiamMoiDiem: 100, hetHanThang: 12, cuaSoHangThang: 12 };
  const hang = [
    { ten: "Thành viên", muaToiThieu: 0, heSoPt: 100 }, { ten: "Bạc", muaToiThieu: 3_000_000, heSoPt: 120 },
    { ten: "Vàng", muaToiThieu: 10_000_000, heSoPt: 150 }, { ten: "Kim cương", muaToiThieu: 30_000_000, heSoPt: 200 },
  ];
  const k = (id: string) => ({ id, ten: id, kenh: "Facebook", dongYNhanTin: true });
  const mua = (khachId: string, ngay: string, soTien: number) => ({ khachId, loai: "Mua", ngay, soTien, soDiem: 0 });

  it("10.000đ = 1 điểm, hạng Thành viên nhân 1, làm tròn xuống, 1 điểm đổi 100đ", () => {
    const r = tinhDiemKhach([k("a")], [mua("a", "2026-11-01", 125_000)], hang, ch, "2026-11-02")[0];
    expect(r).toMatchObject({ daTich: 12, soDu: 12, soDuTien: 1200, hang: "Thành viên", muaCuaSo: 125_000 });
  });
  it("hệ số theo hạng lúc mua: mua 3 triệu lên Bạc, lần mua sau nhân 1,2", () => {
    const r = tinhDiemKhach([k("a")], [mua("a", "2026-10-01", 3_000_000), mua("a", "2026-10-20", 1_000_000)], hang, ch, "2026-11-02")[0];
    expect(r.daTich).toBe(300 + 120); // lần 1 hạng Thành viên (×1), lần 2 đã là Bạc (×1,2)
    expect(r).toMatchObject({ hang: "Bạc", heSoPt: 120, muaCuaSo: 4_000_000 });
  });
  it("các mốc hạng 3, 10, 30 triệu và Kim cương nhân 2", () => {
    const h = (t: number) => tinhDiemKhach([k("a")], [mua("a", "2026-09-01", t)], hang, ch, "2026-11-02")[0].hang;
    expect([h(2_999_999), h(3_000_000), h(10_000_000), h(30_000_000)]).toEqual(["Thành viên", "Bạc", "Vàng", "Kim cương"]);
    const r = tinhDiemKhach([k("a")], [mua("a", "2026-01-01", 30_000_000), mua("a", "2026-02-01", 1_000_000)], hang, ch, "2026-03-01")[0];
    expect(r.daTich).toBe(3000 + 200);
  });
  it("điểm hết hạn sau 12 tháng và mua cũ hơn 12 tháng không tính vào hạng", () => {
    const r = tinhDiemKhach([k("a")], [mua("a", "2025-10-01", 5_000_000), mua("a", "2026-06-01", 100_000)], hang, ch, "2026-11-02")[0];
    expect(r).toMatchObject({ hetHan: 500, soDu: 12, muaCuaSo: 100_000, hang: "Thành viên" }); // lần 2 còn hạng Bạc (×1,2) vì lần 1 còn trong 12 tháng lúc đó
  });
  it("dùng điểm trừ lô cũ nhất còn hạn; dùng quá số có thì báo thiếu; tặng điểm cũng có hạn", () => {
    const dong = [mua("a", "2026-01-01", 100_000), mua("a", "2026-05-01", 100_000), { khachId: "a", loai: "Dùng", ngay: "2026-06-01", soTien: null, soDiem: 15 }, { khachId: "a", loai: "Tặng", ngay: "2026-06-02", soTien: null, soDiem: 5 }];
    const r = tinhDiemKhach([k("a")], dong, hang, ch, "2026-11-02")[0];
    expect(r).toMatchObject({ daTich: 25, dung: 15, soDu: 10, thieu: 0 });
    const q = tinhDiemKhach([k("a")], [mua("a", "2026-01-01", 100_000), { khachId: "a", loai: "Dùng", ngay: "2026-02-01", soTien: null, soDiem: 30 }], hang, ch, "2026-11-02")[0];
    expect(q).toMatchObject({ soDu: 0, thieu: 20 });
  });
  it("điểm sắp hết hạn trong 30 ngày; chưa đặt hạng thì hạng trống, hệ số 100%", () => {
    const r = tinhDiemKhach([k("a")], [mua("a", "2025-11-20", 100_000)], hang, ch, "2026-11-02")[0];
    expect(r).toMatchObject({ soDu: 10, sapHet: 10 });
    expect(tinhDiemKhach([k("a")], [mua("a", "2026-11-01", 100_000)], [], ch, "2026-11-02")[0]).toMatchObject({ hang: null, heSoPt: 100, daTich: 10 });
  });
  it("cộng tháng không tràn ngày", () => {
    expect(congThang("2026-02-28", 12)).toBe("2027-02-28");
    expect(congThang("2024-02-29", 12)).toBe("2025-02-28");
    expect(congThang("2026-11-02", -12)).toBe("2025-11-02");
  });
});
