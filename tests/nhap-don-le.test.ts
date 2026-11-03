import { describe, expect, it } from "vitest";
import { chuanSdt, docBangDonLe, docNgay, docTien, docTrangThai, tachBang } from "@/lib/nhap-don-le";

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
      { dong: 2, ngay: "2026-11-03", maDon: "A1", tenKhach: "An", dienThoai: "0912345678", giaTri: 1250000, trangThai: "Đã giao" },
      { dong: 7, ngay: "2026-11-01", maDon: "A4", tenKhach: "Chi", dienThoai: "0988000111", giaTri: 300000, trangThai: "Huỷ" },
    ]);
    expect(r.loi.map((l) => l.dong)).toEqual([3, 4, 5, 6]);
  });
  it("thiếu cột bắt buộc thì nói rõ cột nào", () => {
    expect(docBangDonLe("Ten\tSdt\nAn\t0912").thieuCot).toEqual(["Mã đơn", "Ngày", "Tiền khách trả"]);
    expect(docBangDonLe("").thieuCot).toEqual(["file trống"]);
  });
});
