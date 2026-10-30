import { describe, expect, it } from "vitest";
import { chiPhiDaoTaoTheoThang, quyLuongTheoKhoi, tongTheoKy, type DongLuongBc } from "@/lib/bao-cao-luong";

const d = (kyId: string, khoi: string | null, tongThuNhap: number, bhCty: number): DongLuongBc => ({ kyId, khoi, tongThuNhap, thucLinh: tongThuNhap * 0.8, bhNld: 100, bhCty, thue: 0, tienOt: 0, phuCapThuc: 0, tienAn: 0 });
const ky = [
  { id: "b", ten: "T11/2026", thang: 11, nam: 2026, trangThai: "Đã duyệt" },
  { id: "a", ten: "T10/2026", thang: 10, nam: 2026, trangThai: "Đã duyệt" },
];

describe("báo cáo công lương", () => {
  it("xếp kỳ cũ → mới, chi phí công ty = thu nhập + BH công ty, so với kỳ trước", () => {
    const r = tongTheoKy(ky, [d("a", "X", 1000, 200), d("a", "Y", 1000, 200), d("b", "X", 2000, 400)]);
    expect(r.map((k) => k.id)).toEqual(["a", "b"]);
    expect(r[0].chiPhiCty).toBe(2400);
    expect(r[0].doiChiPhi).toBeNull();
    expect(r[1].soNguoi).toBe(1);
    expect(r[1].chiPhiCty).toBe(2400);
    expect(r[1].doiChiPhi).toBe(0);
  });
  it("quỹ lương theo khối, khối không gán gom riêng, lớn trước", () => {
    const r = quyLuongTheoKhoi([d("a", "X", 500, 50), d("a", null, 900, 90), d("a", "X", 100, 10), d("b", "Z", 9999, 1)], "a");
    expect(r.map((x) => x.khoi)).toEqual(["Chưa gán khối", "X"]);
    expect(r[1]).toMatchObject({ soNguoi: 2, tongThuNhap: 600, chiPhiCty: 660 });
  });
  it("chi phí đào tạo: khoá học tính theo ngày hoàn thành, đợt đào tạo chỉ khi Hoàn thành", () => {
    const m = chiPhiDaoTaoTheoThang(
      [{ ngay: "2026-10-05", chiPhi: 300 }, { ngay: null, chiPhi: 999 }],
      [{ ngay: "2026-10-20", ngan: 700, trangThai: "Hoàn thành" }, { ngay: "2026-10-21", ngan: 5000, trangThai: "Dự kiến" }],
    );
    expect(m.get("2026-10")).toBe(1000);
    expect(m.size).toBe(1);
  });
});
