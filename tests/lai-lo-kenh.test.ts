import { describe, expect, it } from "vitest";
import { laiLoTheoKenh } from "@/lib/lai-lo-kenh";

const von = new Map([["sp1", 60000]]);
const don = [
  { id: "a", kenh: "Shopee", trangThai: "Đã giao", giaTri: 100000 },
  { id: "b", kenh: "Shopee", trangThai: "Đã giao", giaTri: 200000 },
  { id: "c", kenh: "Shopee", trangThai: "Hoàn trả", giaTri: 50000 },
  { id: "d", kenh: "Shopee", trangThai: "Huỷ", giaTri: 10000 },
  { id: "e", kenh: "TikTok Shop", trangThai: "Đã giao", giaTri: 80000 },
];
const dong = [
  { donId: "a", sanPhamId: "sp1", soLuong: 1, donGia: 100000, chietKhau: 0 },
  { donId: "b", sanPhamId: "sp1", soLuong: 2, donGia: 100000, chietKhau: 0 },
];
describe("laiLoTheoKenh", () => {
  it("tính doanh thu, hoàn, tỷ lệ hoàn theo kênh", () => {
    const r = laiLoTheoKenh(don, dong, von, new Map());
    const s = r.find((x) => x.kenh === "Shopee")!;
    expect(s).toMatchObject({ soDonGiao: 2, doanhThu: 300000, soDonHoan: 1, tienHoan: 50000, tongDon: 4, tyLeHoan: 25 });
    expect(s.laiGop).toBe(40000 + 80000);
    expect(s.soDonCoHang).toBe(2);
    expect(r.find((x) => x.kenh === "TikTok Shop")!.laiGop).toBeNull();
  });
  it("lãi sau phí sàn chỉ tính trên đơn đã đối soát", () => {
    const r = laiLoTheoKenh(don, dong, von, new Map([["a", 12000]])).find((x) => x.kenh === "Shopee")!;
    expect(r).toMatchObject({ soDonDoiSoat: 1, phiSan: 12000, laiGopDoiSoat: 40000, laiSauPhi: 28000 });
  });
  it("chưa đối soát đơn nào thì phí 0 và lãi sau phí tính trên tập rỗng là null", () => {
    const r = laiLoTheoKenh(don, dong, von, new Map()).find((x) => x.kenh === "Shopee")!;
    expect(r).toMatchObject({ soDonDoiSoat: 0, phiSan: 0, laiSauPhi: null });
  });
  it("đối soát nhưng thiếu giá vốn thì lãi sau phí null", () => {
    const r = laiLoTheoKenh(don, dong, new Map(), new Map([["a", 1000]])).find((x) => x.kenh === "Shopee")!;
    expect(r.laiSauPhi).toBeNull();
    expect(r.phiSan).toBe(1000);
  });
});
