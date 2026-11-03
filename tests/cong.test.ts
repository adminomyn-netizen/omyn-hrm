import { describe, expect, it } from "vitest";
import { congMotNgay, tongHopCong, type DauVaoCongNgay } from "@/lib/cong";

// 18/10/2026 là Chủ nhật; 19–24/10 là thứ Hai–thứ Bảy. "Hôm nay" giả định 24/10/2026.
const nen = (o: Partial<DauVaoCongNgay>): DauVaoCongNgay => ({ ngay: "2026-10-20", homNay: "2026-10-24", laNgayLe: false, coChamCong: false, don: [], ...o });

describe("congMotNgay", () => {
  it("có chấm công = X đủ công", () => {
    expect(congMotNgay(nen({ coChamCong: true }))).toMatchObject({ ma: "X", cong: 1, congLam: 1 });
  });
  it("ngày đã qua không chấm công, không đơn = V, không công", () => {
    expect(congMotNgay(nen({}))).toMatchObject({ ma: "V", cong: 0 });
  });
  it("Chủ nhật không tính, dù có đơn hay chấm công", () => {
    expect(congMotNgay(nen({ ngay: "2026-10-18", coChamCong: true }))).toMatchObject({ ma: "", cong: 0 });
  });
  it("hôm nay chưa chấm công thì chưa kết luận vắng; hôm nay đã chấm thì X", () => {
    expect(congMotNgay(nen({ ngay: "2026-10-24" })).ma).toBe("");
    expect(congMotNgay(nen({ ngay: "2026-10-24", coChamCong: true })).ma).toBe("X");
  });
  it("ngày sau hôm nay = trống", () => {
    expect(congMotNgay(nen({ ngay: "2026-10-26" }))).toMatchObject({ ma: "", cong: 0 });
  });
  it("nghỉ lễ = L có công, kể cả khi vẫn chấm công (không cộng đôi)", () => {
    expect(congMotNgay(nen({ laNgayLe: true, coChamCong: true }))).toMatchObject({ ma: "L", cong: 1, congLam: 0 });
  });
  it("nghỉ lễ trúng Chủ nhật vẫn không tính", () => {
    expect(congMotNgay(nen({ ngay: "2026-10-18", laNgayLe: true })).ma).toBe("");
  });
  it("phép năm cả ngày = P có lương; không lương = KP không công; ốm = O không công", () => {
    const d = (loai: string) => nen({ don: [{ loai, tu_ngay: "2026-10-19", den_ngay: "2026-10-21" }] });
    expect(congMotNgay(d("Nghỉ phép năm"))).toMatchObject({ ma: "P", cong: 1, congLam: 0 });
    expect(congMotNgay(d("Nghỉ không lương"))).toMatchObject({ ma: "KP", cong: 0 });
    expect(congMotNgay(d("Nghỉ ốm"))).toMatchObject({ ma: "O", cong: 0 });
  });
  it("nghỉ chế độ = CĐ không công", () => {
    expect(congMotNgay(nen({ don: [{ loai: "Nghỉ chế độ", tu_ngay: "2026-10-19", den_ngay: "2026-10-23" }] }))).toMatchObject({ ma: "CĐ", cong: 0 });
  });
  it("phép năm nửa ngày + có chấm công buổi còn lại = N đủ 1 công", () => {
    const don = [{ loai: "Nghỉ phép năm", tu_ngay: "2026-10-20", den_ngay: "2026-10-20", gio_tu: "08:30:00", gio_den: "12:00:00" }];
    expect(congMotNgay(nen({ coChamCong: true, don }))).toMatchObject({ ma: "N", cong: 1, congLam: 0.5 });
  });
  it("phép năm nửa ngày nhưng không chấm công buổi còn lại = chỉ 0,5 công phép", () => {
    const don = [{ loai: "Nghỉ phép năm", tu_ngay: "2026-10-20", den_ngay: "2026-10-20", gio_tu: "08:30:00", gio_den: "12:00:00" }];
    expect(congMotNgay(nen({ don }))).toMatchObject({ ma: "N", cong: 0.5, congLam: 0 });
  });
  it("không lương nửa ngày + đi làm = 0,5 công", () => {
    const don = [{ loai: "Nghỉ không lương", tu_ngay: "2026-10-20", den_ngay: "2026-10-20", gio_tu: "13:00:00", gio_den: "17:00:00" }];
    expect(congMotNgay(nen({ coChamCong: true, don }))).toMatchObject({ ma: "N", cong: 0.5, congLam: 0.5 });
  });
  it("nghỉ theo giờ quá 4 tiếng tính cả ngày", () => {
    const don = [{ loai: "Nghỉ phép năm", tu_ngay: "2026-10-20", den_ngay: "2026-10-20", gio_tu: "08:00:00", gio_den: "14:00:00" }];
    expect(congMotNgay(nen({ don }))).toMatchObject({ ma: "P", cong: 1 });
  });
  it("công tác, remote, chấm công ngoài công ty đã duyệt không cần dòng chấm công", () => {
    const d = (loai: string) => nen({ don: [{ loai, tu_ngay: "2026-10-20", den_ngay: "2026-10-20" }] });
    expect(congMotNgay(d("Công tác"))).toMatchObject({ ma: "CT", cong: 1 });
    expect(congMotNgay(d("Làm remote"))).toMatchObject({ ma: "X", cong: 1 });
    expect(congMotNgay(d("Chấm công ngoài công ty"))).toMatchObject({ ma: "X", cong: 1 });
  });
  it("đơn không phủ ngày này thì bỏ qua", () => {
    expect(congMotNgay(nen({ don: [{ loai: "Nghỉ phép năm", tu_ngay: "2026-10-21", den_ngay: "2026-10-22" }] })).ma).toBe("V");
  });
  it("trước ngày vào làm không tính", () => {
    expect(congMotNgay(nen({ ngayVaoLam: "2026-10-22" })).ma).toBe("");
  });
  it("miễn chấm công: ngày làm việc đã qua đủ công, nhưng nghỉ lễ/nghỉ phép vẫn theo mã", () => {
    expect(congMotNgay(nen({ mienChamCong: true }))).toMatchObject({ ma: "X", cong: 1 });
    expect(congMotNgay(nen({ mienChamCong: true, don: [{ loai: "Nghỉ không lương", tu_ngay: "2026-10-20", den_ngay: "2026-10-20" }] }))).toMatchObject({ ma: "KP", cong: 0 });
  });
});

