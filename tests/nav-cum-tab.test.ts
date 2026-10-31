import { describe, expect, it } from "vitest";
import { CUM_TAB, cumCuaDuongDan, duongDanDangChon, locMenuTheoVaiTro, menuChinh, tabCuaCum } from "@/lib/nav";

describe("cụm tab trong menu", () => {
  it("mỗi cụm chỉ còn một mục trong menu quản trị, các màn khác của cụm ẩn nhưng không mất khỏi danh sách đầy đủ", () => {
    for (const c of CUM_TAB) {
      const trongMenu = locMenuTheoVaiTro("admin").filter((m) => m.cum === c.ma);
      expect(trongMenu, c.ma).toHaveLength(1);
      expect(trongMenu[0].ten).toBe(c.ten);
      for (const t of c.tabs) expect(menuChinh.some((m) => m.duong_dan === t.duong_dan), `${c.ma} ${t.duong_dan}`).toBe(true);
      expect(c.tabs.some((t) => t.duong_dan === c.chinh)).toBe(true);
    }
  });
  it("không có đường dẫn nào nằm trong hai cụm; tên cụm không trùng", () => {
    const duong = CUM_TAB.flatMap((c) => c.tabs.map((t) => t.duong_dan));
    expect(new Set(duong).size).toBe(duong.length);
    expect(new Set(CUM_TAB.map((c) => c.ma)).size).toBe(CUM_TAB.length);
  });
  it("trang thuộc cụm thì nhận ra cụm và đánh dấu đúng mục menu; trang ngoài cụm không bị nhận nhầm (kể cả /hr/...)", () => {
    expect(cumCuaDuongDan("/kinh-doanh/cong-no")?.ma).toBe("cong-no-dai-ly");
    expect(cumCuaDuongDan("/hr/cong-no-dai-ly")?.ma).toBe("cong-no-dai-ly");
    expect(cumCuaDuongDan("/hr/pd-danh-muc")).toBeNull();
    expect(cumCuaDuongDan("/hr/nhan-vien-la")).toBeNull();
    const menu = locMenuTheoVaiTro("admin");
    expect(duongDanDangChon("/kinh-doanh/cong-no", menu)).toBe(menu.find((m) => m.cum === "cong-no-dai-ly")!.duong_dan);
  });
  it("tab chỉ hiện đúng quyền: nhân viên thường không thấy màn quản lý", () => {
    for (const c of CUM_TAB) {
      for (const t of tabCuaCum(c, "nhan_vien")) {
        const goc = menuChinh.find((m) => m.duong_dan === t.duong_dan)!;
        expect(!goc.chiVaiTro || goc.chiVaiTro.includes("nhan_vien"), `${c.ma} ${t.duong_dan}`).toBe(true);
      }
    }
  });
  it("nhân viên được mở quyền theo khối thấy tab của khối đó", () => {
    const c = CUM_TAB.find((x) => x.ma === "cong-no-dai-ly")!;
    expect(tabCuaCum(c, "nhan_vien")).toHaveLength(0);
    expect(tabCuaCum(c, "nhan_vien", ["/kinh-doanh/cong-no"]).map((t) => t.duong_dan)).toEqual(["/kinh-doanh/cong-no"]);
  });
});

describe("cụm Tuyển dụng", () => {
  const c = CUM_TAB.find((x) => x.ma === "tuyen-dung")!;
  it("Yêu cầu tuyển dụng là màn riêng của nhân viên (giữ nguyên quyền cũ): quản trị thấy 3 tab, nhân viên chỉ 1 tab nên không có thanh tab, mục menu dẫn đúng chỗ", () => {
    expect(tabCuaCum(c, "admin").map((t) => t.duong_dan)).toEqual(["/tuyen-dung", "/hr", "/hr/de-xuat-phe-duyet"]);
    expect(tabCuaCum(c, "nhan_vien").map((t) => t.duong_dan)).toEqual(["/yeu-cau-tuyen-dung"]);
    expect(locMenuTheoVaiTro("admin").find((m) => m.cum === "tuyen-dung")!.duong_dan).toBe("/tuyen-dung");
    expect(locMenuTheoVaiTro("nhan_vien").find((m) => m.cum === "tuyen-dung")!.duong_dan).toBe("/yeu-cau-tuyen-dung");
  });
  it("/hr chỉ là Sổ tuyển dụng; các trang /hr/ khác không bị tính vào cụm", () => {
    expect(cumCuaDuongDan("/hr")?.ma).toBe("tuyen-dung");
    expect(cumCuaDuongDan("/hr/muc-tieu-tuyen-dung")).toBeNull();
    expect(cumCuaDuongDan("/hr/de-xuat-phe-duyet")?.ma).toBe("tuyen-dung");
    expect(cumCuaDuongDan("/tuyen-dung/abc-123")?.ma).toBe("tuyen-dung");
  });
});

describe("cụm Lương", () => {
  const c = CUM_TAB.find((x) => x.ma === "luong")!;
  it("quản trị thấy đủ 8 tab; nhân viên chỉ thấy Bảng lương (phiếu lương của mình) nên không có thanh tab; giữ riêng Chấm công, Bảng công, Quỹ phép", () => {
    expect(tabCuaCum(c, "admin")).toHaveLength(8);
    expect(tabCuaCum(c, "nhan_vien").map((t) => t.duong_dan)).toEqual(["/luong"]);
    for (const p of ["/cham-cong", "/bang-cong", "/quy-phep"]) expect(cumCuaDuongDan(p), p).toBeNull();
  });
});

describe("cụm Cài đặt phiếu", () => {
  const c = CUM_TAB.find((x) => x.ma === "cai-dat-phieu")!;
  it("Kỹ thuật thấy 3 tab; Quản trị thấy 2 (Setup luồng phiếu vốn chỉ của Kỹ thuật); nhân viên không thấy gì; Phê duyệt và Kỹ thuật không bị kéo vào cụm", () => {
    expect(tabCuaCum(c, "ky_thuat")).toHaveLength(3);
    expect(tabCuaCum(c, "admin").map((t) => t.duong_dan)).toEqual(["/phe-duyet/lua-chon", "/phan-quyen-nghiep-vu"]);
    expect(tabCuaCum(c, "nhan_vien")).toHaveLength(0);
    expect(locMenuTheoVaiTro("nhan_vien").some((m) => m.cum === "cai-dat-phieu")).toBe(false);
    expect(cumCuaDuongDan("/phe-duyet")).toBeNull();
    expect(cumCuaDuongDan("/ky-thuat")).toBeNull();
    expect(cumCuaDuongDan("/ky-thuat/luong-phieu")?.ma).toBe("cai-dat-phieu");
  });
});
