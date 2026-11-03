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

import { goiYXuatTruoc, tinhTonLo } from "@/lib/ton-kho";

describe("tồn theo lô và gợi ý xuất trước", () => {
  const lo = [
    { id: "l1", sanPhamId: "s", soLo: "A", hanDung: "2026-12-01", soLuongNhap: null, trangThai: "Còn trong kho" },
    { id: "l2", sanPhamId: "s", soLo: "B", hanDung: "2026-11-20", soLuongNhap: 50, trangThai: "Còn trong kho" },
    { id: "l3", sanPhamId: "s", soLo: "C", hanDung: "2026-10-01", soLuongNhap: 5, trangThai: "Còn trong kho" },
    { id: "l4", sanPhamId: "s", soLo: "D", hanDung: "2026-11-10", soLuongNhap: 9, trangThai: "Đã huỷ hoặc trả" },
    { id: "l5", sanPhamId: "s", soLo: "E", hanDung: "2026-11-30", soLuongNhap: 10, trangThai: "Còn trong kho" },
  ];
  const dong = [
    { sanPhamId: "s", loai: "Nhập", soLuong: 100, soLo: "A" },
    { sanPhamId: "s", loai: "Xuất", soLuong: 30, soLo: "A" },
    { sanPhamId: "s", loai: "Điều chỉnh giảm", soLuong: 5, soLo: " A " },
    { sanPhamId: "s", loai: "Xuất", soLuong: 10, soLo: "E" },
    { sanPhamId: "s", loai: "Xuất", soLuong: 7, soLo: null },
  ];
  it("tính còn lại từng lô, bỏ lô huỷ và lô hết hàng, xếp theo hạn", () => {
    const r = tinhTonLo(lo, dong, "2026-11-03");
    expect(r.map((x) => [x.soLo, x.conLai])).toEqual([["C", 5], ["B", 50], ["A", 65]]);
    expect(r.map((x) => x.muc)).toEqual(["Quá hạn", "Trong 30 ngày", "Trong 30 ngày"]);
    expect(r.find((x) => x.soLo === "A")?.ngayCon).toBe(28);
  });
  it("gợi ý xuất trước: lô còn hạn gần nhất, bỏ qua lô quá hạn", () => {
    const g = goiYXuatTruoc(tinhTonLo(lo, dong, "2026-11-03"));
    expect(g.get("s")?.soLo).toBe("B");
  });
  it("mốc 90 ngày và còn lâu", () => {
    const r = tinhTonLo([{ id: "x", sanPhamId: "s", soLo: "X", hanDung: "2027-01-20", soLuongNhap: 1, trangThai: "Còn trong kho" }, { id: "y", sanPhamId: "s", soLo: "Y", hanDung: "2027-06-01", soLuongNhap: 1, trangThai: "Còn trong kho" }], [], "2026-11-03");
    expect(r.map((x) => x.muc)).toEqual(["Trong 90 ngày", "Còn lâu"]);
  });
});

import { dieuChinhTheoLyDo, xuatNhapTon } from "@/lib/ton-kho";

describe("xuất nhập tồn theo kỳ", () => {
  const sp = [{ id: "s", ma: "A1", ten: "Kem" }, { id: "t", ma: "B1", ten: "Sữa" }, { id: "u", ma: "C1", ten: "Không có phiếu" }];
  const dong = [
    { sanPhamId: "s", loai: "Nhập", soLuong: 100, ngay: "2026-09-15" },
    { sanPhamId: "s", loai: "Xuất", soLuong: 20, ngay: "2026-09-20" },
    { sanPhamId: "s", loai: "Nhập", soLuong: 50, ngay: "2026-10-01", lyDo: null },
    { sanPhamId: "s", loai: "Xuất", soLuong: 30, ngay: "2026-10-31" },
    { sanPhamId: "s", loai: "Điều chỉnh giảm", soLuong: 5, ngay: "2026-10-10", lyDo: "Hết hạn, huỷ" },
    { sanPhamId: "s", loai: "Điều chỉnh tăng", soLuong: 2, ngay: "2026-10-12", lyDo: "Kiểm kê lệch" },
    { sanPhamId: "s", loai: "Xuất", soLuong: 99, ngay: "2026-11-01" },
    { sanPhamId: "t", loai: "Nhập", soLuong: 10, ngay: "2026-10-05" },
    { sanPhamId: "t", loai: "Điều chỉnh giảm", soLuong: 1, ngay: "2026-10-06" },
  ];
  it("tồn đầu, các cột trong kỳ và tồn cuối; kỳ gồm cả hai đầu; ngoài kỳ không tính", () => {
    const r = xuatNhapTon(sp, dong, "2026-10-01", "2026-10-31");
    expect(r.dong).toEqual([
      { id: "s", ma: "A1", ten: "Kem", tonDau: 80, nhap: 50, tang: 2, xuat: 30, giam: 5, tonCuoi: 97 },
      { id: "t", ma: "B1", ten: "Sữa", tonDau: 0, nhap: 10, tang: 0, xuat: 0, giam: 1, tonCuoi: 9 },
    ]);
    expect(r.tong).toEqual({ tonDau: 80, nhap: 60, tang: 2, xuat: 30, giam: 6, tonCuoi: 106 });
  });
  it("tồn cuối kỳ trước bằng tồn đầu kỳ sau", () => {
    const a = xuatNhapTon(sp, dong, "2026-09-01", "2026-09-30").dong[0];
    expect(xuatNhapTon(sp, dong, "2026-10-01", "2026-10-31").dong[0].tonDau).toBe(a.tonCuoi);
  });
  it("điều chỉnh gom theo lý do, thiếu lý do ghi rõ", () => {
    expect(dieuChinhTheoLyDo(dong, "2026-10-01", "2026-10-31")).toEqual([
      { lyDo: "Hết hạn, huỷ", tang: 0, giam: 5 },
      { lyDo: "Kiểm kê lệch", tang: 2, giam: 0 },
      { lyDo: "Chưa ghi lý do", tang: 0, giam: 1 },
    ]);
  });
});

