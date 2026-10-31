import { describe, expect, it } from "vitest";
import { nhomDong, NHAN_CHUA_PHAN } from "@/lib/nhom-danh-sach";

const d = (id: string, dt: string | null, lo: string | null, het = false) => ({ id, dt, lo, het });
const sap = (x: { het: boolean }) => x.het;

describe("gom cụm danh sách", () => {
  it("gom 2 tầng, đếm dòng và dòng sắp hết hạn, dòng sắp hết hạn lên trước trong cụm", () => {
    const r = nhomDong([d("1", "ONE M", "SUN CREAM"), d("2", "ONE M", "SUN CREAM", true), d("3", "ONE M", "Toner"), d("4", "Melrose", "Toner")], ["dt", "lo"], sap);
    const onem = r.find((c) => c.ten === "ONE M")!;
    expect(onem).toMatchObject({ so: 3, sapHet: 1 });
    expect(onem.con.map((c) => c.ten)).toEqual(["SUN CREAM", "Toner"]);
    expect(onem.con[0].dong.map((x) => x.id)).toEqual(["2", "1"]);
    expect(r.map((c) => c.ten)).toEqual(["ONE M", "Melrose"]);
  });
  it("trống đưa vào Chưa phân nhóm, luôn cuối cùng; không mất dòng nào", () => {
    const r = nhomDong([d("1", null, null), d("2", "Z", null), d("3", "A", "x")], ["dt", "lo"], sap);
    expect(r.map((c) => c.ten)).toEqual(["A", "Z", NHAN_CHUA_PHAN]);
    const tong = (cs: typeof r): number => cs.reduce((a, c) => a + (c.con.length ? tong(c.con) : c.dong.length), 0);
    expect(tong(r)).toBe(3);
  });
  it("một tầng cũng chạy", () => {
    expect(nhomDong([d("1", "A", null), d("2", "A", null)], ["dt"], sap)[0]).toMatchObject({ ten: "A", so: 2 });
  });
});
