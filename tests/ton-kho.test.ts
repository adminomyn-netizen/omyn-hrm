import { describe, expect, it } from "vitest";
import { tinhTonKho } from "@/lib/ton-kho";

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
});
