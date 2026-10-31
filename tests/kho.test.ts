import { describe, expect, it } from "vitest";
import { thongKeDongGoi } from "@/lib/kho";

describe("thống kê đóng gói", () => {
  it("đếm theo trạng thái, kênh; người đóng không tính đơn còn chờ đóng; tỷ lệ hoàn trên đơn đã kết thúc", () => {
    const r = thongKeDongGoi(
      [
        { nguoiId: "a", kenh: "Sàn", trangThai: "Đã giao" },
        { nguoiId: "a", kenh: "Sàn", trangThai: "Đã giao" },
        { nguoiId: "a", kenh: "Sàn", trangThai: "Đã giao" },
        { nguoiId: "b", kenh: "Sỉ và đại lý", trangThai: "Hoàn hoặc trả" },
        { nguoiId: null, kenh: "Sàn", trangThai: "Chờ đóng" },
        { nguoiId: null, kenh: "Sàn", trangThai: "Đã đóng" },
      ],
      new Map([["a", "An"], ["b", "Bình"]]),
    );
    expect(r.tong).toBe(6);
    expect(r.theoTrangThai).toMatchObject({ "Đã giao": 3, "Hoàn hoặc trả": 1, "Chờ đóng": 1, "Đã đóng": 1 });
    expect(r.tiLeHoan).toBe(25);
    expect(r.theoNguoi).toEqual([{ nguoiId: "a", ten: "An", so: 3 }, { nguoiId: "b", ten: "Bình", so: 1 }, { nguoiId: null, ten: "Chưa ghi người đóng", so: 1 }]);
    expect(r.theoKenh[0]).toEqual({ kenh: "Sàn", so: 5 });
  });
  it("chưa có đơn kết thúc thì không tính tỷ lệ hoàn", () => {
    expect(thongKeDongGoi([{ nguoiId: "a", kenh: "Sàn", trangThai: "Đã đóng" }], new Map()).tiLeHoan).toBeNull();
  });
});
