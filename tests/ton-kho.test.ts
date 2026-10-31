import { describe, expect, it } from "vitest";
import { chenhLechKiemKe, tinhTonKho, tonDenNgay } from "@/lib/ton-kho";

describe("tồn kho", () => {
  it("nhập + điều chỉnh tăng − xuất − điều chỉnh giảm, bỏ sản phẩm chưa có phiếu, báo tồn âm", () => {
    const sp = [{ id: "a", ma: "A1", ten: "Kem" }, { id: "b", ma: "B1", ten: "Xịt" }, { id: "c", ma: "C1", ten: "Chưa có phiếu" }];
    const r = tinhTonKho(sp, [
      { sanPhamId: "a", loai: "Nhập", soLuong: 100 }, { sanPhamId: "a", loai: "Xuất", soLuong: 30 },
      { sanPhamId: "a", loai: "Điều chỉnh giảm", soLuong: 5 }, { sanPhamId: "a", loai: "Điều chỉnh tăng", soLuong: 2 },
      { sanPhamId: "b", loai: "Xuất", soLuong: 4 },
    ]);
    expect(r.map((x) => x.ma)).toEqual(["A1", "B1"]);
    expect(r[0]).toMatchObject({ nhap: 100, xuat: 30, dieuChinh: -3, ton: 67 });
    expect(r[1].ton).toBe(-4);
  });
  it("báo sắp hết khi tồn bằng hoặc thấp hơn mức tối thiểu; không đặt mức thì không báo", () => {
    const r = tinhTonKho(
      [{ id: "a", ma: "A", ten: "A", tonToiThieu: 20 }, { id: "b", ma: "B", ten: "B", tonToiThieu: 20 }, { id: "c", ma: "C", ten: "C" }],
      [{ sanPhamId: "a", loai: "Nhập", soLuong: 20 }, { sanPhamId: "b", loai: "Nhập", soLuong: 21 }, { sanPhamId: "c", loai: "Nhập", soLuong: 1 }],
    );
    expect(r.map((x) => x.sapHet)).toEqual([true, false, false]);
  });
});

describe("kiểm kê kho", () => {
  const dong = [
    { sanPhamId: "a", loai: "Nhập", soLuong: 100, ngay: "2026-10-01" },
    { sanPhamId: "a", loai: "Xuất", soLuong: 30, ngay: "2026-10-10" },
    { sanPhamId: "a", loai: "Xuất", soLuong: 20, ngay: "2026-10-25" },
    { sanPhamId: "b", loai: "Nhập", soLuong: 10, ngay: "2026-10-02" },
  ];
  it("tồn trên sổ tính đến hết ngày kiểm kê, không tính phiếu sau đó", () => {
    expect(tonDenNgay(dong, "a", "2026-10-10")).toBe(70);
    expect(tonDenNgay(dong, "a", "2026-10-31")).toBe(50);
  });
  it("lấy lần kiểm kê gần nhất, chênh = thực tế − sổ, lệch nhiều xếp trước", () => {
    const r = chenhLechKiemKe(dong, [
      { sanPhamId: "a", ngay: "2026-10-05", thucTe: 1 },
      { sanPhamId: "a", ngay: "2026-10-31", thucTe: 47 },
      { sanPhamId: "b", ngay: "2026-10-31", thucTe: 4 },
    ]);
    expect(r).toEqual([
      { sanPhamId: "b", ngay: "2026-10-31", thucTe: 4, soSach: 10, chenh: -6 },
      { sanPhamId: "a", ngay: "2026-10-31", thucTe: 47, soSach: 50, chenh: -3 },
    ]);
  });
});
