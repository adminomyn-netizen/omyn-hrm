import { describe, expect, it } from "vitest";
import { mucHuongKpi, diemCacNguoi, diemCacPhong, docKy, kyGanDay, kyChua, ngayNhapHopLe, tiLeDat, xepHang, type ChiTieu, type KetQuaNgay, type NguoiKpi } from "@/lib/kpi";

const CT_CAO: ChiTieu = { id: "ct1", khoiId: null, ten: "Cuộc gọi", mucTieuNgay: 20, trongSo: 1, chieu: "Càng cao càng tốt" };
const CT_THAP: ChiTieu = { id: "ct2", khoiId: null, ten: "Lỗi", mucTieuNgay: 2, trongSo: 1, chieu: "Càng thấp càng tốt" };
const kq = (nv: string, ct: string, ngay: string, thucTe: number): KetQuaNgay => ({ nhanVienId: nv, chiTieuId: ct, ngay, thucTe });
const nv = (id: string, khoiId: string | null = "k1"): NguoiKpi => ({ id, hoTen: id, khoiId });

describe("tiLeDat", () => {
  it("càng cao càng tốt: tỉ lệ thường, trần 120%", () => {
    expect(tiLeDat(10, 20, "Càng cao càng tốt")).toBe(0.5);
    expect(tiLeDat(20, 20, "Càng cao càng tốt")).toBe(1);
    expect(tiLeDat(100, 20, "Càng cao càng tốt")).toBe(1.2);
  });
  it("càng thấp càng tốt: đảo ngược, thực tế 0 = trần", () => {
    expect(tiLeDat(4, 2, "Càng thấp càng tốt")).toBe(0.5);
    expect(tiLeDat(2, 2, "Càng thấp càng tốt")).toBe(1);
    expect(tiLeDat(0, 2, "Càng thấp càng tốt")).toBe(1.2);
    expect(tiLeDat(1, 2, "Càng thấp càng tốt")).toBe(1.2);
  });
  it("dữ liệu bậy cho 0, không ném lỗi", () => {
    expect(tiLeDat(-1, 20, "Càng cao càng tốt")).toBe(0);
    expect(tiLeDat(5, 0, "Càng cao càng tốt")).toBe(0);
    expect(tiLeDat(NaN, 20, "Càng cao càng tốt")).toBe(0);
  });
});

describe("diemCacNguoi", () => {
  it("mẫu số là ngày có ai báo: người vắng báo ngày đó bị 0%, ngày không ai báo không tính", () => {
    // 2 ngày có báo. A đạt 100% cả hai; B chỉ báo ngày 1 (đạt 100%) → B = 50%.
    const d = diemCacNguoi([nv("A"), nv("B")], [CT_CAO], [kq("A", "ct1", "2026-10-01", 20), kq("A", "ct1", "2026-10-02", 20), kq("B", "ct1", "2026-10-01", 20)]);
    expect(d.get("A")?.diem).toBe(100);
    expect(d.get("B")?.diem).toBe(50);
  });
  it("trọng số: trung bình có trọng số các chỉ tiêu", () => {
    const nang: ChiTieu = { ...CT_CAO, trongSo: 3 };
    // chỉ tiêu 1 (trọng số 3) đạt 100%, chỉ tiêu 2 (trọng số 1) đạt 0% (lỗi gấp đôi... = 50%): (100*3 + 50*1)/4 = 87.5
    const d = diemCacNguoi([nv("A")], [nang, CT_THAP], [kq("A", "ct1", "2026-10-01", 20), kq("A", "ct2", "2026-10-01", 4)]);
    expect(d.get("A")?.diem).toBe(87.5);
    expect(d.get("A")?.chiTiet).toHaveLength(2);
  });
  it("chỉ tiêu riêng khối chỉ áp cho khối đó; chỉ tiêu chưa có ngày nào thì bỏ qua", () => {
    const rieng: ChiTieu = { ...CT_CAO, id: "ctK2", khoiId: "k2" };
    const d = diemCacNguoi([nv("A", "k1"), nv("B", "k2")], [CT_CAO, rieng], [kq("A", "ct1", "2026-10-01", 20), kq("B", "ct1", "2026-10-01", 10), kq("B", "ctK2", "2026-10-01", 20)]);
    expect(d.get("A")?.chiTiet.map((x) => x.chiTieuId)).toEqual(["ct1"]);
    expect(d.get("B")?.chiTiet.map((x) => x.chiTieuId)).toEqual(["ct1", "ctK2"]);
    expect(d.get("B")?.diem).toBe(75);
  });
  it("kỳ không có dữ liệu thì không có điểm (không phải 0)", () => {
    expect(diemCacNguoi([nv("A")], [CT_CAO], []).size).toBe(0);
  });
});