describe("tongHopCong", () => {
  it("gộp mã và công hưởng", () => {
    const o = [
      congMotNgay(nen({ ngay: "2026-10-19", coChamCong: true })),
      congMotNgay(nen({ ngay: "2026-10-20", laNgayLe: true })),
      congMotNgay(nen({ ngay: "2026-10-21", don: [{ loai: "Nghỉ phép năm", tu_ngay: "2026-10-21", den_ngay: "2026-10-21", gio_tu: "08:00:00", gio_den: "12:00:00" }], coChamCong: true })),
      congMotNgay(nen({ ngay: "2026-10-22" })),
    ];
    const t = tongHopCong(o);
    expect(t).toMatchObject({ X: 1, L: 1, N: 1, V: 1, congHuong: 3, congLam: 1.5 });
  });
});

import { congConThieu, lechGioMotNgay } from "@/lib/cong";

describe("lệch giờ và thiếu công trong bảng công", () => {
  const X = { ma: "X" as const, cong: 1, congLam: 1 };
  const homNay = "2026-11-10";
  it("vào trễ hoặc ra sớm thì đánh dấu; đúng giờ thì không", () => {
    expect(lechGioMotNgay(X, { gio_vao: "08:10:00", gio_ra: "17:30:00" }, "2026-11-05", homNay, [])).toBeNull();
    expect(lechGioMotNgay(X, { gio_vao: "08:40:00", gio_ra: "17:30:00" }, "2026-11-05", homNay, [])).toMatchObject({ muon: true, som: false, muonCoDon: false });
    expect(lechGioMotNgay(X, { gio_vao: "08:00:00", gio_ra: "16:30:00" }, "2026-11-05", homNay, [])).toMatchObject({ muon: false, som: true });
  });
  it("có đơn Đi trễ / Về sớm đã duyệt thì ghi nhận nhưng không tính vi phạm", () => {
    const don = [{ loai: "Đi trễ", tu_ngay: "2026-11-05", den_ngay: "2026-11-05" }];
    const r = lechGioMotNgay(X, { gio_vao: "09:00:00", gio_ra: "17:30:00" }, "2026-11-05", homNay, don);
    expect(r).toMatchObject({ muon: true, muonCoDon: true });
    expect(r?.ghiChu).toContain("đã có đơn Đi trễ");
  });
  it("không xét ngày nghỉ nửa ngày, remote/miễn chấm công, thiếu dữ liệu; hôm nay chưa ra thì chưa xét về sớm", () => {
    expect(lechGioMotNgay({ ma: "N", cong: 1, congLam: 0.5 }, { gio_vao: "10:00:00", gio_ra: null }, "2026-11-05", homNay, [])).toBeNull();
    expect(lechGioMotNgay({ ...X, ghiChu: "Làm remote" }, { gio_vao: "10:00:00", gio_ra: null }, "2026-11-05", homNay, [])).toBeNull();
    expect(lechGioMotNgay(X, undefined, "2026-11-05", homNay, [])).toBeNull();
    expect(lechGioMotNgay(X, { gio_vao: "08:00:00", gio_ra: null }, homNay, homNay, [])).toBeNull();
  });
  it("thiếu công: ngày tính công trừ công hưởng", () => {
    const o = [X, X, { ma: "N" as const, cong: 0.5, congLam: 0.5 }, { ma: "V" as const, cong: 0, congLam: 0 }, { ma: "P" as const, cong: 1, congLam: 0 }, { ma: "" as const, cong: 0, congLam: 0 }];
    expect(congConThieu(o)).toEqual({ ngayTinhCong: 5, thieu: 1.5 });
    expect(congConThieu([X, X])).toEqual({ ngayTinhCong: 2, thieu: 0 });
  });
});
