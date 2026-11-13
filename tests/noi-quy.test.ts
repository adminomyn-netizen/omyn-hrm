import { describe, expect, it } from "vitest";
import { chuanHoaChu, duocQuanLyNoiQuy, duongDanNoiQuy, duongDanNoiQuyHopLe, kiemTepNoiQuy, laLoaiNoiQuy, tenLoaiNoiQuy } from "@/lib/noi-quy";

const UUID = "3f2b8c1e-9a4d-4e7b-8c21-5d6e7f809a1b";

describe("nội quy & chính sách", () => {
  it("chỉ Quản trị và Kỹ thuật được tải lên, xoá", () => {
    expect(duocQuanLyNoiQuy("admin")).toBe(true);
    expect(duocQuanLyNoiQuy("ky_thuat")).toBe(true);
    expect(duocQuanLyNoiQuy("nhan_vien")).toBe(false);
    expect(duocQuanLyNoiQuy("cho_duyet")).toBe(false);
    expect(duocQuanLyNoiQuy(undefined)).toBe(false);
  });
  it("loại tài liệu: chỉ 4 mã đã định nghĩa", () => {
    for (const m of ["noi_quy", "thuong_phat", "hop_dong_mau", "khac"]) expect(laLoaiNoiQuy(m)).toBe(true);
    expect(laLoaiNoiQuy("tuy_y")).toBe(false);
    expect(laLoaiNoiQuy("")).toBe(false);
    expect(tenLoaiNoiQuy("thuong_phat")).toBe("Quy chế thưởng phạt");
  });
  it("đường dẫn kho giữ đuôi tệp và khớp kiểm tra", () => {
    const dd = duongDanNoiQuy(UUID, "Noi quy.PDF");
    expect(dd).toBe(`noi-quy/${UUID}.pdf`);
    expect(duongDanNoiQuyHopLe(dd)).toBe(true);
    expect(duongDanNoiQuyHopLe("noi-quy/../bi-mat.pdf")).toBe(false);
    expect(duongDanNoiQuyHopLe(`ho-so/${UUID}.pdf`)).toBe(false);
    expect(duongDanNoiQuyHopLe(`noi-quy/${UUID}.exe`)).toBe(false);
  });
  it("tệp: từ chối đuôi nguy hiểm và tệp quá 25 MB", () => {
    expect(kiemTepNoiQuy("quy-che.docx", 120_000)).toBeNull();
    expect(kiemTepNoiQuy("tro-choi.html", 1000)).not.toBeNull();
    expect(kiemTepNoiQuy("noi-quy.pdf", 26 * 1024 * 1024)).not.toBeNull();
    expect(kiemTepNoiQuy("noi-quy.pdf", 0)).not.toBeNull();
  });
  it("chuẩn hoá chữ: bỏ khoảng trắng thừa và cắt theo giới hạn", () => {
    expect(chuanHoaChu("  Nội   quy  2026 ", 200)).toBe("Nội quy 2026");
    expect(chuanHoaChu("abcdef", 3)).toBe("abc");
  });
});
