import { describe, expect, it } from "vitest";
import { chiaTron, chiTietBacThue, congChuanTheoKy, DAU_VAO_TRONG, THAM_SO_MAC_DINH as P, tinhLuong } from "@/lib/luong/tinh-luong";

// Các ví dụ dưới đây tính TAY từ Quy chế (plan Phụ lục D), không sinh từ chính hàm đang test.
describe("chiaTron (nửa lên, số nguyên)", () => {
  it("làm tròn nửa lên", () => {
    expect(chiaTron(1, 1, 2)).toBe(1); // 0,5 → 1
    expect(chiaTron(1, 1, 3)).toBe(0); // 0,33 → 0
    expect(chiaTron(2, 1, 3)).toBe(1); // 0,67 → 1
    expect(chiaTron(10_800_000, 12 * 2, 24 * 2)).toBe(5_400_000);
  });
  it("chia cho 0 trả 0, không NaN", () => {
    expect(chiaTron(5, 3, 0)).toBe(0);
  });
});

describe("tinhLuong", () => {
  it("A — văn phòng đủ công, dưới ngưỡng thuế: 12 triệu thỏa thuận", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_000_000 }, P);
    expect(r.luongChucDanh).toBe(10_800_000);
    expect(r.luongKpi).toBe(1_200_000);
    expect(r.tienAn).toBe(600_000);
    expect(r.tongThuNhap).toBe(12_600_000);
    expect([r.bhXh, r.bhYt, r.bhTn]).toEqual([864_000, 162_000, 108_000]);
    expect(r.thueTncn).toBe(0);
    expect(r.thucLinh).toBe(11_466_000);
  });

  it("B — lương cao: chạm trần BHXH/BHYT, thuế luỹ tiến 3 bậc", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 60_000_000 }, P);
    expect(r.luongChucDanh).toBe(54_000_000);
    expect([r.bhXh, r.bhYt, r.bhTn]).toEqual([4_048_000, 759_000, 540_000]); // nền XH/YT = 50,6 triệu (trần), TN = 54 triệu
    expect(r.thuNhapTinhThue).toBe(39_153_000);
    expect(r.thueTncn).toBe(4_330_600); // 10tr×5% + 20tr×10% + 9.153.000×20%
    expect(r.thucLinh).toBe(50_922_400);
  });

  it("C — thử việc: 85%, không BH, khấu trừ 10%", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 10_000_000, thuViec: true }, P);
    expect(r.luongChucDanh).toBe(7_650_000);
    expect(r.luongKpi).toBe(850_000);
    expect(r.bhXh + r.bhYt + r.bhTn).toBe(0);
    expect(r.thueTncn).toBe(850_000);
    expect(r.thucLinh).toBe(8_250_000);
  });

  it("D — nghỉ nửa tháng: lương chức danh theo tỷ lệ công, KPI không theo công", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_000_000, congHuong: 12, ngayLam: 12 }, P);
    expect(r.luongChucDanh).toBe(5_400_000);
    expect(r.luongKpi).toBe(1_200_000);
    expect(r.tienAn).toBe(300_000);
  });

  it("D2 — công hưởng vượt công chuẩn vẫn bị chặn ở 100%", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_000_000, congHuong: 30 }, P);
    expect(r.luongChucDanh).toBe(10_800_000);
  });

  it("E — tăng ca 4 giờ thường + 2 giờ nghỉ tuần = 562.500 đ", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_000_000, gioOtThuong: 4, gioOtNghiTuan: 2 }, P);
    expect(r.tienOt).toBe(562_500);
    // phần chịu thuế = giờ × lương giờ × 100% = 6 × 56.250 = 337.500 → miễn thuế 225.000
    expect(r.thuNhapTinhThue).toBe(0);
  });

  it("F — %HTKPI tối đa 120%", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_000_000, tyLeHtKpi: 150 }, P);
    expect(r.luongKpi).toBe(1_440_000);
  });

  it("G — người phụ thuộc làm tăng giảm trừ", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 40_000_000, soNguoiPhuThuoc: 2 }, P);
    expect(r.giamTru).toBe(15_500_000 + 2 * 6_200_000);
  });

  it("H — Ban điều hành: không KPI", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 50_000_000, tyLeKpi: 0 }, P);
    expect(r.luongKpi).toBe(0);
    expect(r.luongChucDanh).toBe(50_000_000);
  });

  it("I — tiền ăn miễn thuế tối đa 730.000, phần vượt chịu thuế", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 40_000_000, ngayLam: 40 }, P);
    expect(r.tienAn).toBe(1_000_000);
  });

  it("J — không đóng BH thì không có BH công ty; có đóng thì BH công ty = 23,5% trên nền", () => {
    const co = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_000_000 }, P);
    expect(co.bhCty).toBe(2_538_000); // 10,8 triệu × 23,5%
    const khong = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_000_000, dongBh: false }, P);
    expect(khong.bhCty).toBe(0);
    expect(khong.bhXh).toBe(0);
  });

  it("K — thực lĩnh = tổng thu nhập − BH − thuế − khấu trừ khác (kể cả khấu trừ tạm ứng)", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_000_000, khauTruKhac: 1_000_000, hoaHong: 500_000, thuongKhac: 200_000 }, P);
    expect(r.thucLinh).toBe(r.tongThuNhap - r.bhXh - r.bhYt - r.bhTn - r.thueTncn - 1_000_000);
    expect(r.tongThuNhap).toBe(12_600_000 + 700_000);
  });

  it("L — luôn ra số nguyên, không NaN, với đầu vào lẻ", () => {
    const r = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: 12_345_679, congHuong: 17.5, ngayLam: 17.5, gioOtThuong: 3.5, tyLeHtKpi: 87 }, P);
    for (const [k, v] of Object.entries(r)) expect(Number.isInteger(v), k).toBe(true);
  });
});

