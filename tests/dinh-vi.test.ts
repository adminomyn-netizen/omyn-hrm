import { describe, expect, it } from "vitest";
import { khoangCachMet, kiemViTri, type CauHinhViTri } from "@/lib/dinh-vi";

const VP: CauHinhViTri = { ten: "VP", diaChi: "x", viDo: 20.9555, kinhDo: 105.794, banKinhM: 100, daXacNhan: true };
// 1 độ vĩ ≈ 111.195 m → 0,0009° ≈ 100,1 m về phía Bắc.
const lech = (mBac: number, doChinhXac: number | null = 10) => ({ viDo: VP.viDo + mBac / 111_195, kinhDo: VP.kinhDo, doChinhXac });

describe("khoangCachMet", () => {
  it("cùng điểm = 0; 1 độ vĩ ≈ 111,2 km; Hà Nội–Hà Đông đúng cỡ chục km", () => {
    expect(khoangCachMet(VP, VP)).toBe(0);
    expect(khoangCachMet({ viDo: 0, kinhDo: 0 }, { viDo: 1, kinhDo: 0 })).toBeGreaterThan(111_100);
    expect(khoangCachMet({ viDo: 0, kinhDo: 0 }, { viDo: 1, kinhDo: 0 })).toBeLessThan(111_300);
    const hn = khoangCachMet({ viDo: 21.0285, kinhDo: 105.8542 }, VP);
    expect(hn).toBeGreaterThan(8_000);
    expect(hn).toBeLessThan(12_000);
  });
});

describe("kiemViTri", () => {
  it("trong 100 m thì cho, ngoài 100 m thì chặn và nhắc phiếu chấm công ngoài công ty", () => {
    expect(kiemViTri(VP, lech(60))).toEqual({ ok: true, khoangCachM: 60 });
    expect(kiemViTri(VP, lech(100))).toMatchObject({ ok: true });
    const r = kiemViTri(VP, lech(130));
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.ngoaiVung).toBe(true); expect(r.khoangCachM).toBe(130); expect(r.loi).toContain("Chấm công ngoài công ty"); }
  });
  it("thiếu vị trí, toạ độ bậy hoặc GPS kém chính xác thì chặn", () => {
    expect(kiemViTri(VP, null)).toMatchObject({ ok: false });
    expect(kiemViTri(VP, { viDo: NaN, kinhDo: 1, doChinhXac: 5 })).toMatchObject({ ok: false });
    expect(kiemViTri(VP, { viDo: 200, kinhDo: 1, doChinhXac: 5 })).toMatchObject({ ok: false });
    expect(kiemViTri(VP, lech(10, 250))).toMatchObject({ ok: false });
    expect(kiemViTri(VP, lech(10, null))).toMatchObject({ ok: true });
  });
  it("chưa xác nhận vị trí văn phòng thì chưa chặn ai", () => {
    expect(kiemViTri({ ...VP, daXacNhan: false }, null)).toEqual({ ok: true, khoangCachM: null });
    expect(kiemViTri({ ...VP, daXacNhan: false }, lech(5000))).toEqual({ ok: true, khoangCachM: null });
  });
  it("bán kính đổi được", () => {
    expect(kiemViTri({ ...VP, banKinhM: 300 }, lech(250))).toMatchObject({ ok: true });
  });
});