describe("điểm phòng & xếp hạng", () => {
  it("điểm phòng = trung bình thành viên có điểm; người không báo trong ngày có người báo bị tính 0% và kéo phòng xuống", () => {
    const ns = [nv("A", "k1"), nv("B", "k1"), nv("C", "k2"), nv("D", "k1")];
    const d = diemCacNguoi(ns, [CT_CAO], [kq("A", "ct1", "2026-10-01", 20), kq("B", "ct1", "2026-10-01", 10), kq("C", "ct1", "2026-10-01", 30)]);
    const p = diemCacPhong(ns, d);
    expect(p.get("k1")).toEqual({ diem: 50, soNguoi: 3 }); // (100 + 50 + 0) / 3: D không báo nên 0%
    expect(p.get("k2")).toEqual({ diem: 120, soNguoi: 1 });
  });
  it("hạng kiểu thi đấu: bằng điểm đồng hạng, người sau nhảy hạng", () => {
    const r = xepHang([{ ten: "B", diem: 90 }, { ten: "A", diem: 90 }, { ten: "C", diem: 80 }, { ten: "D", diem: 95 }]);
    expect(r.map((x) => [x.ten, x.hang])).toEqual([["D", 1], ["A", 2], ["B", 2], ["C", 4]]);
  });
});

describe("kỳ", () => {
  it("đọc ngày/tháng/quý, cuối tháng đúng cả năm nhuận", () => {
    expect(docKy("2026-10-30")).toMatchObject({ loai: "ngay", tu: "2026-10-30", den: "2026-10-30", nhan: "30/10/2026" });
    expect(docKy("2026-10")).toMatchObject({ tu: "2026-10-01", den: "2026-10-31", nhan: "Tháng 10/2026" });
    expect(docKy("2028-02")?.den).toBe("2028-02-29");
    expect(docKy("2026-02")?.den).toBe("2026-02-28");
    expect(docKy("2026-Q4")).toMatchObject({ tu: "2026-10-01", den: "2026-12-31", nhan: "Quý 4/2026" });
    expect(docKy("2026-Q1")).toMatchObject({ tu: "2026-01-01", den: "2026-03-31" });
  });
  it("sai định dạng/ngày không có thật thì null", () => {
    for (const s of ["", "2026", "2026-13", "2026-02-30", "2026-Q5", "abc"]) expect(docKy(s), s).toBeNull();
  });
  it("kyChua trả mã kỳ chứa ngày", () => {
    expect(kyChua("2026-11-15", "ngay")).toBe("2026-11-15");
    expect(kyChua("2026-11-15", "thang")).toBe("2026-11");
    expect(kyChua("2026-11-15", "quy")).toBe("2026-Q4");
    expect(kyChua("2026-03-31", "quy")).toBe("2026-Q1");
  });
  it("ngày nhập: không tương lai, không quá 31 ngày về trước", () => {
    expect(ngayNhapHopLe("2026-10-30", "2026-10-30")).toBe(true);
    expect(ngayNhapHopLe("2026-10-31", "2026-10-30")).toBe(false);
    expect(ngayNhapHopLe("2026-09-28", "2026-10-30")).toBe(false);
    expect(ngayNhapHopLe("2026-09-29", "2026-10-30")).toBe(true);
    expect(ngayNhapHopLe("2026-10", "2026-10-30")).toBe(false);
  });
});

describe("kyGanDay", () => {
  it("qua ranh giới tháng và quý/năm", () => {
    const m = (d: string) => Object.fromEntries(kyGanDay(d).map((k) => [k.nhan, k.ma]));
    expect(m("2026-10-30")).toMatchObject({ "Hôm nay": "2026-10-30", "Hôm qua": "2026-10-29", "Tháng này": "2026-10", "Tháng trước": "2026-09", "Quý này": "2026-Q4", "Quý trước": "2026-Q3" });
    expect(m("2027-01-01")).toMatchObject({ "Hôm qua": "2026-12-31", "Tháng trước": "2026-12", "Quý này": "2027-Q1", "Quý trước": "2026-Q4" });
  });
});