describe("congChuanTheoKy", () => {
  it("văn phòng cũng theo tháng: T11/2026 = 25, T10/2026 = 31 − 4 Chủ nhật = 27, T2/2026 = 24", () => {
    expect(congChuanTheoKy("van_phong", 2026, 11)).toBe(25);
    expect(congChuanTheoKy("van_phong", 2026, 10)).toBe(27);
    expect(congChuanTheoKy("van_phong", 2026, 2)).toBe(24);
  });
  it("vận hành T11/2026 = 30 ngày − 5 Chủ nhật = 25 (khớp plan)", () => expect(congChuanTheoKy("van_hanh", 2026, 11)).toBe(25));
  it("vận hành T2/2026 = 28 ngày − 4 Chủ nhật = 24", () => expect(congChuanTheoKy("van_hanh", 2026, 2)).toBe(24));
});

describe("chiTietBacThue (tách thuế 5 bậc để hiển thị)", () => {
  it("34.000.000 đ: 10tr×5% + 20tr×10% + 4tr×20% = 500k + 2tr + 800k = 3.300.000", () => {
    const b = chiTietBacThue(34_000_000, P);
    expect(b.map((x) => [x.bac, x.phan, x.thue])).toEqual([[1, 10_000_000, 500_000], [2, 20_000_000, 2_000_000], [3, 4_000_000, 800_000]]);
    expect(b.reduce((t, x) => t + x.thue, 0)).toBe(3_300_000);
  });
  it("thu nhập 0 hoặc dưới bậc 1 chỉ có bậc 1; 0 thì không có bậc nào", () => {
    expect(chiTietBacThue(0, P)).toEqual([]);
    expect(chiTietBacThue(4_000_000, P).map((x) => x.thue)).toEqual([200_000]);
  });
  it("vượt 100 triệu có đủ 5 bậc, bậc 5 không có trần", () => {
    const b = chiTietBacThue(120_000_000, P);
    expect(b).toHaveLength(5);
    expect(b[4]).toMatchObject({ bac: 5, phan: 20_000_000, den: null, thue: 7_000_000 });
  });
});

describe("tổng thuế theo bậc khớp tinhLuong", () => {
  it("nhiều mức lương, kể cả có phụ thuộc", () => {
    for (const luong of [8_000_000, 25_000_000, 48_000_000, 90_000_000, 150_000_000]) {
      const kq = tinhLuong({ ...DAU_VAO_TRONG, luongThoaThuan: luong, congChuan: 24, congHuong: 24, ngayLam: 24, tyLeKpi: 10, tyLeHtKpi: 100, soNguoiPhuThuoc: 1 }, P);
      expect(chiTietBacThue(kq.thuNhapTinhThue, P).reduce((t, x) => t + x.thue, 0)).toBe(kq.thueTncn);
    }
  });
});
