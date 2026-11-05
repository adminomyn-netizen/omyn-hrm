import { describe, expect, it } from "vitest";
import {
  apDungGhiDe, oDieuKhienDuoc, type GhiDeO, batDauLuong, thanhCong, dungCacO, hangApDung, kiemTraPhieu, laSoPhieu, quyenTrenPhieu, soPhieuText, thangMa, tienBangChu, tienToiBuocSau, xuLyO,
  type HangLuong, type NguCanhNguoiDuyet, type NhanSuDuyet, type O,
} from "@/lib/phe-duyet";
import { MAU_PHIEU, mauTheoMa } from "@/lib/phe-duyet-mau";

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const CTX = { danhMuc: { "Đơn vị làm việc": ["AVI", "ADL", "MSC"], "Bộ phận": ["Phòng Kế Toán"] }, soTep: {} };

describe("mẫu phiếu Lark", () => {
  it("có đủ 19 phiếu, mã duy nhất, ô duy nhất trong mỗi phiếu, ô điều kiện trỏ đúng ô chọn", () => {
    expect(MAU_PHIEU).toHaveLength(19);
    expect(new Set(MAU_PHIEU.map((m) => m.ma)).size).toBe(19);
    for (const m of MAU_PHIEU) {
      const ma = m.truong.map((t) => t.ma);
      expect(new Set(ma).size, m.ma).toBe(ma.length);
      for (const t of m.truong) {
        if (t.hien) {
          const goc = m.truong.find((x) => x.ma === t.hien!.truong);
          expect(goc?.kieu, `${m.ma}.${t.ma}`).toBe("chon");
          for (const v of t.hien.la) expect(goc!.luaChon, `${m.ma}.${t.ma}=${v}`).toContain(v);
        }
        if (t.kieu === "chon") expect(t.luaChon?.length, `${m.ma}.${t.ma}`).toBeGreaterThan(0);
        if (t.kieu === "cong") expect(m.truong.find((x) => x.ma === t.tong!.bang)?.con?.some((c) => c.ma === t.tong!.cot), `${m.ma}.${t.ma}`).toBe(true);
        if (t.bangChuTu) expect(m.truong.find((x) => x.ma === t.bangChuTu)?.kieu).toBe("tien");
        if (t.khongTruoc) expect(m.truong.some((x) => x.ma === t.khongTruoc)).toBe(true);
      }
    }
  });
});

describe("số phiếu", () => {
  it("nhóm-năm tháng-số thứ tự, tìm theo mã", () => {
    expect(thangMa("2026-10-30")).toBe("2610");
    expect(soPhieuText("HR", "2026-10-30", 1)).toBe("HR-2610-0001");
    expect(soPhieuText("FIN", "2027-01-02", 123)).toBe("FIN-2701-0123");
    expect(laSoPhieu("HR-2610-0001")).toBe(true);
    expect(laSoPhieu(" hr-2610 ")).toBe(true);
    expect(laSoPhieu("nguyen van a")).toBe(false);
    expect(() => thangMa("30/10/2026")).toThrow();
  });
});

describe("tiền bằng chữ", () => {
  it.each([
    [0, "Không đồng"], [5, "Năm đồng"], [15, "Mười lăm đồng"], [21, "Hai mươi mốt đồng"], [105, "Một trăm lẻ năm đồng"],
    [25000, "Hai mươi lăm nghìn đồng"], [1500000, "Một triệu năm trăm nghìn đồng"], [1005000, "Một triệu không trăm lẻ năm nghìn đồng"],
    [2_000_000_000, "Hai tỷ đồng"], [1_250_000_000, "Một tỷ hai trăm năm mươi triệu đồng"],
  ])("%i", (n, s) => expect(tienBangChu(n)).toBe(s));
  it("không phải số nguyên không âm → rỗng", () => { expect(tienBangChu(-1)).toBe(""); expect(tienBangChu(1.5)).toBe(""); });
});

