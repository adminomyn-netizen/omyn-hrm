import { describe, expect, it } from "vitest";
import { jdThanhVanBan } from "@/lib/jd";

describe("JD thành văn bản", () => {
  it("bỏ ô trống, giữ thứ tự mục", () => {
    const v = jdThanhVanBan({ vi_tri: "A", muc_dich: "Lo nội dung", nhiem_vu: "Viết bài\nĐăng bài", yeu_cau: " ", ky_nang: null, quyen_loi: "Thưởng", muc_luong: null });
    expect(v).toBe("Mục đích vị trí:\nLo nội dung\n\nNhiệm vụ chính:\nViết bài\nĐăng bài\n\nQuyền lợi:\nThưởng");
  });
  it("JD trống hoàn toàn ra chuỗi rỗng", () => {
    expect(jdThanhVanBan({ vi_tri: "A", muc_dich: null, nhiem_vu: null, yeu_cau: null, ky_nang: null, quyen_loi: null, muc_luong: null })).toBe("");
  });
});
