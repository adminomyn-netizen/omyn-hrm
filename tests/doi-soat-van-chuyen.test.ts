import { describe, expect, it } from "vitest";
import { chuanMaVanDon, docBangVanChuyen, soVoiSo } from "@/lib/doi-soat-van-chuyen";

const T = "Mã vận đơn\tCOD thu hộ\tCOD đã chuyển\tPhí vận chuyển\tNgày chuyển tiền";
describe("docBangVanChuyen", () => {
  it("thiếu cột bắt buộc", () => {
    expect(docBangVanChuyen("Mã vận đơn\tCOD thu hộ\nA\t1", false).thieuCot).toEqual(["COD đã chuyển"]);
    expect(docBangVanChuyen("", false).thieuCot).toEqual(["file trống"]);
    expect(docBangVanChuyen("Mã vận đơn\tCOD đã chuyển\nA\t1", true).thieuCot[0]).toContain("Phí vận chuyển");
  });
  it("đọc dòng, chuẩn mã vận đơn", () => {
    const r = docBangVanChuyen([T, "ghn 123\t300.000\t300.000\t25.000\t06/11/2026", "B2\t100000\t75000\t25000\t"].join("\n"), false);
    expect(r.dong[0]).toMatchObject({ maVanDon: "GHN123", codThuHo: 300000, codDaChuyen: 300000, phi: 25000, ngayChuyen: "2026-11-06" });
    expect(r.dong[1]).toMatchObject({ codDaChuyen: 75000, ngayChuyen: null });
    expect(chuanMaVanDon(" ab 12 ")).toBe("AB12");
  });
  it("file ghi số đã trừ phí thì cộng phí lại", () => {
    const r = docBangVanChuyen([T, "B2\t100000\t75000\t25000\t"].join("\n"), true);
    expect(r.dong[0].codDaChuyen).toBe(100000);
  });
  it("lỗi từng dòng, cộng gộp mã trùng", () => {
    const r = docBangVanChuyen([T, "\t1\t1\t0\t", "X\t1\tabc\t0\t", "Y\t100\t60\t5\t", "Y\t0\t40\t0\t"].join("\n"), false);
    expect(r.loi.map((l) => l.dong)).toEqual([2, 3]);
    expect(r.dong).toHaveLength(1);
    expect(r.dong[0]).toMatchObject({ maVanDon: "Y", codDaChuyen: 100, codThuHo: 100, phi: 5 });
    expect(r.canhBao.some((c) => c.loi.includes("cộng gộp"))).toBe(true);
  });
});
describe("soVoiSo", () => {
  const d = { dong: 2, maVanDon: "A", codThuHo: 300000, codDaChuyen: 300000, phi: null, ngayChuyen: null };
  it("so với sổ", () => {
    expect(soVoiSo(d, { id: "1", maVanDon: "A", thuHo: 300000, trangThai: "Đã giao" })).toEqual({ chenhCod: false, chuaDaGiao: false, chuyenNhieuHon: false });
    expect(soVoiSo(d, { id: "1", maVanDon: "A", thuHo: 250000, trangThai: "Chờ đóng" })).toEqual({ chenhCod: true, chuaDaGiao: true, chuyenNhieuHon: true });
    expect(soVoiSo({ ...d, codThuHo: null }, { id: "1", maVanDon: "A", thuHo: 0, trangThai: "Đã giao" }).chenhCod).toBe(false);
  });
});