describe("kiểm tra phiếu", () => {
  const thanhToan = mauTheoMa("de-nghi-thanh-toan")!;
  const day = { don_vi: "AVI", bo_phan: "Phòng Kế Toán", khoan_chi: "Văn phòng phẩm", noi_dung: "Mua giấy", so_tien: "1.500.000", ngay_can_thanh_toan: "2026-11-02", so_tai_khoan: "123", ten_chu_tk: "A", ngan_hang: "VCB" };
  it("hợp lệ: ép tiền về số, tự điền số tiền bằng chữ, bỏ ô lạ", () => {
    const r = kiemTraPhieu(thanhToan, { ...day, la: "x" }, CTX);
    expect(r.loi).toEqual({});
    expect(r.sach.so_tien).toBe(1500000);
    expect(r.sach.so_tien_bang_chu).toBe("Một triệu năm trăm nghìn đồng");
    expect(r.sach.la).toBeUndefined();
  });
  it("thiếu ô bắt buộc, sai danh mục, ngày sai bị báo; ô không bắt buộc được trống", () => {
    const r = kiemTraPhieu(thanhToan, { ...day, don_vi: "XYZ", noi_dung: " ", ngay_can_thanh_toan: "2026-02-30" }, CTX);
    expect(Object.keys(r.loi).sort()).toEqual(["don_vi", "ngay_can_thanh_toan", "noi_dung"]);
  });
  it("danh mục còn trống thì nhận chữ tự do (Khoản chi chưa cấu hình)", () => {
    expect(kiemTraPhieu(thanhToan, day, CTX).loi.khoan_chi).toBeUndefined();
  });
  it("ô có điều kiện: ẩn thì không bắt buộc và bị bỏ; hiện thì bắt buộc", () => {
    const hoanUng = mauTheoMa("de-nghi-hoan-ung")!;
    const co = kiemTraPhieu(hoanUng, { can_thanh_toan_them: "Có" }, CTX).loi;
    expect(co.ten_chu_tk && co.tai_khoan && co.ngan_hang).toBeTruthy();
    const khong = kiemTraPhieu(hoanUng, { can_thanh_toan_them: "Không", ten_chu_tk: "A" }, CTX);
    expect(khong.loi.ten_chu_tk).toBeUndefined();
    expect(khong.sach.ten_chu_tk).toBeUndefined();
  });
  it("tạm ứng: bảng hạng mục cộng thành tổng dự trù; hạng mục, số tiền dự kiến và ghi chú không bắt buộc", () => {
    const tu = mauTheoMa("de-nghi-tam-ung")!;
    const ok = kiemTraPhieu(tu, { don_vi: "AVI", bo_phan: "Phòng Kế Toán", khoan_chi: "x", noi_dung: "n", so_tien: 300, hang_muc_chi_phi: [{ hang_muc_chi: "a", so_tien: 100 }, { hang_muc_chi: "b", so_tien: 200 }], ngay_can_tam_ung: "2026-11-01", so_tai_khoan: "1", ten_chu_tk: "A", ngan_hang: "B", ghi_chu: "g" }, CTX);
    expect(ok.loi).toEqual({});
    expect(ok.sach.tong_du_tru).toBe(300);
    // Tạm ứng để mua đồ/đi công tác thì chưa phát sinh chi phí: không có bảng, không có số dự kiến, không có ghi chú vẫn nộp được.
    const chuaPhatSinh = kiemTraPhieu(tu, { don_vi: "AVI", bo_phan: "Phòng Kế Toán", khoan_chi: "x", noi_dung: "n", so_tien: 300, ngay_can_tam_ung: "2026-11-01", so_tai_khoan: "1", ten_chu_tk: "A", ngan_hang: "B" }, CTX);
    expect(chuaPhatSinh.loi).toEqual({});
    expect(chuaPhatSinh.sach.tong_du_tru).toBe(0);
    const khongSoTien = kiemTraPhieu(tu, { don_vi: "AVI", bo_phan: "Phòng Kế Toán", khoan_chi: "x", noi_dung: "n", so_tien: 300, hang_muc_chi_phi: [{ hang_muc_chi: "Mua văn phòng phẩm" }], ngay_can_tam_ung: "2026-11-01", so_tai_khoan: "1", ten_chu_tk: "A", ngan_hang: "B" }, CTX);
    expect(khongSoTien.loi).toEqual({});
    // Đã thêm dòng thì vẫn phải ghi tên hạng mục.
    expect(kiemTraPhieu(tu, { hang_muc_chi_phi: [{}] }, CTX).loi["hang_muc_chi_phi.0.hang_muc_chi"]).toBeTruthy();
  });
  it("tệp bắt buộc tính theo số tệp đã đính; kết thúc không được trước bắt đầu; nhiều người nhận", () => {
    const bg = mauTheoMa("ban-giao-tai-san")!;
    const base = { ngay_ban_giao: "2026-11-01", nguoi_nhan: [u(1), u(2), u(1)], muc_dich: "x" };
    expect(kiemTraPhieu(bg, base, CTX).loi.tai_lieu).toBeTruthy();
    const ok = kiemTraPhieu(bg, base, { ...CTX, soTep: { tai_lieu: 1 } });
    expect(ok.loi).toEqual({});
    expect(ok.sach.nguoi_nhan).toEqual([u(1), u(2)]);
    const online = mauTheoMa("xin-phep-lam-online")!;
    expect(kiemTraPhieu(online, { loai: "Cả ngày", tu: "2026-11-02T08:00", den: "2026-11-02T07:00" }, CTX).loi.den).toBeTruthy();
    expect(kiemTraPhieu(online, { loai: "Cả ngày", tu: "2026-11-02T08:00", den: "2026-11-02T17:00" }, CTX).loi).toEqual({});
  });
  it("Một người nhận (không nhiều) không nhận mảng 2 người", () => {
    const tn = mauTheoMa("tiep-nhan-yeu-cau-hanh-chinh")!;
    expect(kiemTraPhieu(tn, { ngay_phat_sinh: "2026-11-01", noi_dung: "x", nguoi_xu_ly: [u(1), u(2)] }, CTX).loi.nguoi_xu_ly).toBeTruthy();
  });
});

