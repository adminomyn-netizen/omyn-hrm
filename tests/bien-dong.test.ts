import { describe, expect, it } from "vitest";
import { cacThang, tinhBienDong } from "@/lib/bien-dong";

const nv = (id: string, ngayVao: string | null, khoi: string | null = "A", daNghi = false) => ({ id, ngayVao, khoi, daNghi });

describe("biến động nhân sự", () => {
  it("liệt kê đúng 12 tháng qua năm", () => {
    const t = cacThang("2026-02", 12);
    expect(t[0]).toBe("2025-03");
    expect(t[11]).toBe("2026-02");
    expect(t).toHaveLength(12);
  });
  it("đầu kỳ + vào - ra = cuối kỳ, tỷ lệ theo bình quân", () => {
    const kq = tinhBienDong(
      [nv("1", "2026-01-10"), nv("2", "2026-02-05"), nv("3", "2026-02-20", "B", true)],
      [{ nhanVienId: "3", ngayCuoi: "2026-03-15" }],
      "2026-03",
      3,
    );
    expect(kq.thang.map((d) => [d.dauKy, d.vao, d.ra, d.cuoiKy])).toEqual([[0, 1, 0, 1], [1, 2, 0, 3], [3, 0, 1, 2]]);
    expect(kq.thang[2].tyLe).toBe(40);
    expect(kq.tongVao).toBe(3);
    expect(kq.tongRa).toBe(1);
  });
  it("đã nghỉ mà không có ngày nghỉ thì không tính, chỉ đếm để cảnh báo", () => {
    const kq = tinhBienDong([nv("1", "2026-01-10"), nv("2", "2026-01-12", "A", true)], [], "2026-02", 2);
    expect(kq.thieuNgayNghi).toBe(1);
    expect(kq.thang[1].cuoiKy).toBe(1);
  });
  it("không có ai thì tỷ lệ là null, không chia cho 0", () => {
    const kq = tinhBienDong([], [], "2026-02", 2);
    expect(kq.tyLeNam).toBeNull();
    expect(kq.thang[0].tyLe).toBeNull();
  });
});
