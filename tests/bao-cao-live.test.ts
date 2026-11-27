import { describe, expect, it } from "vitest";
import { tongHopPhienLive, type PhienLive } from "@/lib/bao-cao-live";

const p = (id: string, extra: Partial<PhienLive> = {}): PhienLive => ({ id, ngay: "2026-11-10", nenTang: "TikTok", chuDe: "Live", hostId: "h1", trangThai: "Đã live", doanhThuGhiTay: null, soDonGhiTay: null, mucTieu: null, chiPhiQuangCao: null, gioBatDau: null, gioKetThuc: null, luotXem: null, ...extra });

describe("tongHopPhienLive", () => {
  it("doanh thu lấy từ đơn gắn, trừ huỷ và hoàn trả", () => {
    const r = tongHopPhienLive([p("a")], [{ phienId: "a", giaTri: 100000, trangThai: "Đã giao" }, { phienId: "a", giaTri: 50000, trangThai: "Đang xử lý" }, { phienId: "a", giaTri: 70000, trangThai: "Hoàn trả" }, { phienId: "a", giaTri: 30000, trangThai: "Huỷ" }]);
    expect(r.phien[0]).toMatchObject({ doanhThu: 150000, soDon: 2, nguon: "đơn gắn", soDonHoanHuy: 2 });
  });
  it("không có đơn gắn thì dùng số ghi tay", () => {
    const r = tongHopPhienLive([p("a", { doanhThuGhiTay: 500000, soDonGhiTay: 5 })], []);
    expect(r.phien[0]).toMatchObject({ doanhThu: 500000, soDon: 5, nguon: "ghi tay" });
  });
  it("thiếu số thì để trống, không đoán", () => {
    const r = tongHopPhienLive([p("a")], []);
    expect(r.phien[0]).toMatchObject({ doanhThu: null, nguon: null, phanTramMucTieu: null, doanhThuTrenChiPhi: null, soGio: null });
    expect(r.soPhienThieuDoanhThu).toBe(1);
    expect(r.doanhThu).toBe(0);
  });
  it("% mục tiêu, doanh thu trên chi phí, số giờ", () => {
    const r = tongHopPhienLive([p("a", { doanhThuGhiTay: 3000000, mucTieu: 4000000, chiPhiQuangCao: 1000000, gioBatDau: "2026-11-10T13:00:00+07:00", gioKetThuc: "2026-11-10T15:30:00+07:00" })], []);
    expect(r.phien[0]).toMatchObject({ phanTramMucTieu: 75, doanhThuTrenChiPhi: 3, soGio: 2.5 });
  });
  it("chi phí 0 hoặc mục tiêu 0 thì không chia", () => {
    const r = tongHopPhienLive([p("a", { doanhThuGhiTay: 100, mucTieu: 0, chiPhiQuangCao: 0 })], []);
    expect(r.phien[0]).toMatchObject({ phanTramMucTieu: null, doanhThuTrenChiPhi: null });
  });
  it("tổng chỉ tính phiên đã live; theo host", () => {
    const r = tongHopPhienLive([p("a", { doanhThuGhiTay: 100, soDonGhiTay: 1, chiPhiQuangCao: 10 }), p("b", { doanhThuGhiTay: 300, soDonGhiTay: 3, hostId: "h2" }), p("c", { trangThai: "Lên kế hoạch", doanhThuGhiTay: 999 }), p("d", { trangThai: "Huỷ" })], []);
    expect(r).toMatchObject({ soPhienDaLive: 2, soPhienKeHoach: 1, doanhThu: 400, soDon: 4, chiPhiQuangCao: 10 });
    expect(r.theoHost).toEqual([{ hostId: "h2", soPhien: 1, doanhThu: 300 }, { hostId: "h1", soPhien: 1, doanhThu: 100 }]);
  });
});