describe("luồng duyệt", () => {
  const nv = (n: number, ten: string, chuc: string | null, ql: number | null): NhanSuDuyet => ({ id: u(n), userId: u(100 + n), hoTen: ten, chucDanh: chuc, quanLyId: ql ? u(ql) : null });
  const nop = nv(1, "Nhân viên", "Lễ tân", 2), ql = nv(2, "Quản lý", "Trưởng phòng", 3), gd = nv(3, "Giám đốc A", "Giám đốc", null), kt = nv(4, "Kế toán", "Kế toán", 2);
  const c: NguCanhNguoiDuyet = { nguoiNop: nop, tatCa: [nop, ql, gd, kt], giamDoc: [gd], kyThuat: [{ userId: u(900), ten: "Kỹ thuật" }] };
  const h = (buoc: number, kieu: HangLuong["kieu"], loaiNguoi: HangLuong["loaiNguoi"], mo: Partial<HangLuong> = {}): HangLuong => ({ buoc, tenBuoc: null, kieu, loaiNguoi, chucDanh: null, nhanVienId: null, dieuKienTruong: null, dieuKienGiaTri: null, ...mo });
  const gan = (ds: Omit<O, "id">[]): O[] => ds.map((x, i) => ({ ...x, id: `o${i}` }));

  it("hàng có điều kiện chỉ áp dụng khi ô đúng giá trị", () => {
    const luong = [h(1, "AND", "Quản lý trực tiếp"), h(2, "AND", "Nhân viên", { nhanVienId: u(4), dieuKienTruong: "don_vi", dieuKienGiaTri: "ADL" })];
    expect(hangApDung(luong, { don_vi: "AVI" })).toHaveLength(1);
    expect(hangApDung(luong, { don_vi: "ADL" })).toHaveLength(2);
  });
  it("giải người duyệt: quản lý, cấp trên, chức danh, giám đốc; người nộp không tự duyệt; thiếu người → bỏ qua", () => {
    const o = dungCacO([h(1, "AND", "Quản lý trực tiếp"), h(2, "AND", "Quản lý cấp trên"), h(3, "OR", "Chức danh", { chucDanh: "kế toán" }), h(4, "AND", "Giám đốc"), h(5, "AND", "Chức danh", { chucDanh: "Bác sĩ" })], c);
    expect(o.map((x) => [x.buoc, x.ten, x.trangThai])).toEqual([[1, "Quản lý", "Chờ"], [2, "Giám đốc A", "Chờ"], [3, "Kế toán", "Chờ"], [4, "Giám đốc A", "Chờ"], [5, "(chưa có người: Chức danh Bác sĩ)", "Bỏ qua"]]);
    const tuDuyet = dungCacO([h(1, "AND", "Giám đốc")], { ...c, nguoiNop: gd });
    expect(tuDuyet[0].trangThai).toBe("Bỏ qua");
  });
  it("AND cần đủ mọi người, OR một người đủ, CC chỉ nhận bản sao và không chặn, hết bước → Đã duyệt", () => {
    const o0 = gan(dungCacO([h(1, "AND", "Quản lý trực tiếp"), h(1, "AND", "Chức danh", { chucDanh: "Kế toán" }), h(2, "CC", "Giám đốc"), h(3, "OR", "Chức danh", { chucDanh: "Kế toán" }), h(3, "OR", "Giám đốc")], c));
    const bd = batDauLuong(o0);
    expect(bd.trangThai).toBe("Chờ duyệt"); expect(bd.buocHienTai).toBe(1); expect(bd.canBao.cho.map((x) => x.ten)).toEqual(["Quản lý", "Kế toán"]);
    const a = xuLyO(bd.o, "o0", "Duyệt", 1);
    expect(a.loi).toBeUndefined(); if (!thanhCong(a)) throw 0;
    expect(a.buocHienTai).toBe(1);
    const b = xuLyO(a.o, "o1", "Duyệt", 1); if (!thanhCong(b)) throw 0;
    expect(b.buocHienTai).toBe(3); expect(b.canBao.banSao.map((x) => x.ten)).toEqual(["Giám đốc A"]);
    expect(b.o.find((x) => x.kieu === "CC")!.trangThai).toBe("Đã xem");
    const d = xuLyO(b.o, "o3", "Duyệt", 3); if (!thanhCong(d)) throw 0;
    expect(d.trangThai).toBe("Đã duyệt"); expect(d.o.find((x) => x.id === "o4")!.trangThai).toBe("Bỏ qua");
  });
  it("từ chối dừng phiếu; yêu cầu bổ sung → Cần bổ sung, nộp lại chạy lại từ đầu", () => {
    const o0 = gan(dungCacO([h(1, "AND", "Quản lý trực tiếp"), h(2, "AND", "Giám đốc")], c));
    const bd = batDauLuong(o0);
    const tc = xuLyO(bd.o, "o0", "Từ chối", 1); if (!thanhCong(tc)) throw 0;
    expect(tc.trangThai).toBe("Từ chối"); expect(tc.o.find((x) => x.id === "o1")!.trangThai).toBe("Bỏ qua");
    const bs = xuLyO(bd.o, "o0", "Yêu cầu bổ sung", 1); if (!thanhCong(bs)) throw 0;
    expect(bs.trangThai).toBe("Cần bổ sung");
    const lai = batDauLuong(bs.o);
    expect(lai.trangThai).toBe("Chờ duyệt"); expect(lai.buocHienTai).toBe(1);
  });
  it("chặn: duyệt hai lần, duyệt sai bước, người nhận bản sao", () => {
    const o0 = gan(dungCacO([h(1, "AND", "Quản lý trực tiếp"), h(2, "AND", "Giám đốc"), h(2, "CC", "Kỹ thuật")], c));
    const bd = batDauLuong(o0);
    expect(xuLyO(bd.o, "o1", "Duyệt", 1).loi).toMatch(/chưa tới/);
    const a = xuLyO(bd.o, "o0", "Duyệt", 1); if (!thanhCong(a)) throw 0;
    expect(xuLyO(a.o, "o0", "Duyệt", 2).loi).toMatch(/đã xử lý/);
    expect(xuLyO(a.o, "o2", "Duyệt", 2).loi).toMatch(/bản sao/);
  });
  it("tất cả bước bỏ qua → Đã duyệt ngay (để máy chủ quyết có dùng hay chuyển sang Kỹ thuật)", () => {
    const r = tienToiBuocSau(gan(dungCacO([h(1, "AND", "Chức danh", { chucDanh: "Không ai" })], c)), 0);
    expect(r.trangThai).toBe("Đã duyệt");
  });
  it("quyền trên phiếu", () => {
    const o0 = gan(dungCacO([h(1, "AND", "Quản lý trực tiếp")], c)); const bd = batDauLuong(o0);
    const p = { trangThai: "Chờ duyệt" as const, nguoiNopId: u(1), buocHienTai: 1 };
    expect(quyenTrenPhieu(p, bd.o, { nhanVienId: u(2), userId: u(102) }).oDuyet?.id).toBe("o0");
    expect(quyenTrenPhieu(p, bd.o, { nhanVienId: u(1), userId: u(101) })).toMatchObject({ oDuyet: null, huy: true, suaVaNopLai: false });
    expect(quyenTrenPhieu({ ...p, trangThai: "Cần bổ sung" }, bd.o, { nhanVienId: u(1), userId: u(101) }).suaVaNopLai).toBe(true);
    expect(quyenTrenPhieu({ ...p, trangThai: "Đã duyệt" }, bd.o, { nhanVienId: u(2), userId: u(102) }).oDuyet).toBeNull();
  });
});

