import { describe, expect, it } from "vitest";
import { chanHoanThanhThieuMinhChung as chan, chuTongHopBaoCao, chuanHoaLink, tinThemViec, mienBaoCaoCv, mocTongHopBaoCao, nhacBaoCaoCv, tenMienLink } from "@/lib/bao-cao-cv";
import { tinhTrang, type Viec } from "@/lib/cong-viec";
import { MAU_CONG_VIEC, sapMauTheoKhoi } from "@/lib/mau-cong-viec";

const g = (h: number, m = 0) => h * 60 + m;

describe("mienBaoCaoCv — ai không phải nộp và được xem tổng quan", () => {
  it("Giám đốc, Phó giám đốc, Tổng giám đốc, Phó tổng giám đốc được miễn", () => {
    for (const c of ["Giám đốc", "Phó giám đốc", "Tổng giám đốc", "Phó tổng giám đốc", "  phó giám đốc "]) expect(mienBaoCaoCv("nhan_vien", c, false)).toBe(true);
  });
  it("Kỹ thuật (theo vai trò) và người giữ cờ quyền giám đốc được miễn", () => {
    expect(mienBaoCaoCv("ky_thuat", null, false)).toBe(true);
    expect(mienBaoCaoCv("nhan_vien", "Nhân viên", true)).toBe(true);
  });
  it("Nhân viên, HCNS, trưởng phòng KHÔNG được miễn — kể cả vai trò Quản trị", () => {
    expect(mienBaoCaoCv("nhan_vien", "Nhân viên", false)).toBe(false);
    expect(mienBaoCaoCv("admin", "Nhân viên", false)).toBe(false);
    expect(mienBaoCaoCv("nhan_vien", "Trưởng phòng", null)).toBe(false);
    expect(mienBaoCaoCv("nhan_vien", null, undefined)).toBe(false);
  });
});

