import { describe, expect, it } from "vitest";
import { thoiHanHopDong, tieuDeHopDong } from "@/lib/hop-dong-in";

describe("bản in hợp đồng lao động", () => {
  it("tiêu đề theo loại", () => {
    expect(tieuDeHopDong("Thử việc")).toBe("HỢP ĐỒNG THỬ VIỆC");
    expect(tieuDeHopDong("Xác định thời hạn")).toBe("HỢP ĐỒNG LAO ĐỘNG");
    expect(tieuDeHopDong("Cộng tác viên")).toBe("HỢP ĐỒNG CỘNG TÁC VIÊN");
    expect(tieuDeHopDong(null)).toBe("HỢP ĐỒNG LAO ĐỘNG");
  });
  it("thời hạn: có đủ ngày, thiếu ngày thì chừa chỗ, không xác định thời hạn", () => {
    expect(thoiHanHopDong("Xác định thời hạn", "2026-11-01", "2027-10-31")).toBe("Từ ngày 01/11/2026 đến ngày 31/10/2027.");
    expect(thoiHanHopDong("Xác định thời hạn", "2026-11-01", null, "…")).toBe("Từ ngày 01/11/2026 đến ngày ….");
    expect(thoiHanHopDong("Không xác định thời hạn", "2026-11-01", null)).toBe("Hợp đồng không xác định thời hạn, có hiệu lực từ ngày 01/11/2026.");
    expect(thoiHanHopDong("Thử việc", null, null, "…")).toBe("Từ ngày … đến ngày ….");
  });
});
