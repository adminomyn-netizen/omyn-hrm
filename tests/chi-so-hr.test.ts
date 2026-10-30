import { describe, expect, it } from "vitest";
import { tinhChiSoHr, type DuLieuHr } from "@/lib/chi-so-hr";
import { tinhBienDong } from "@/lib/bien-dong";
import { tongTheoKy } from "@/lib/bao-cao-luong";

const rong = (): DuLieuHr => ({
  homNay: "2026-10-30", nhanVien: [], tin: [], ungVien: [], kenh: [], yeuCau: [], onboarding: [], nghi: [], khoaHoc: [], dinhBien: [],
  kpi: { chiTieu: [], ketQua: [], nguoi: [], phong: [], kyNhan: "Tháng 10/2026" }, danhGia: [], chuChot: [], thangChuc: [], kyLuong: [], coCau: [],
  soLieuKy: [], suKien: [], taiSan: [], tamUng: [], bienDong: tinhBienDong([], [], "2026-10"),
});
const tatCa = (d: DuLieuHr) => tinhChiSoHr(d).flatMap((n) => n.chiSo);
const tim = (d: DuLieuHr, ma: string) => tatCa(d).find((c) => c.ma === ma)!;

describe("báo cáo HR", () => {
  it("đủ 10 nhóm, 29 chỉ số, tên không còn tiếng Anh trong ngoặc", () => {
    const n = tinhChiSoHr(rong());
    expect(n.map((x) => x.so)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(n.flatMap((x) => x.chiSo)).toHaveLength(29);
    for (const c of n.flatMap((x) => x.chiSo)) expect(c.ten).not.toMatch(/\(.*[A-Za-z].*\)/);
  });

  it("chưa có dữ liệu thì để trống kèm câu cần nhập, không bịa số", () => {
    for (const c of tatCa(rong())) {
      if (c.giaTri === null) expect(c.canNhap, c.ma).toBeTruthy();
      else expect(c.giaTri, c.ma).toMatch(/^0 /);
    }
  });

  it("tỷ lệ đạt thử việc, nguồn tuyển, định biên", () => {
    const d = rong();
    d.onboarding = [{ tinhTrang: "Đạt, lên chính thức" }, { tinhTrang: "Không đạt" }, { tinhTrang: "Đang thử việc" }];
    expect(tim(d, "dat-thu-viec").giaTri).toBe("50%");
    d.ungVien = [
      { tinId: "t", trangThai: "Nhận việc", nguon: "TopCV", ngayNhanHoSo: "2026-10-01", ngayNhanViec: "2026-10-11" },
      { tinId: "t", trangThai: "Mới nộp", nguon: "TopCV", ngayNhanHoSo: null, ngayNhanViec: null },
    ];
    d.tin = [{ id: "t", trangThai: "Đang tuyển", soLuongCan: 3, yeuCauId: null, viTri: "Sale" }];
    expect(tim(d, "thoi-gian-tuyen").giaTri).toBe("10 ngày");
    expect(tim(d, "kenh-tuyen").bang?.dong[0]).toEqual(["TopCV", "2", "1", "50%"]);
    expect(tim(d, "so-vi-tri-mo").phu).toContain("thiếu 2");
    d.nhanVien = [{ id: "a", ten: "A", khoi: "KD", khoiId: "k1", trangThai: "Đang làm", ngayVao: "2026-01-01" }];
    d.dinhBien = [{ khoiId: "k1", khoi: "KD", soNguoi: 3 }];
    expect(tim(d, "dinh-bien").bang?.dong[0]).toEqual(["KD", "3", "1", "-2"]);
  });

  it("quỹ lương so với ngân sách, doanh thu; thiếu doanh thu thì để trống", () => {
    const d = rong();
    d.kyLuong = tongTheoKy([{ id: "k", ten: "T10/2026", thang: 10, nam: 2026, trangThai: "Đã duyệt" }], [
      { kyId: "k", khoi: "KD", tongThuNhap: 1000, thucLinh: 800, bhNld: 0, bhCty: 100, thue: 0, tienOt: 0, phuCapThuc: 0, tienAn: 0 },
      { kyId: "k", khoi: "KD", tongThuNhap: 1000, thucLinh: 800, bhNld: 0, bhCty: 100, thue: 0, tienOt: 0, phuCapThuc: 0, tienAn: 0 },
    ]);
    expect(tim(d, "luong-doanh-thu").giaTri).toBeNull();
    expect(tim(d, "chi-phi-binh-quan").giaTri).toBe("1.100 đ");
    d.soLieuKy = [{ thang: "2026-10", doanhThu: 20000, nganSach: 1500 }];
    expect(tim(d, "luong-doanh-thu").giaTri).toBe("10%");
    expect(tim(d, "quy-luong-ns").phu).toContain("vượt 500");
    expect(tim(d, "doanh-thu-binh-quan").giaTri).toBe("10.000 đ");
  });

  it("hiệu suất thấp liên tiếp và phân loại A/B/C", () => {
    const d = rong();
    d.nhanVien = [{ id: "a", ten: "An", khoi: null, khoiId: null, trangThai: "Đang làm", ngayVao: null }];
    d.danhGia = [
      { nhanVienId: "a", xepLoai: "Cần cải thiện", luc: "2026-08-01" },
      { nhanVienId: "a", xepLoai: "Cần cải thiện", luc: "2026-09-01" },
    ];
    expect(tim(d, "hieu-suat-thap").giaTri).toBe("1 người");
    expect(tim(d, "phan-loai-hs").giaTri).toBe("A 0 · B 0 · C 1");
  });
});
