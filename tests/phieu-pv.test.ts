import { describe, expect, it } from "vitest";
import { diemTrungBinhPv, docTieuChi, ghepTieuChi, TIEU_CHI_PV_MAC_DINH } from "@/lib/phieu-pv";

describe("phiếu đánh giá phỏng vấn", () => {
  it("điểm trung bình bỏ tiêu chí để trống, làm tròn 1 chữ số", () => {
    expect(diemTrungBinhPv([{ ten: "a", diem: 4 }, { ten: "b", diem: 5 }, { ten: "c", diem: null }])).toBe(4.5);
    expect(diemTrungBinhPv([{ ten: "a", diem: 3 }, { ten: "b", diem: 4 }, { ten: "c", diem: 4 }])).toBe(3.7);
  });
  it("chưa chấm tiêu chí nào → null (không bịa 0)", () => {
    expect(diemTrungBinhPv([{ ten: "a", diem: null }])).toBeNull();
    expect(diemTrungBinhPv([])).toBeNull();
  });
  it("ghép điểm: trống được, ngoài 1–5 hoặc không nguyên bị từ chối", () => {
    const ok = ghepTieuChi((i) => (i === 0 ? "5" : i === 1 ? "" : "3"));
    expect(ok.tc?.length).toBe(TIEU_CHI_PV_MAC_DINH.length);
    expect(ok.tc?.[0]).toEqual({ ten: "Chuyên môn", diem: 5 });
    expect(ok.tc?.[1].diem).toBeNull();
    expect(ghepTieuChi((i) => (i === 0 ? "6" : "")).loi).toContain("Chuyên môn");
    expect(ghepTieuChi((i) => (i === 2 ? "0" : "")).loi).toContain("Giao tiếp");
    expect(ghepTieuChi((i) => (i === 1 ? "3.5" : "")).loi).toContain("Kinh nghiệm");
    expect(ghepTieuChi((i) => (i === 3 ? "abc" : "")).loi).toContain("Thái độ");
  });
  it("đọc jsonb: bỏ phần tử sai dạng, điểm sai thành null", () => {
    expect(docTieuChi([{ ten: "x", diem: 4 }, { ten: "", diem: 3 }, null, { ten: "y", diem: 9 }, "z"])).toEqual([{ ten: "x", diem: 4 }, { ten: "y", diem: null }]);
    expect(docTieuChi("rác")).toEqual([]);
  });
});

import { chuanHoaGiaTri, type CotHr } from "@/lib/hr-module";
describe("lịch phỏng vấn: chọn nhiều người", () => {
  const c: CotHr = { k: "nguoi_phong_van_ids", nhan: "Người phỏng vấn", kieu: "nhieuNv" };
  const A = "3c82fe09-31a2-4711-a7e3-ca5ea72f6d61", B = "6272ee71-a07d-4105-998b-ef1cc5f9c9b3";
  it("nhiều người: giữ thứ tự, bỏ trùng", () => {
    expect(chuanHoaGiaTri(c, `${A},${B},${A}`)).toEqual({ v: [A, B] });
  });
  it("để trống → mảng rỗng, không lỗi", () => {
    expect(chuanHoaGiaTri(c, "")).toEqual({ v: [] });
  });
  it("mã sai hoặc quá 20 người bị từ chối", () => {
    expect("loi" in chuanHoaGiaTri(c, `${A},abc`)).toBe(true);
    const nhieu = Array.from({ length: 21 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`).join(",");
    expect("loi" in chuanHoaGiaTri(c, nhieu)).toBe(true);
  });
});