describe("đề nghị hoàn ứng: thừa hoặc thiếu, chỉ một trong hai", () => {
  const mau = mauTheoMa("de-nghi-hoan-ung")!;
  const goc = { da_tam_ung: 5_000_000, noi_dung: "x", ho_so: [] };
  it("ứng thừa + chọn Không: tự tính tiền thừa, không có ô thiếu / tài khoản / bằng chữ", () => {
    const r = kiemTraPhieu(mau, { ...goc, thuc_te_chi: 3_000_000, can_thanh_toan_them: "Không", so_tien_thieu: 999, tai_khoan: "1" }, CTX);
    expect(r.loi.can_thanh_toan_them).toBeUndefined();
    expect(r.sach.thua_can_hoan).toBe(2_000_000);
    expect(r.sach.so_tien_thieu).toBeUndefined();
    expect(r.sach.tai_khoan).toBeUndefined();
    expect(r.sach.so_tien_bang_chu).toBeUndefined();
  });
  it("ứng thiếu + chọn Có: tự tính tiền thiếu và bằng chữ, hỏi tài khoản, không có ô thừa", () => {
    const r = kiemTraPhieu(mau, { ...goc, thuc_te_chi: 7_500_000, can_thanh_toan_them: "Có", thua_can_hoan: 5 }, CTX);
    expect(r.loi.can_thanh_toan_them).toBeUndefined();
    expect(r.loi.tai_khoan).toBeTruthy();
    expect(r.loi.so_tien_thieu).toBeUndefined();
    expect(r.sach.so_tien_thieu).toBe(2_500_000);
    expect(String(r.sach.so_tien_bang_chu)).toMatch(/hai triệu năm trăm nghìn/i);
    expect(r.sach.thua_can_hoan).toBeUndefined();
  });
  it("chọn sai chiều thì báo lỗi ở ô Cần thanh toán thêm", () => {
    expect(kiemTraPhieu(mau, { ...goc, thuc_te_chi: 3_000_000, can_thanh_toan_them: "Có" }, CTX).loi.can_thanh_toan_them).toMatch(/chọn “Không”/);
    expect(kiemTraPhieu(mau, { ...goc, thuc_te_chi: 6_000_000, can_thanh_toan_them: "Không" }, CTX).loi.can_thanh_toan_them).toMatch(/chọn “Có”/);
    expect(kiemTraPhieu(mau, { ...goc, thuc_te_chi: 5_000_000, can_thanh_toan_them: "Có" }, CTX).loi.can_thanh_toan_them).toBeTruthy();
    expect(kiemTraPhieu(mau, { ...goc, thuc_te_chi: 5_000_000, can_thanh_toan_them: "Không" }, CTX).loi.can_thanh_toan_them).toBeUndefined();
  });
});