import { duBaoNhap } from "@/lib/ton-kho";

describe("dự báo nhập hàng", () => {
  const sp = [{ id: "a", ma: "A", ten: "Kem" }, { id: "b", ma: "B", ten: "Sữa" }, { id: "c", ma: "C", ten: "Mặt nạ" }, { id: "d", ma: "D", ten: "Dầu" }];
  const dong = [
    { sanPhamId: "a", loai: "Nhập", soLuong: 100, ngay: "2026-09-01" }, { sanPhamId: "a", loai: "Xuất", soLuong: 90, ngay: "2026-10-20" },
    { sanPhamId: "b", loai: "Nhập", soLuong: 500, ngay: "2026-09-01" }, { sanPhamId: "b", loai: "Xuất", soLuong: 30, ngay: "2026-10-20" },
    { sanPhamId: "c", loai: "Nhập", soLuong: 10, ngay: "2026-09-01" }, { sanPhamId: "c", loai: "Xuất", soLuong: 10, ngay: "2026-10-01" }, { sanPhamId: "c", loai: "Xuất", soLuong: 60, ngay: "2026-08-01" },
    { sanPhamId: "d", loai: "Nhập", soLuong: 50, ngay: "2026-09-01" }, { sanPhamId: "d", loai: "Điều chỉnh giảm", soLuong: 5, ngay: "2026-10-20" },
  ];
  it("tốc độ bán 30 ngày, số ngày còn bán, số cần nhập và trạng thái", () => {
    const r = duBaoNhap(sp, dong, "2026-11-03", 30, 20, 30);
    const a = r.find((x) => x.id === "a")!, b = r.find((x) => x.id === "b")!, c = r.find((x) => x.id === "c")!, d = r.find((x) => x.id === "d")!;
    expect(a).toMatchObject({ ton: 10, daBan: 90, tocDoNgay: 3, ngayConBan: 3, canNhap: 140, trangThai: "Cần nhập ngay" });
    expect(b).toMatchObject({ ton: 470, daBan: 30, canNhap: 0, trangThai: "Đủ hàng" });
    expect(c).toMatchObject({ ton: -60, daBan: 0, trangThai: "Chưa có số bán" });
    expect(d).toMatchObject({ ton: 45, daBan: 0, trangThai: "Chưa có số bán" });
  });
  it("bán gần đây mà hết tồn thì xếp đầu, ngoài kỳ không tính", () => {
    const r = duBaoNhap([sp[2]], [{ sanPhamId: "c", loai: "Nhập", soLuong: 10, ngay: "2026-09-01" }, { sanPhamId: "c", loai: "Xuất", soLuong: 10, ngay: "2026-10-30" }], "2026-11-03", 30, 20, 30);
    expect(r[0].trangThai).toBe("Hết hàng");
    expect(r[0].canNhap).toBe(17);
  });
  it("sắp cần nhập: còn bán được hơn ngày hàng về nhưng chưa đủ dự trữ", () => {
    const r = duBaoNhap([sp[0]], [{ sanPhamId: "a", loai: "Nhập", soLuong: 100, ngay: "2026-09-01" }, { sanPhamId: "a", loai: "Xuất", soLuong: 30, ngay: "2026-10-20" }], "2026-11-03", 30, 20, 30);
    expect(r[0]).toMatchObject({ ton: 70, ngayConBan: 70, trangThai: "Đủ hàng" });
    const r2 = duBaoNhap([sp[0]], [{ sanPhamId: "a", loai: "Nhập", soLuong: 100, ngay: "2026-09-01" }, { sanPhamId: "a", loai: "Xuất", soLuong: 60, ngay: "2026-10-20" }], "2026-11-03", 30, 20, 30);
    expect(r2[0]).toMatchObject({ ton: 40, ngayConBan: 20, trangThai: "Cần nhập ngay" });
    const r3 = duBaoNhap([sp[0]], [{ sanPhamId: "a", loai: "Nhập", soLuong: 100, ngay: "2026-09-01" }, { sanPhamId: "a", loai: "Xuất", soLuong: 60, ngay: "2026-10-20" }], "2026-11-03", 30, 10, 30);
    expect(r3[0]).toMatchObject({ trangThai: "Sắp cần nhập" });
  });
});

