import { describe, expect, it } from "vitest";
import { chuanSdt, docBangDonLe, docNgay, docTien, docTrangThai, donGiaCacDong, khopSanPham, tachBang } from "@/lib/nhap-don-le";

describe("nhập đơn lẻ từ bảng", () => {
  it("đọc ngày nhiều kiểu, từ chối ngày không có thật", () => {
    expect(docNgay("03/11/2026")).toBe("2026-11-03");
    expect(docNgay("2026-11-03 10:25:00")).toBe("2026-11-03");
    expect(docNgay("3-1-2026")).toBe("2026-01-03");
    expect(docNgay("31/02/2026")).toBeNull();
    expect(docNgay("hôm qua")).toBeNull();
  });
  it("đọc tiền: dấu chấm/phẩy ngăn nghìn, đơn vị đ", () => {
    expect(docTien("1.250.000")).toBe(1250000);
    expect(docTien("1,250,000")).toBe(1250000);
    expect(docTien("1250000đ")).toBe(1250000);
    expect(docTien("199.000 ₫")).toBe(199000);
    expect(docTien("1250000.50")).toBe(1250001);
    expect(docTien("abc")).toBeNull();
    expect(docTien("")).toBeNull();
  });
  it("trạng thái Shopee/TikTok → trạng thái đơn lẻ", () => {
    expect(docTrangThai("Hoàn thành")).toBe("Đã giao");
    expect(docTrangThai("Completed")).toBe("Đã giao");
    expect(docTrangThai("Đã hủy")).toBe("Huỷ");
    expect(docTrangThai("Cancelled")).toBe("Huỷ");
    expect(docTrangThai("Trả hàng/Hoàn tiền")).toBe("Hoàn trả");
    expect(docTrangThai("Đang giao")).toBe("Đang xử lý");
    expect(docTrangThai("")).toBe("Đang xử lý");
  });
  it("số điện thoại về dạng 0xxxxxxxxx", () => {
    expect(chuanSdt("+84 912 345 678")).toBe("0912345678");
    expect(chuanSdt("0912.345.678")).toBe("0912345678");
  });
  it("tách bảng Tab, chấm phẩy, CSV có ngoặc kép", () => {
    expect(tachBang("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(tachBang("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(tachBang('a,b\n"x, y",2')).toEqual([["a", "b"], ["x, y", "2"]]);
  });
  it("đọc bảng đầy đủ: nhận tên cột Việt/Anh, báo lỗi từng dòng, bỏ mã trùng", () => {
    const t = ["Mã đơn hàng\tNgày đặt hàng\tTên người nhận\tSố điện thoại\tTổng thanh toán\tTrạng thái đơn hàng",
      "A1\t03/11/2026\tAn\t0912 345 678\t1.250.000\tHoàn thành",
      "A2\t99/11/2026\tBình\t\t100000\tHoàn thành",
      "A3\t02/11/2026\t\t\t0\tHuỷ",
      "A1\t03/11/2026\tAn\t\t5000\t",
      "\t03/11/2026\t\t\t5000\t",
      "A4\t01/11/2026\tChi\t+84988000111\t300.000\tĐã hủy"].join("\n");
    const r = docBangDonLe(t);
    expect(r.thieuCot).toEqual([]);
    expect(r.don).toEqual([
      { dong: 2, ngay: "2026-11-03", maDon: "A1", tenKhach: "An", dienThoai: "0912345678", giaTri: 1250000, trangThai: "Đã giao", trangThaiSan: "Hoàn thành", hang: [] },
      { dong: 7, ngay: "2026-11-01", maDon: "A4", tenKhach: "Chi", dienThoai: "0988000111", giaTri: 300000, trangThai: "Huỷ", trangThaiSan: "Đã hủy", hang: [] },
    ]);
    expect(r.loi.map((l) => l.dong)).toEqual([3, 4, 5, 6]);
  });
  it("thiếu cột bắt buộc thì nói rõ cột nào", () => {
    expect(docBangDonLe("Ten\tSdt\nAn\t0912").thieuCot).toEqual(["Mã đơn", "Ngày", "Tiền khách trả"]);
    expect(docBangDonLe("").thieuCot).toEqual(["file trống"]);
  });
});

import { hangExcelThanhBang, oExcelThanhChu } from "@/lib/nhap-don-le";

describe("đọc file Excel thành bảng nhập", () => {
  it("ô ngày, công thức, chữ định dạng, số và ô trống", () => {
    expect(oExcelThanhChu(new Date(Date.UTC(2026, 10, 3)))).toBe("03/11/2026");
    expect(oExcelThanhChu({ formula: "A1+1", result: 350000 })).toBe("350000");
    expect(oExcelThanhChu({ richText: [{ text: "Nguyễn " }, { text: "Lan" }] })).toBe("Nguyễn Lan");
    expect(oExcelThanhChu({ text: "a\tb", hyperlink: "x" })).toBe("a b");
    expect(oExcelThanhChu(null)).toBe("");
    expect(oExcelThanhChu(0)).toBe("0");
  });
  it("bảng sau khi đọc đi qua đúng bộ đọc đơn lẻ, bỏ hàng trống", () => {
    const text = hangExcelThanhBang([["Mã đơn", "Ngày", "Tên khách", "Số điện thoại", "Tiền khách trả", "Trạng thái"], [], ["A001", new Date(Date.UTC(2026, 10, 3)), "Lan", "0912345678", 350000, "Hoàn thành"], [null, null, null, null, null, null]]);
    expect(text.split("\n")).toHaveLength(2);
    const r = docBangDonLe(text);
    expect(r.thieuCot).toEqual([]);
    expect(r.loi).toEqual([]);
    expect(r.don).toHaveLength(1);
    expect(r.don[0].maDon).toBe("A001");
    expect(r.don[0].ngay).toBe("2026-11-03");
    expect(r.don[0].giaTri).toBe(350000);
  });

  it("file sàn nhiều dòng mỗi đơn: gộp theo mã đơn, giữ dòng hàng", () => {
    const t = ["Mã đơn\tNgày\tTổng tiền\tSKU\tSố lượng\tĐơn giá",
      "S1\t03/11/2026\t500000\tHK-01\t2\t150000",
      "S1\t03/11/2026\t500000\tHK-02\t1\t200000",
      "S2\t03/11/2026\t90000\tHK-01\t1\t",
      "S3\t03/11/2026\t90000\tHK-01\tabc\t"].join("\n");
    const r = docBangDonLe(t);
    expect(r.loi).toEqual([]);
    expect(r.don.map((d) => [d.maDon, d.hang.length])).toEqual([["S1", 2], ["S2", 1], ["S3", 0]]);
    expect(r.don[0].hang[1]).toMatchObject({ sku: "HK-02", soLuong: 1, donGia: 200000 });
    expect(r.don[1].hang[0].donGia).toBeNull();
    expect(r.canhBao.map((c) => c.dong)).toEqual([5]);
  });
  it("không có cột sản phẩm thì mã đơn trùng vẫn báo lỗi", () => {
    const r = docBangDonLe("Mã đơn\tNgày\tTổng tiền\nA\t03/11/2026\t100\nA\t03/11/2026\t100");
    expect(r.don.length).toBe(1);
    expect(r.loi.map((l) => l.dong)).toEqual([3]);
  });
  it("khớp sản phẩm theo mã trước rồi tên, bỏ dấu", () => {
    const ds = [{ id: "1", maSp: "HK-01", ten: "Kem chống nắng" }, { id: "2", maSp: "HK-02", ten: "Sữa rửa mặt" }];
    expect(khopSanPham({ sku: "hk-02", tenSp: null }, ds)).toBe("2");
    expect(khopSanPham({ sku: null, tenSp: "KEM CHONG NANG" }, ds)).toBe("1");
    expect(khopSanPham({ sku: "x", tenSp: "Sữa rửa mặt" }, ds)).toBe("2");
    expect(khopSanPham({ sku: "x", tenSp: "lạ" }, ds)).toBeNull();
  });
  it("đơn giá: có đủ thì dùng, thiếu thì chia theo số lượng", () => {
    expect(donGiaCacDong(1000, [{ soLuong: 1, donGia: 300 }, { soLuong: 2, donGia: 350 }])).toEqual([300, 350]);
    expect(donGiaCacDong(900, [{ soLuong: 1, donGia: null }, { soLuong: 2, donGia: 100 }])).toEqual([300, 300]);
  });
});
