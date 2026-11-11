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
