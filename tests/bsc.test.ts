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

import { tinhCay } from "@/lib/bsc";
describe("tinhCay", () => {
  const goc = [{ id: "g1", ten: "Tài chính" }, { id: "g2", ten: "Khách hàng" }];
  const muc = [{ id: "m1", gocNhinId: "g1", ten: "Tăng doanh thu", moTa: "" }, { id: "m2", gocNhinId: "g2", ten: "Giữ khách", moTa: "" }];
  const cs = [
    { id: "c1", mucTieuId: "m1", ten: "Doanh thu", donVi: "tr", cachGop: "Cộng dồn" as const, trongSo: 60, thangs: [t(1, 100, 100), t(2, 100, 50)] },
    { id: "c2", mucTieuId: "m1", ten: "Biên lợi nhuận", donVi: "%", cachGop: "Cuối kỳ" as const, trongSo: 40, thangs: [t(2, 20, 20)] },
    { id: "c3", mucTieuId: "m2", ten: "Khách quay lại", donVi: "người", cachGop: "Trung bình" as const, trongSo: 100, thangs: [] },
  ];
  it("điểm từng cấp, mục tiêu chưa có số liệu thì null và không kéo góc nhìn xuống", () => {
    const r = tinhCay(goc, muc, cs, 2);
    expect(r.goc[0].mucTieu[0].chiSo[0]).toMatchObject({ diem: 75, keThang: 100, thucThang: 50 }); // (100+50)/(100+100)
    expect(r.goc[0].mucTieu[0].diem).toBe(85); // (75*60 + 100*40)/100
    expect(r.goc[0].diem).toBe(85);
    expect(r.goc[1].diem).toBeNull();
    expect(r.tong).toBe(85);
  });
  it("cảnh báo khi trọng số mục tiêu không đủ 100", () => {
    const r = tinhCay(goc, muc, [{ ...cs[0], trongSo: 30 }, cs[1]], 2);
    expect(r.goc[0].mucTieu[0]).toMatchObject({ tongTrongSo: 70, canhBao: true });
  });
  it("xem đến tháng sau tháng có số liệu vẫn tính dồn các tháng trước", () => expect(tinhCay(goc, muc, cs, 12).tong).toBe(85)); // cộng dồn 150/200 = 75; cuối kỳ lấy tháng 2 = 100
});
