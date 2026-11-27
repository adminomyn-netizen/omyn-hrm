import { describe, expect, it } from "vitest";
import { chuanMaQuet, kenhKhoTuKenhSo, quyetDinhDongGoi, quyetDinhHangHoan } from "@/lib/quet-dong-goi";

const kho = (trangThai: string, extra = {}) => ({ id: "k1", kenh: "Sàn", trangThai, maVanDon: null, dongGoiLuc: null, ...extra });
const so = (trangThai: string, kenh = "Shopee") => ({ id: "s1", kenh, trangThai });

describe("chuanMaQuet", () => {
  it("bỏ ký tự điều khiển và khoảng trắng thừa, giữ chữ hoa", () => {
    expect(chuanMaQuet("  AB\r\n 12 \t")).toBe("AB 12");
    expect(chuanMaQuet("sp\u0000x")).toBe("spx");
  });
});
describe("quyetDinhDongGoi", () => {
  it("chờ đóng thì đóng", () => expect(quyetDinhDongGoi([kho("Chờ đóng")], [])).toEqual({ loai: "dong", id: "k1" }));
  it("đã đóng thì báo quét lại, không đổi", () => expect(quyetDinhDongGoi([kho("Đã đóng", { dongGoiLuc: "2026-11-27T01:00:00Z" })], [])).toEqual({ loai: "daDong", id: "k1", luc: "2026-11-27T01:00:00Z" }));
  it("đã giao hoặc hoàn thì chặn", () => {
    expect(quyetDinhDongGoi([kho("Đã giao")], []).loai).toBe("chan");
    expect(quyetDinhDongGoi([kho("Hoàn hoặc trả")], []).loai).toBe("chan");
  });
  it("chờ đóng nhưng sổ đơn lẻ ghi Huỷ hoặc Hoàn trả thì chặn", () => {
    expect(quyetDinhDongGoi([kho("Chờ đóng")], [so("Huỷ")]).loai).toBe("chan");
    expect(quyetDinhDongGoi([kho("Chờ đóng")], [so("Hoàn trả")]).loai).toBe("chan");
    expect(quyetDinhDongGoi([kho("Chờ đóng")], [so("Đang xử lý")]).loai).toBe("dong");
  });
  it("nhiều dòng trùng mã thì không tự chọn", () => {
    expect(quyetDinhDongGoi([kho("Chờ đóng"), { ...kho("Chờ đóng"), id: "k2" }], []).loai).toBe("trung");
    expect(quyetDinhDongGoi([], [so("Đang xử lý"), { ...so("Đang xử lý", "TikTok Shop"), id: "s2" }]).loai).toBe("trung");
  });
  it("chưa có dòng kho: chỉ đơn đang xử lý mới tạo, kênh sàn ra Sàn", () => {
    expect(quyetDinhDongGoi([], [so("Đang xử lý")])).toEqual({ loai: "tao", donSoId: "s1", kenhKho: "Sàn" });
    expect(quyetDinhDongGoi([], [so("Đang xử lý", "Zalo")])).toMatchObject({ kenhKho: "Khác" });
    expect(quyetDinhDongGoi([], [so("Đã giao")]).loai).toBe("chan");
    expect(quyetDinhDongGoi([], [so("Huỷ")]).loai).toBe("chan");
  });
  it("không thấy ở đâu", () => expect(quyetDinhDongGoi([], [])).toEqual({ loai: "khongThay" }));
  it("kenhKhoTuKenhSo", () => { expect(kenhKhoTuKenhSo("Shopee")).toBe("Sàn"); expect(kenhKhoTuKenhSo("Facebook")).toBe("Khác"); });
});
describe("quyetDinhHangHoan", () => {
  it("một dòng chờ hàng về thì nhận", () => expect(quyetDinhHangHoan([{ id: "h1", tinhTrang: "Chờ hàng về" }], true)).toEqual({ loai: "nhan", id: "h1" }));
  it("đã nhận rồi thì báo, không ghi lại", () => expect(quyetDinhHangHoan([{ id: "h1", tinhTrang: "Đã nhận đủ" }], true)).toEqual({ loai: "daGhi", tinhTrang: "Đã nhận đủ" }));
  it("nhiều dòng chờ thì không tự chọn", () => expect(quyetDinhHangHoan([{ id: "a", tinhTrang: "Chờ hàng về" }, { id: "b", tinhTrang: "Chờ hàng về" }], true).loai).toBe("nhieu"));
  it("có đơn nhưng chưa ghi chi tiết hoàn", () => expect(quyetDinhHangHoan([], true).loai).toBe("chuaGhi"));
  it("không thấy", () => expect(quyetDinhHangHoan([], false).loai).toBe("khongThay"));
});