import { doiSoatCod } from "@/lib/kho";

describe("đối soát COD vận chuyển", () => {
  const d = (o: Partial<{ id: string; ma: string; donVi: string; trangThai: string; ngay: string; ngayGiao: string | null; thuHo: number; daNhan: number; phi: number | null }>) => ({ id: "1", ma: "D1", donVi: "GHN", trangThai: "Đã giao", ngay: "2026-10-20", ngayGiao: "2026-10-22", thuHo: 500000, daNhan: 0, phi: 30000, ...o });
  it("gom theo đơn vị (không phân biệt hoa thường), tính còn treo và quá hạn từ ngày giao", () => {
    const r = doiSoatCod([
      d({ id: "1" }),
      d({ id: "2", ma: "D2", donVi: " ghn ", thuHo: 300000, daNhan: 300000, phi: null }),
      d({ id: "3", ma: "D3", ngayGiao: "2026-11-01", thuHo: 200000, daNhan: 50000 }),
      d({ id: "4", ma: "D4", donVi: "VTP", trangThai: "Hoàn hoặc trả", thuHo: 400000 }),
      d({ id: "5", ma: "D5", trangThai: "Chờ đóng" }),
    ], "2026-11-03", 7);
    const ghn = r.theoDonVi.find((x) => x.donVi === "GHN")!;
    expect(ghn).toMatchObject({ soDon: 3, thuHo: 1000000, daNhan: 350000, conTreo: 650000, soDonQuaHan: 1, phi: 60000, soDonThieuPhi: 1 });
    expect(r.theoDonVi.find((x) => x.donVi === "VTP")).toMatchObject({ soDon: 1, thuHo: 0, conTreo: 0 });
    expect(r.quaHan).toEqual([{ id: "1", ma: "D1", donVi: "GHN", ngayGiao: "2026-10-22", soNgay: 12, conTreo: 500000 }]);
  });
  it("thiếu ngày giao thì tính từ ngày đơn; nhận dư được liệt kê và không làm âm số treo", () => {
    const r = doiSoatCod([d({ id: "1", ngayGiao: null, ngay: "2026-10-30", daNhan: 0 }), d({ id: "2", ma: "D2", thuHo: 100000, daNhan: 150000 })], "2026-11-03", 7);
    expect(r.quaHan).toEqual([]);
    expect(r.nhanDu.map((x) => x.id)).toEqual(["2"]);
    expect(r.theoDonVi[0].conTreo).toBe(500000);
    expect(r.theoDonVi[0].daNhan).toBe(100000);
  });
});

import { phanBoLoFefo } from "@/lib/ton-kho";

describe("chia lô khi xuất (hạn gần trước)", () => {
  const l = (soLo: string, hanDung: string, conLai: number, ngayCon: number) => ({ id: soLo, sanPhamId: "s", soLo, hanDung, conLai, ngayCon, muc: "Còn lâu" as const, trangThai: "Còn trong kho" });
  it("lấy lô hạn gần trước, bỏ lô quá hạn, phần thiếu xuất không số lô", () => {
    const lo = [l("C", "2027-01-01", 100, 60), l("A", "2026-12-01", 5, 28), l("Q", "2026-10-01", 50, -33), l("B", "2026-12-20", 10, 47)];
    expect(phanBoLoFefo(12, lo)).toEqual([{ soLo: "A", soLuong: 5 }, { soLo: "B", soLuong: 7 }]);
    expect(phanBoLoFefo(200, lo)).toEqual([{ soLo: "A", soLuong: 5 }, { soLo: "B", soLuong: 10 }, { soLo: "C", soLuong: 100 }, { soLo: null, soLuong: 85 }]);
    expect(phanBoLoFefo(3, [])).toEqual([{ soLo: null, soLuong: 3 }]);
  });
});