describe("ghi đè ô của Kỹ thuật", () => {
  const mau = mauTheoMa("de-nghi-hoan-ung")!;
  const g = (truong: string, mo: Partial<GhiDeO>): GhiDeO => ({ truong, batBuoc: "Mặc định", cheDoHien: "Mặc định", hienTruong: null, hienGiaTri: null, ...mo });
  it("không có ghi đè thì giữ nguyên; ẩn bỏ ô và bỏ bắt buộc; luôn hiện bỏ điều kiện; điều kiện mới thay điều kiện cũ", () => {
    expect(apDungGhiDe(mau, [])).toBe(mau);
    const m = apDungGhiDe(mau, [g("link_dinh_kem", { cheDoHien: "Ẩn" }), g("ten_chu_tk", { cheDoHien: "Luôn hiện" }), g("tai_khoan", { cheDoHien: "Theo điều kiện", hienTruong: "don_vi", hienGiaTri: ["ADL"] }), g("noi_dung", { batBuoc: "Không bắt buộc" })]);
    const r = kiemTraPhieu(m, { can_thanh_toan_them: "Không", don_vi: "AVI" }, CTX);
    expect(r.loi.link_dinh_kem).toBeUndefined();
    expect(r.loi.ten_chu_tk).toBeTruthy();
    expect(r.loi.tai_khoan).toBeUndefined();
    expect(r.loi.noi_dung).toBeUndefined();
    expect(kiemTraPhieu(m, { don_vi: "ADL" }, CTX).loi.tai_khoan).toBeTruthy();
  });
  it("chỉ ô chọn/danh mục khác chính nó làm được ô điều khiển", () => {
    const ds = oDieuKhienDuoc(mau, "don_vi").map((t) => t.ma);
    expect(ds).toContain("can_thanh_toan_them");
    expect(ds).not.toContain("don_vi");
    expect(ds).not.toContain("noi_dung");
  });
});

