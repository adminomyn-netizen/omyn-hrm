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
        expect(goc.chiVaiTro, `${c.ma} ${t.duong_dan}`).toBeUndefined();
      }
    }
  });
  it("nhân viên được mở quyền theo khối thấy tab của khối đó", () => {
    const c = CUM_TAB.find((x) => x.ma === "cong-no-dai-ly")!;
    expect(tabCuaCum(c, "nhan_vien")).toHaveLength(0);
    expect(tabCuaCum(c, "nhan_vien", ["/kinh-doanh/cong-no"]).map((t) => t.duong_dan)).toEqual(["/kinh-doanh/cong-no"]);
  });
});
