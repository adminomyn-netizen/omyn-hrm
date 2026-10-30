import { describe, expect, it } from "vitest";
import { apDungGhiNhan, demTheoTinhTrang, phanTramTienDo, tinhTrang, trangThaiSauGhiNhan, xepViec, type Viec } from "@/lib/cong-viec";

const v = (o: Partial<Viec> = {}): Viec => ({ id: "1", tieuDe: "Việc", loai: "Vận hành", nguoiLamId: "n", han: null, uuTien: "Trung bình", mucTieu: 5, daLam: 0, donVi: "", lapLai: "Không", trangThai: "Chưa làm", ...o });
const HN = "2026-10-30";

describe("tinhTrang", () => {
  it("quá hạn chỉ với việc một lần chưa xong có hạn đã qua", () => {
    expect(tinhTrang(v({ han: "2026-10-29" }), 0, HN)).toBe("qua-han");
    expect(tinhTrang(v({ han: "2026-10-29", daLam: 5 }), 0, HN)).toBe("xong");
    expect(tinhTrang(v({ han: "2026-10-29", lapLai: "Hằng ngày" }), 0, HN)).toBe("hom-nay");
  });
  it("hôm nay, đang làm, chưa làm, đã xong, huỷ", () => {
    expect(tinhTrang(v({ han: HN }), 0, HN)).toBe("hom-nay");
    expect(tinhTrang(v({ daLam: 2 }), 0, HN)).toBe("dang-lam");
    expect(tinhTrang(v(), 0, HN)).toBe("chua-lam");
    expect(tinhTrang(v({ trangThai: "Hoàn thành" }), 0, HN)).toBe("xong");
    expect(tinhTrang(v({ trangThai: "Huỷ", daLam: 9 }), 0, HN)).toBe("huy");
  });
  it("việc lặp hằng ngày xong khi đủ số HÔM NAY, ngày khác tính lại", () => {
    const l = v({ lapLai: "Hằng ngày", mucTieu: 3, daLam: 99 });
    expect(tinhTrang(l, 3, HN)).toBe("xong");
    expect(tinhTrang(l, 1, HN)).toBe("hom-nay");
  });
});

describe("xếp, đếm, ghi nhận", () => {
  it("xếp: quá hạn trước, rồi hôm nay, đang làm…, xong cuối; cùng nhóm ưu tiên cao rồi hạn gần", () => {
    const mk = (id: string, o: Partial<Viec>, tt: ReturnType<typeof tinhTrang>) => ({ v: v({ id, tieuDe: id, ...o }), tt });
    const r = xepViec([mk("xong", {}, "xong"), mk("thap", { uuTien: "Thấp" }, "chua-lam"), mk("cao-xa", { uuTien: "Cao", han: "2026-12-01" }, "chua-lam"), mk("cao-gan", { uuTien: "Cao", han: "2026-11-01" }, "chua-lam"), mk("qua", {}, "qua-han")]);
    expect(r.map((x) => x.v.id)).toEqual(["qua", "cao-gan", "cao-xa", "thap", "xong"]);
  });
  it("đếm theo tình trạng", () => expect(demTheoTinhTrang(["xong", "xong", "qua-han"])).toMatchObject({ xong: 2, "qua-han": 1, "hom-nay": 0 }));
  it("% tiến độ trần 100, mục tiêu 0 không lỗi", () => {
    expect([phanTramTienDo(3, 4), phanTramTienDo(9, 4), phanTramTienDo(1, 0)]).toEqual([75, 100, 0]);
  });
  it("ghi nhận không âm, không quá lớn; trạng thái theo số đã làm", () => {
    expect(apDungGhiNhan(2, 1)).toBe(3); expect(apDungGhiNhan(0, -5)).toBe(0); expect(apDungGhiNhan(10, 99999)).toBe(1010);
    expect(trangThaiSauGhiNhan("Chưa làm", 5, 5)).toBe("Hoàn thành");
    expect(trangThaiSauGhiNhan("Hoàn thành", 3, 5)).toBe("Đang làm");
    expect(trangThaiSauGhiNhan("Đang làm", 0, 5)).toBe("Chưa làm");
    expect(trangThaiSauGhiNhan("Huỷ", 9, 5)).toBe("Huỷ");
  });
});
