import { describe, expect, it } from "vitest";
import { chuanHoa, docNgay, kiemTraDongNhap, type DongNhap } from "@/lib/nhap-nhan-vien";

const KHOI = [{ id: "k1", ten: "Marketing & Ecom" }, { id: "k2", ten: "Hành chính nhân sự" }];
const TRONG = { ma: new Set<string>(), email: new Set<string>() };
const dong = (o: Partial<DongNhap> = {}): DongNhap => ({ maNhanVien: "", hoTen: "Nguyễn Văn A", chucDanh: "Nhân viên", khoiTen: "Marketing & Ecom", email: "", ngayVaoLam: "05/10/2026", trangThai: "", ...o });

describe("docNgay", () => {
  it("nhận dd/mm/yyyy, yyyy-mm-dd, Date và số seri Excel", () => {
    expect(docNgay("05/10/2026")).toBe("2026-10-05");
    expect(docNgay("2026-10-05")).toBe("2026-10-05");
    expect(docNgay(new Date(Date.UTC(2026, 9, 5)))).toBe("2026-10-05");
    expect(docNgay(46300)).toBe("2026-10-05"); // 46300 = 05/10/2026 trong lịch Excel
  });
  it("từ chối ngày không có thật hoặc rác", () => {
    expect(docNgay("31/02/2026")).toBeNull();
    expect(docNgay("abc")).toBeNull();
    expect(docNgay("")).toBeNull();
    expect(docNgay("05/10/1850")).toBeNull();
  });
});

describe("chuanHoa", () => {
  it("bỏ dấu, đ→d, gộp khoảng trắng", () => expect(chuanHoa("  Hành   chính Đào ")).toBe("hanh chinh dao"));
});

describe("kiemTraDongNhap", () => {
  it("dòng hợp lệ: khối khớp không phân biệt dấu/hoa thường, trạng thái mặc định Đang làm", () => {
    const r = kiemTraDongNhap([dong({ khoiTen: "marketing & ecom", email: "A@x.vn" })], KHOI, TRONG, false);
    expect(r.loi).toEqual([]);
    expect(r.hopLe[0]).toMatchObject({ khoi_id: "k1", email: "a@x.vn", trang_thai: "Đang làm", ngay_vao_lam: "2026-10-05", ma_nhan_vien: null });
  });
  it("báo lỗi theo số dòng Excel (dòng 1 là tiêu đề)", () => {
    const r = kiemTraDongNhap([dong(), dong({ hoTen: "" }), dong({ khoiTen: "Không có" }), dong({ ngayVaoLam: "x" })], KHOI, TRONG, false);
    expect(r.hopLe).toHaveLength(1);
    expect(r.loi.map((l) => l.dong)).toEqual([3, 4, 5]);
  });
  it("trùng mã/email trong tệp và với dữ liệu đã có", () => {
    const co = { ma: new Set(["nv001"]), email: new Set(["c@x.vn"]) };
    const r = kiemTraDongNhap([dong({ maNhanVien: "NV002" }), dong({ maNhanVien: "nv002" }), dong({ maNhanVien: "NV001" }), dong({ email: "c@x.vn" })], KHOI, co, false);
    expect(r.hopLe).toHaveLength(1);
    expect(r.loi).toHaveLength(3);
  });
  it("trạng thái và email sai bị chặn", () => {
    const r = kiemTraDongNhap([dong({ trangThai: "Nghỉ hưu" }), dong({ email: "khong-phai-email" }), dong({ trangThai: "thử việc" })], KHOI, TRONG, false);
    expect(r.hopLe.map((x) => x.trang_thai)).toEqual(["Thử việc"]);
    expect(r.loi).toHaveLength(2);
  });
  it("vị trí tự có quyền Quản trị chỉ Kỹ thuật được nhập", () => {
    const d = [dong({ khoiTen: "Hành chính nhân sự" }), dong({ chucDanh: "Giám đốc" })];
    expect(kiemTraDongNhap(d, KHOI, TRONG, false).loi).toHaveLength(2);
    expect(kiemTraDongNhap(d, KHOI, TRONG, true).loi).toHaveLength(0);
  });
});
