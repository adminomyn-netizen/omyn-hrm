import { describe, expect, it } from "vitest";
import { hoaHongTheoCtv, tinhHoaHong, tyLeApDung } from "@/lib/hoa-hong";

describe("hoa hồng cộng tác viên", () => {
  it("tính hoa hồng làm tròn xuống", () => {
    expect(tinhHoaHong(1000000, 10)).toBe(100000);
    expect(tinhHoaHong(333333, 7)).toBe(23333);
  });
  it("tỷ lệ: ô nhập hơn mặc định của người giới thiệu; không có cả hai thì để trống", () => {
    expect(tyLeApDung(5, { tyLe: 10 })).toBe(5);
    expect(tyLeApDung(null, { tyLe: 10 })).toBe(10);
    expect(tyLeApDung(null, { tyLe: null })).toBeNull();
  });
  it("gom theo người trong kỳ, bỏ đơn huỷ, tách chờ duyệt / phải chi / đã chi", () => {
    const ctv = [{ id: "a", ten: "An", loai: "Cộng tác viên", tyLe: 10, dangHopTac: true }, { id: "b", ten: "Bình", loai: "Đại lý giới thiệu", tyLe: 5, dangHopTac: true }, { id: "c", ten: "Chi", loai: "Cộng tác viên", tyLe: null, dangHopTac: true }];
    const h = (o: object) => ({ ctvId: "a", ngay: "2026-11-02", soTienDon: 1000000, tyLe: 10, soTien: 100000, trangThai: "Chờ duyệt", ...o });
    const r = hoaHongTheoCtv(ctv, [h({}), h({ trangThai: "Đã duyệt" }), h({ trangThai: "Đã chi" }), h({ trangThai: "Huỷ" }), h({ ngay: "2026-10-31" }), h({ ctvId: "b", soTienDon: 2000000, soTien: 100000, tyLe: 5, trangThai: "Đã duyệt" })], "2026-11-01", "2026-11-30");
    expect(r).toEqual([
      { ctvId: "a", ten: "An", soDon: 3, doanhSo: 3000000, choDuyet: 100000, daDuyetChuaChi: 100000, daChi: 100000 },
      { ctvId: "b", ten: "Bình", soDon: 1, doanhSo: 2000000, choDuyet: 0, daDuyetChuaChi: 100000, daChi: 0 },
    ]);
  });
});