import { chuanChucDanh, diemThangCuaNguoi, thangGanDay, thangNhapHopLe, tongTyTrong } from "@/lib/kpi";

describe("Cơ chế KPI theo vị trí, chấm theo tháng", () => {
  const c = (nhomId: string, tyLe: number, tyTrong: number) => ({ nhomId, tyLe, tyTrong });

  it("chức danh so khớp không phân biệt hoa thường và khoảng trắng", () => {
    expect(chuanChucDanh("  Kế  toán Tổng hợp ")).toBe("kế toán tổng hợp");
    expect(chuanChucDanh(null)).toBe("");
  });
  it("tổng tỷ trọng cộng đúng (mẫu 15+20+15+25+25 = 100)", () => {
    expect(tongTyTrong([{ tyTrong: 15 }, { tyTrong: 20 }, { tyTrong: 15 }, { tyTrong: 25 }, { tyTrong: 25 }])).toBe(100);
    expect(tongTyTrong([{ tyTrong: 40 }, { tyTrong: 30 }])).toBe(70);
  });
  it("điểm = Σ % hoàn thành × tỷ trọng / 100", () => {
    const d = diemThangCuaNguoi([c("a", 100, 15), c("b", 80, 20), c("c", 100, 15), c("d", 50, 25), c("e", 90, 25)], 5);
    // 15 + 16 + 15 + 12,5 + 22,5 = 81
    expect(d.diem).toBe(81);
    expect(d.daCham).toBe(5);
    expect(d.tong).toBe(5);
  });
  it("nhóm chưa chấm không bị tính 0: chỉ cộng nhóm đã chấm và báo đã chấm n/m", () => {
    const d = diemThangCuaNguoi([c("a", 100, 15), c("b", 50, 20)], 5);
    expect(d.diem).toBe(25);
    expect(d.daCham).toBe(2);
    expect(d.tong).toBe(5);
  });
  it("chưa chấm nhóm nào thì không có điểm; chấm 0% là 0 điểm, không phải chưa chấm", () => {
    expect(diemThangCuaNguoi([], 5).diem).toBeNull();
    const d = diemThangCuaNguoi([c("a", 0, 20)], 5);
    expect(d.diem).toBe(0);
    expect(d.daCham).toBe(1);
  });
  it("điểm không vượt 100 kể cả khi tổng tỷ trọng cấu hình lố", () => {
    expect(diemThangCuaNguoi([c("a", 100, 70), c("b", 100, 60)], 2).diem).toBe(100);
  });
  it("tỷ trọng ghi tại lúc chấm: đổi tỷ trọng sau này không làm đổi điểm đã chấm", () => {
    const daCham = [c("a", 100, 30)];
    expect(diemThangCuaNguoi(daCham, 1).diem).toBe(30);
  });
  it("tháng chấm hợp lệ: tháng này và 2 tháng trước, không tương lai", () => {
    expect(thangNhapHopLe("2026-11", "2026-11-17")).toBe(true);
    expect(thangNhapHopLe("2026-09", "2026-11-17")).toBe(true);
    expect(thangNhapHopLe("2026-08", "2026-11-17")).toBe(false);
    expect(thangNhapHopLe("2026-12", "2026-11-17")).toBe(false);
    expect(thangNhapHopLe("2026-13", "2026-11-17")).toBe(false);
    expect(thangNhapHopLe("2025-12", "2026-01-05")).toBe(true);
    expect(thangNhapHopLe("2026-11-01", "2026-11-17")).toBe(false);
  });
  it("thangGanDay qua đầu năm", () => {
    expect(thangGanDay("2026-01-10").map((t) => t.ma)).toEqual(["2026-01", "2025-12", "2025-11"]);
  });
});

describe("mucHuongKpi (thang chị Phượng)", () => {
  it("các mốc", () => {
    expect([100, 90, 89.5, 89, 80, 79, 70, 69, 50, 49.9, 0].map(mucHuongKpi)).toEqual([100, 100, 80, 80, 80, 60, 60, 40, 40, 0, 0]);
  });
});
