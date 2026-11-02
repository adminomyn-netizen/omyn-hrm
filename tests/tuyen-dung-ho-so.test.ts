import { describe, expect, it } from "vitest";
import { chuyenYeuCauHopLe, soanBaiDang, tinhBaoCaoTuyenDung } from "@/lib/tuyen-dung";
import { giayToConThieu, kiemTraHoSo, kiemTraTep, tyLeDienHoSo } from "@/lib/ho-so";

describe("yêu cầu tuyển dụng chỉ đi tiến", () => {
  it("đi đúng thứ tự, không nhảy cóc, đã khép thì không mở lại", () => {
    expect(chuyenYeuCauHopLe("Chờ tiếp nhận", "Đã tiếp nhận")).toBe(true);
    expect(chuyenYeuCauHopLe("Chờ tiếp nhận", "Hoàn thành")).toBe(false);
    expect(chuyenYeuCauHopLe("Đã tiếp nhận", "Từ chối")).toBe(false);
    expect(chuyenYeuCauHopLe("Đang đăng tin", "Hoàn thành")).toBe(true);
    for (const kin of ["Hoàn thành", "Từ chối", "Huỷ"]) expect(chuyenYeuCauHopLe(kin, "Đã tiếp nhận")).toBe(false);
  });
});

describe("báo cáo tuyển dụng", () => {
  const tin = [{ id: "t1", vi_tri: "Content", so_luong_can: 2, yeu_cau_id: "y1" }, { id: "t2", vi_tri: "Kế toán", so_luong_can: 1, yeu_cau_id: null }];
  const ungVien = [
    { tin_tuyen_dung_id: "t1", trang_thai: "Nhận việc", nguon: "TopCV", ngay_nhan_viec: "2026-10-20" },
    { tin_tuyen_dung_id: "t1", trang_thai: "Vòng 1", nguon: "TopCV", ngay_nhan_viec: null },
    { tin_tuyen_dung_id: "t1", trang_thai: "Không đạt", nguon: null, ngay_nhan_viec: null },
    { tin_tuyen_dung_id: "t2", trang_thai: "Mới nộp", nguon: "Facebook", ngay_nhan_viec: null },
  ];
  const kenh = [{ tin_tuyen_dung_id: "t1", kenh: "TopCV", chi_phi: 1_500_000 }, { tin_tuyen_dung_id: "t1", kenh: "Facebook", chi_phi: 500_000 }, { tin_tuyen_dung_id: "t2", kenh: "Facebook", chi_phi: 0 }];
  const yeuCau = [{ id: "y1", trang_thai: "Đang đăng tin", tao_luc: "2026-10-10T00:00:00Z" }, { id: "y2", trang_thai: "Chờ tiếp nhận", tao_luc: "2026-10-11T00:00:00Z" }];
  const bc = tinhBaoCaoTuyenDung({ tin, ungVien, kenh, yeuCau });

  it("tổng chi phí, số nhận việc, chi phí mỗi người", () => {
    expect(bc.tongChiPhi).toBe(2_000_000);
    expect(bc.soNhanViec).toBe(1);
    expect(bc.chiPhiMoiNguoi).toBe(2_000_000);
  });
  it("chi phí theo kênh gộp đúng, nguồn trống ghi 'Chưa ghi nguồn'", () => {
    expect(bc.theoKenh.find((k) => k.kenh === "Facebook")).toEqual({ kenh: "Facebook", soBai: 2, chiPhi: 500_000 });
    expect(bc.theoNguon.map((n) => n.nguon)).toContain("Chưa ghi nguồn");
    expect(bc.theoNguon[0]).toMatchObject({ nguon: "TopCV", so: 2, nhanViec: 1 });
  });
  it("theo tin: còn thiếu bao nhiêu người", () => {
    expect(bc.theoTin.find((t) => t.id === "t1")).toMatchObject({ nhanViec: 1, conThieu: 1, chiPhi: 2_000_000 });
    expect(bc.theoTin.find((t) => t.id === "t2")).toMatchObject({ nhanViec: 0, conThieu: 1 });
  });
  it("ngày lấp đầy = từ yêu cầu đến ngày nhận việc đầu tiên", () => expect(bc.ngayLapDayTb).toBe(10));
  it("chưa ai nhận việc thì chi phí mỗi người là null, không chia cho 0", () => {
    expect(tinhBaoCaoTuyenDung({ tin, ungVien: [], kenh, yeuCau }).chiPhiMoiNguoi).toBeNull();
  });
  it("bài đăng soạn sẵn có đủ vị trí, số lượng, hạn nộp", () => {
    const b = soanBaiDang({ vi_tri: "Content", so_luong_can: 2, khoi_ten: "Marketing", han_nop: "2026-11-05", mo_ta: "Viết bài" });
    expect(b).toContain("CONTENT");
    expect(b).toContain("05/11/2026");
    expect(b).toContain("Viết bài");
  });
});