describe("khung bút toán kế toán (để sẵn, bổ sung chi tiết sau)", () => {
  it("không bắt buộc, nhập được nhiều dòng; dòng trống hoàn toàn không làm lỗi", () => {
    const tu = mauTheoMa("de-nghi-tam-ung")!;
    const ok = kiemTraPhieu(tu, { but_toan_thanh_toan: [{ no_co: "Nợ", tai_khoan_ke_toan: "1111", so_tien: 1_000_000 }, { no_co: "Có", tai_khoan_ke_toan: "3311", so_tien: 1_000_000 }] }, CTX);
    expect(ok.loi.but_toan_thanh_toan).toBeUndefined();
    expect((ok.sach.but_toan_thanh_toan as unknown[]).length).toBe(2);
    expect(kiemTraPhieu(tu, {}, CTX).loi.but_toan_thanh_toan).toBeUndefined();
    for (const ma of ["de-nghi-thanh-toan", "de-nghi-hoan-ung"]) expect(kiemTraPhieu(mauTheoMa(ma)!, {}, CTX).loi.but_toan_chi_phi).toBeUndefined();
  });
});

describe("ô bổ sung sau khi so với form Lark", () => {
  it("công tác: chi tiết chi phí cộng thành tổng đề nghị; không bắt buộc", () => {
    const m = mauTheoMa("de-xuat-di-cong-tac")!;
    const r = kiemTraPhieu(m, { chi_tiet_chi_phi: [{ so_tien: 500_000 }, { so_tien: 250_000 }] }, CTX);
    expect(r.sach.tong_de_nghi).toBe(750_000);
    expect(kiemTraPhieu(m, {}, CTX).loi.chi_tiet_chi_phi).toBeUndefined();
  });
  it("khen thưởng/kỷ luật: 3 tệp kỷ luật chỉ bắt buộc khi loại là Kỷ luật; điều chỉnh nhân sự cần tệp quyết định", () => {
    const m = mauTheoMa("de-xuat-khen-thuong-ky-luat")!;
    const kl = kiemTraPhieu(m, { loai: "Kỷ luật" }, CTX).loi;
    expect(kl.ban_tuong_trinh && kl.thong_bao_hop_ky_luat && kl.bien_ban_xu_ly_ky_luat).toBeTruthy();
    const kt = kiemTraPhieu(m, { loai: "Khen thưởng" }, CTX).loi;
    expect(kt.ban_tuong_trinh).toBeUndefined();
  });

  it("phiếu làm thêm giờ: số giờ tự tính từ thời gian bắt đầu/kết thúc, không cho nhập", () => {
    const m = mauTheoMa("xac-nhan-lam-them-gio")!;
    const day = { noi_lam_viec: "Omyn", nhan_vien: "Văn phòng", ly_do: "Chốt báo cáo", khung_gio: "Giờ hành chính", tu: "2026-11-05T18:00", den: "2026-11-05T20:30", so_gio: 99 };
    expect(kiemTraPhieu(m, day, CTX).sach.so_gio).toBe(2.5);
    expect(kiemTraPhieu(m, { ...day, den: "2026-11-05T17:00" }, CTX).sach.so_gio).toBeUndefined();
  });
});
