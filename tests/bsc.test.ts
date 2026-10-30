import { describe, expect, it } from "vitest";
import { diemChiSo, diemGop, mucDat, trangThaiViec, type ThangSo } from "@/lib/bsc";

const t = (thang: number, keHoach: number | null, thucTe: number | null): ThangSo => ({ thang, keHoach, thucTe });

describe("diemChiSo", () => {
  const ds = [t(1, 100, 80), t(2, 100, 120), t(3, 100, null)];
  it("cộng dồn: Σ thực tế / Σ kế hoạch các tháng có kế hoạch đến tháng chọn", () => {
    expect(diemChiSo(ds, 2, "Cộng dồn")).toBe(100); // 200/200
    expect(diemChiSo(ds, 1, "Cộng dồn")).toBe(80);
    expect(diemChiSo(ds, 3, "Cộng dồn")).toBe(66.7); // 200/300: tháng 3 có kế hoạch nhưng chưa báo = chưa đạt
  });
  it("trung bình: trung bình % đạt từng tháng có đủ hai số", () => {
    expect(diemChiSo([t(1, 100, 50), t(2, 100, 100), t(3, 100, null)], 3, "Trung bình")).toBe(75);
  });
  it("cuối kỳ: tháng gần nhất có thực tế", () => {
    expect(diemChiSo(ds, 3, "Cuối kỳ")).toBe(120); // tháng 3 chưa báo nên lấy tháng 2: 120/100
  });
  it("trần 120% và chưa có số liệu thì null", () => {
    expect(diemChiSo([t(1, 100, 500)], 1, "Cộng dồn")).toBe(120);
    expect(diemChiSo([t(1, 100, null)], 1, "Cộng dồn")).toBeNull();
    expect(diemChiSo([t(1, null, 10)], 1, "Trung bình")).toBeNull();
    expect(diemChiSo([t(1, 0, 10)], 1, "Cuối kỳ")).toBeNull();
    expect(diemChiSo([t(5, 100, 100)], 3, "Cộng dồn")).toBeNull();
  });
});

describe("diemGop", () => {
  it("trung bình có trọng số, bỏ mục chưa có điểm", () => {
    expect(diemGop([{ diem: 100, trongSo: 60 }, { diem: 50, trongSo: 40 }, { diem: null, trongSo: 20 }]).diem).toBe(80);
  });
  it("trọng số tương đối: tổng ≠ 100 vẫn đúng nhưng cảnh báo", () => {
    const r = diemGop([{ diem: 100, trongSo: 25 }, { diem: 50, trongSo: 25 }]);
    expect(r.diem).toBe(75); expect(r.tongTrongSo).toBe(50); expect(r.canhBao).toBe(true);
    expect(diemGop([{ diem: 90, trongSo: 100 }]).canhBao).toBe(false);
  });
  it("toàn trọng số 0 thì chia đều; không có điểm nào thì null", () => {
    expect(diemGop([{ diem: 100, trongSo: 0 }, { diem: 60, trongSo: 0 }]).diem).toBe(80);
    expect(diemGop([{ diem: null, trongSo: 10 }]).diem).toBeNull();
    expect(diemGop([]).canhBao).toBe(false);
  });
});

describe("việc & mức đạt", () => {
  it("trạng thái việc suy ra từ tiến độ và ngày", () => {
    const v = { tienDo: 0, batDau: "2026-11-01", ketThuc: "2026-11-30" };
    expect(trangThaiViec(v, "2026-10-30")).toBe("Chưa bắt đầu");
    expect(trangThaiViec(v, "2026-11-05")).toBe("Đang làm");
    expect(trangThaiViec({ ...v, tienDo: 30 }, "2026-10-30")).toBe("Đang làm");
    expect(trangThaiViec({ ...v, tienDo: 30 }, "2026-12-01")).toBe("Trễ hạn");
    expect(trangThaiViec({ ...v, tienDo: 100 }, "2026-12-01")).toBe("Hoàn thành");
  });
  it("mức đạt", () => {
    expect([mucDat(null), mucDat(120), mucDat(100), mucDat(85), mucDat(79.9)]).toEqual(["chua", "tot", "tot", "theo-doi", "cham"]);
  });
});