describe("hồ sơ nhân viên", () => {
  it("giấy tờ bắt buộc còn thiếu; tệp đã gỡ hoặc 'Cần bổ sung' không tính", () => {
    const ds = [
      { loai: "CCCD mặt trước", da_go: false, trang_thai: "Đã xác nhận" },
      { loai: "CCCD mặt sau", da_go: true, trang_thai: "Chờ xác nhận" },
      { loai: "Sơ yếu lý lịch", da_go: false, trang_thai: "Cần bổ sung" },
    ];
    expect(giayToConThieu(ds)).toEqual(["CCCD mặt sau", "Sơ yếu lý lịch", "Bằng cấp", "Giấy khám sức khoẻ", "Sổ BHXH", "Hợp đồng lao động", "Cam kết bảo mật (NDA)"]);
  });
  it("kiểm tệp: chỉ PDF/JPG/PNG ≤ 10 MB", () => {
    expect(kiemTraTep("application/pdf", 1000)).toBeNull();
    expect(kiemTraTep("application/zip", 1000)).toMatch(/PDF/);
    expect(kiemTraTep("image/png", 10 * 1024 * 1024 + 1)).toMatch(/10 MB/);
    expect(kiemTraTep("image/png", 0)).toBeTruthy();
  });
  it("kiểm trường: CCCD 9/12 số, MST 10/12/13 số, BHXH 10/12 số (12 số = số CCCD); trống thì bỏ qua", () => {
    expect(kiemTraHoSo({})).toBeNull();
    expect(kiemTraHoSo({ cccd: "001234567890" })).toBeNull();
    expect(kiemTraHoSo({ cccd: "12345" })).toMatch(/CCCD/);
    expect(kiemTraHoSo({ ma_so_thue: "0123456789" })).toBeNull();
    expect(kiemTraHoSo({ ma_so_thue: "12" })).toMatch(/thuế/);
    expect(kiemTraHoSo({ ma_so_thue: "001234567890" })).toBeNull();
    expect(kiemTraHoSo({ ma_so_thue: "00123456789" })).toMatch(/thuế/);
    expect(kiemTraHoSo({ so_bhxh: "001234567890" })).toBeNull();
    expect(kiemTraHoSo({ so_bhxh: "0123456789" })).toBeNull();
    expect(kiemTraHoSo({ so_bhxh: "01234567890" })).toMatch(/BHXH/);
    expect(kiemTraHoSo({ so_bhxh: "123" })).toMatch(/BHXH/);
    expect(kiemTraHoSo({ ngay_sinh: "31/12/1990" })).toMatch(/Ngày sinh/);
  });
  it("tỷ lệ điền hồ sơ", () => {
    expect(tyLeDienHoSo(null)).toBe(0);
    expect(tyLeDienHoSo({ gioi_tinh: "Nữ", cccd: "1" })).toBe(14);
  });
});
