import { describe, expect, it } from "vitest";
import { docBangDoiSoat, docTienCoDau, phanLoaiDoiSoat, tomTatDoiSoat, tongPhi } from "@/lib/doi-soat-don";

describe("docTienCoDau", () => {
  it("đọc số âm các kiểu", () => {
    expect(docTienCoDau("-12.500")).toBe(-12500);
    expect(docTienCoDau("−12,500")).toBe(-12500);
    expect(docTienCoDau("(12.500)")).toBe(-12500);
    expect(docTienCoDau("1.250.000")).toBe(1250000);
    expect(docTienCoDau("")).toBeNull();
    expect(docTienCoDau("abc")).toBeNull();
  });
});

describe("docBangDoiSoat", () => {
  const T = "Mã đơn\tNgày nhận tiền\tTiền khách trả\tPhí hoa hồng\tPhí giao dịch\tPhí vận chuyển\tThực nhận";
  it("thiếu cột bắt buộc thì báo", () => {
    expect(docBangDoiSoat("Mã đơn\tTiền khách trả\nA1\t100").thieuCot).toEqual(["Thực nhận"]);
    expect(docBangDoiSoat("").thieuCot).toEqual(["file trống"]);
  });
  it("đọc dòng, phí lấy tuyệt đối, thực nhận giữ dấu", () => {
    const r = docBangDoiSoat([T, "A1\t05/11/2026\t200.000\t-10.000\t-4.000\t0\t186.000", "A2\t\t100.000\t5.000\t0\t0\t-20.000"].join("\n"));
    expect(r.loi).toEqual([]);
    expect(r.dong[0]).toMatchObject({ maDon: "A1", ngayNhanTien: "2026-11-05", khachTra: 200000, phiHoaHong: 10000, phiGiaoDich: 4000, thucNhan: 186000 });
    expect(tongPhi(r.dong[0])).toBe(14000);
    expect(r.dong[1].thucNhan).toBe(-20000);
    expect(r.dong[1].ngayNhanTien).toBeNull();
  });
  it("lỗi từng dòng, cộng gộp mã trùng và báo", () => {
    const r = docBangDoiSoat([T, "\t\t100\t0\t0\t0\t100", "A1\t\t100\t0\t0\t0\txx", "A3\t\t100.000\t1.000\t0\t0\t90.000", "A3\t\t0\t500\t0\t0\t-500"].join("\n"));
    expect(r.loi.map((l) => l.dong)).toEqual([2, 3]);
    expect(r.dong).toHaveLength(1);
    expect(r.dong[0]).toMatchObject({ maDon: "A3", khachTra: 100000, phiHoaHong: 1500, thucNhan: 89500 });
    expect(r.canhBao.some((c) => c.loi.includes("cộng gộp"))).toBe(true);
  });
  it("ngày sai chỉ cảnh báo, không bỏ dòng", () => {
    const r = docBangDoiSoat([T, "A1\t99/99/2026\t100\t0\t0\t0\t100"].join("\n"));
    expect(r.dong).toHaveLength(1);
    expect(r.canhBao).toHaveLength(1);
  });
  it("không có cột khách trả thì khachTra null", () => {
    const r = docBangDoiSoat("Order ID\tSettlement Amount\nA1\t5000");
    expect(r.dong[0]).toMatchObject({ khachTra: null, thucNhan: 5000 });
  });
});

describe("phanLoaiDoiSoat", () => {
  const d = (khachTra: number | null, thucNhan = 100000) => ({ khachTra, thucNhan });
  it("không có đơn trong Omyn → Thiếu", () => expect(phanLoaiDoiSoat(d(100000), undefined).ketQua).toBe("Thiếu trong Omyn"));
  it("đơn Huỷ/Hoàn trả mà sàn vẫn trả tiền → Lệch trạng thái", () => {
    expect(phanLoaiDoiSoat(d(100000), { giaTri: 100000, trangThai: "Huỷ" }).ketQua).toBe("Lệch trạng thái");
    expect(phanLoaiDoiSoat(d(100000, 0), { giaTri: 100000, trangThai: "Hoàn trả" }).ketQua).toBe("Khớp");
  });
  it("khách trả khác giá trị đơn → Lệch giá trị; không có cột khách trả thì không so", () => {
    expect(phanLoaiDoiSoat(d(90000), { giaTri: 100000, trangThai: "Đã giao" })).toMatchObject({ ketQua: "Lệch giá trị", giaTriDon: 100000 });
    expect(phanLoaiDoiSoat(d(null), { giaTri: 100000, trangThai: "Đã giao" }).ketQua).toBe("Khớp");
    expect(phanLoaiDoiSoat(d(100000), { giaTri: 100000, trangThai: "Đã giao" }).canhBao).toBeNull();
  });
});

describe("tomTatDoiSoat", () => {
  it("cộng đúng và đếm theo kết quả", () => {
    const x = { phiHoaHong: 1000, phiGiaoDich: 500, phiVanChuyen: 0, phiDichVu: 0, phiAffiliate: 0, thue: 0, phiKhac: 0, hoanTien: 0 };
    const t = tomTatDoiSoat([{ ...x, khachTra: 10000, thucNhan: 8500, ketQua: "Khớp" }, { ...x, khachTra: null, thucNhan: 1000, hoanTien: 200, ketQua: "Thiếu trong Omyn" }]);
    expect(t).toMatchObject({ soDon: 2, khachTra: 10000, tongPhi: 3000, thucNhan: 9500, hoanTien: 200 });
    expect(t.theoKetQua["Khớp"]).toBe(1);
    expect(t.theoKetQua["Thiếu trong Omyn"]).toBe(1);
  });
});