describe("chuanHoaLink — chỉ nhận http/https", () => {
  it("để trống hợp lệ", () => { expect(chuanHoaLink("")).toBe(""); expect(chuanHoaLink("   ")).toBe(""); expect(chuanHoaLink(undefined)).toBe(""); });
  it("nhận https và http; tự thêm https khi dán thiếu", () => {
    expect(chuanHoaLink("https://docs.google.com/spreadsheets/d/abc")).toBe("https://docs.google.com/spreadsheets/d/abc");
    expect(chuanHoaLink("http://example.com/a")).toBe("http://example.com/a");
    expect(chuanHoaLink("docs.google.com/doc/1")).toBe("https://docs.google.com/doc/1");
  });
  it("chặn javascript:, data:, file:, ftp:", () => {
    for (const x of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>", "file:///etc/passwd", "ftp://a.com/x"]) expect(chuanHoaLink(x)).toBeNull();
  });
  it("chặn có khoảng trắng và quá dài", () => {
    expect(chuanHoaLink("https://a.com/x y")).toBeNull();
    expect(chuanHoaLink(`https://a.com/${"x".repeat(500)}`)).toBeNull();
  });
  it("tên miền ngắn bỏ www", () => expect(tenMienLink("https://www.facebook.com/abc")).toBe("facebook.com"));
});

describe("nhacBaoCaoCv — mốc nhắc cố định, chỉ nhắc nộp khi chưa nộp", () => {
  it("sáng 08:30–10:00: nhắc việc hôm nay dù chưa nộp; ngoài khung thì không", () => {
    expect(nhacBaoCaoCv(g(8, 30), 3, false)?.khung).toBe("cv_sang");
    expect(nhacBaoCaoCv(g(8, 30), 3, false)?.noiDung).toContain("3 việc");
    expect(nhacBaoCaoCv(g(8, 30), 0, false)?.tieuDe).toBe("Chưa có việc hôm nay");
    expect(nhacBaoCaoCv(g(8, 29), 3, false)).toBeNull();
    expect(nhacBaoCaoCv(g(10), 3, false)).toBeNull();
  });
  it("chiều tối: 3 mốc 16:45, 17:30, 19:30, đúng khung và đúng ranh giới", () => {
    expect(nhacBaoCaoCv(g(16, 44), 2, false)).toBeNull();
    expect(nhacBaoCaoCv(g(16, 45), 2, false)?.khung).toBe("cv_c1");
    expect(nhacBaoCaoCv(g(17, 29), 2, false)?.khung).toBe("cv_c1");
    expect(nhacBaoCaoCv(g(17, 30), 2, false)?.khung).toBe("cv_c2");
    expect(nhacBaoCaoCv(g(19, 29), 2, false)?.khung).toBe("cv_c2");
    expect(nhacBaoCaoCv(g(19, 30), 2, false)?.khung).toBe("cv_c3");
    expect(nhacBaoCaoCv(g(21, 30), 2, false)).toBeNull();
  });
  it("đã nộp thì không nhắc chiều tối nữa; người chưa có việc nào vẫn bị nhắc nộp", () => {
    for (const p of [g(16, 50), g(18), g(20)]) expect(nhacBaoCaoCv(p, 2, true)).toBeNull();
    expect(nhacBaoCaoCv(g(18), 0, false)?.khung).toBe("cv_c2");
  });
  it("giữa trưa không nhắc gì", () => expect(nhacBaoCaoCv(g(12), 4, false)).toBeNull());
});

describe("tổng hợp cho cấp quản lý", () => {
  it("mốc 17:45–19:00 và 20:00–21:30", () => {
    expect(mocTongHopBaoCao(g(17, 44))).toBeNull();
    expect(mocTongHopBaoCao(g(17, 45))).toBe("cv_tong1");
    expect(mocTongHopBaoCao(g(19))).toBeNull();
    expect(mocTongHopBaoCao(g(20))).toBe("cv_tong2");
    expect(mocTongHopBaoCao(g(21, 30))).toBeNull();
  });
  it("câu chữ: đủ/thiếu/không ai", () => {
    expect(chuTongHopBaoCao(2, 3, ["An"])).toBe("2/3 người đã nộp báo cáo công việc hôm nay. Chưa nộp: An.");
    expect(chuTongHopBaoCao(3, 3, [])).toContain("Tất cả đã nộp");
    expect(chuTongHopBaoCao(0, 8, ["A", "B", "C", "D", "E", "F", "G", "H"])).toContain("và 3 người nữa");
    expect(chuTongHopBaoCao(0, 0, [])).toContain("không có ai");
  });
});

describe("mẫu công việc", () => {
  it("mọi mẫu có việc, tên việc không trùng trong mẫu, không có chỉ tiêu số", () => {
    for (const m of MAU_CONG_VIEC) {
      expect(m.viec.length).toBeGreaterThan(0);
      expect(new Set(m.viec.map((v) => v.toLowerCase())).size).toBe(m.viec.length);
      for (const v of m.viec) expect(v).not.toMatch(/\d/);
    }
  });
  it("sắp mẫu: chung trước, rồi mẫu của khối, đủ tất cả mẫu", () => {
    const ds = sapMauTheoKhoi("Kinh doanh");
    expect(ds[0].ma).toBe("chung");
    expect(ds[1].ma).toBe("kinh-doanh");
    expect(ds.length).toBe(MAU_CONG_VIEC.length);
    expect(sapMauTheoKhoi(null)[0].ma).toBe("chung");
  });
});

describe("chặn hoàn thành khi chưa có minh chứng", () => {
  const co = { phaiCoMinhChung: true, mucTieu: 3, coMinhChung: false, dichHoanThanh: false };
  it("việc một lần: bấm Hoàn thành không link thì bị chặn, có link thì cho", () => {
    expect(chan({ ...co, lapLai: false, daLamMoi: 3, dichHoanThanh: true })).toContain("link minh chứng");
    expect(chan({ ...co, lapLai: false, daLamMoi: 3, dichHoanThanh: true, coMinhChung: true })).toBeNull();
  });
  it("việc một lần: ghi nhận từng phần được, chạm đủ số thì bị chặn", () => {
    expect(chan({ ...co, lapLai: false, daLamMoi: 2 })).toBeNull();
    expect(chan({ ...co, lapLai: false, daLamMoi: 3 })).not.toBeNull();
  });
  it("việc lặp hằng ngày: chạm mục tiêu trong ngày thì cần link hôm nay", () => {
    expect(chan({ ...co, lapLai: true, daLamMoi: 1 })).toBeNull();
    expect(chan({ ...co, lapLai: true, daLamMoi: 3 })).not.toBeNull();
    expect(chan({ ...co, lapLai: true, daLamMoi: 3, coMinhChung: true })).toBeNull();
  });
  it("Giám đốc / Phó giám đốc / Kỹ thuật (không phải báo cáo) không bị chặn", () => {
    expect(chan({ ...co, phaiCoMinhChung: false, lapLai: false, daLamMoi: 3, dichHoanThanh: true })).toBeNull();
  });
  it("việc mục tiêu 1 (mặc định): tick xong lần đầu cũng phải có link", () => {
    expect(chan({ phaiCoMinhChung: true, lapLai: true, daLamMoi: 1, mucTieu: 1, coMinhChung: false, dichHoanThanh: false })).not.toBeNull();
  });
});

describe("thông báo nhân sự vừa thêm việc", () => {
  it("một việc: ghi tên, phòng ban, việc", () => {
    const t = tinThemViec({ hoTen: "Phạm Thị Phượng", khoi: "Hành chính nhân sự", tieuDe: ["Rà bảng công hôm qua"] });
    expect(t.tieuDe).toBe("Nhân sự vừa thêm việc");
    expect(t.noiDung).toBe("Phạm Thị Phượng (Hành chính nhân sự) đã thêm: Rà bảng công hôm qua.");
  });
  it("nhiều việc: gọn, có đếm, cắt tên dài; thiếu phòng ban thì bỏ ngoặc", () => {
    const t = tinThemViec({ hoTen: "An", khoi: null, tieuDe: ["a", "b", "c", "d", "e"] });
    expect(t.tieuDe).toBe("Nhân sự vừa thêm 5 việc");
    expect(t.noiDung).toBe("An đã thêm: a; b; c và 2 việc nữa.");
    expect(tinThemViec({ hoTen: "An", khoi: "X", tieuDe: ["x".repeat(100)] }).noiDung).toContain("…");
  });
});

describe("việc lặp hằng ngày không bị đóng vĩnh viễn", () => {
  const v: Viec = { id: "1", tieuDe: "Chấm công vào và ra", loai: "Hằng ngày", nguoiLamId: "n", han: null, uuTien: "Trung bình", mucTieu: 1, daLam: 0, donVi: "", lapLai: "Hằng ngày", trangThai: "Chưa làm" };
  it("tick xong hôm nay (da_lam = mục tiêu) thì xong; hôm sau số hôm nay về 0 thì lại là việc hôm nay", () => {
    expect(tinhTrang(v, 1, "2026-11-06")).toBe("xong");
    expect(tinhTrang(v, 0, "2026-11-07")).toBe("hom-nay");
  });
  it("bỏ tick (da_lam = 0) thì mở lại ngay trong ngày", () => expect(tinhTrang(v, 0, "2026-11-06")).toBe("hom-nay"));
});
