import { describe, expect, it } from "vitest";
import { duongDanHopLe, duongDanTrongKho, duoiTep, dungLuong, GIOI_HAN_TEP, kiemTep, laManTep } from "@/lib/tep-dinh-kem";

describe("đính kèm tệp: kiểm tra", () => {
  it("nhận PDF, ảnh, Word, Excel, zip; từ chối đuôi lạ, tệp rỗng, quá 25MB", () => {
    expect(kiemTep("a.pdf", 100)).toBeNull();
    expect(kiemTep("(완료)CFS_HUSKIN SUN CREAM.pdf", 5_000_000)).toBeNull();
    expect(kiemTep("x.XLS", 10)).toBeNull();
    expect(kiemTep("virus.exe", 10)).toMatch(/Chỉ nhận/);
    expect(kiemTep("khong-duoi", 10)).toMatch(/Chỉ nhận/);
    expect(kiemTep("a.pdf", 0)).toMatch(/rỗng/);
    expect(kiemTep("a.zip", GIOI_HAN_TEP)).toBeNull();
    expect(kiemTep("a.zip", GIOI_HAN_TEP + 1)).toMatch(/25 MB/);
  });
  it("đường dẫn trong kho chỉ gồm mã ngẫu nhiên + đuôi; chỉ chấp nhận đúng mẫu của dòng đó", () => {
    const dong = "11111111-1111-1111-1111-111111111111";
    const ma = "22222222-2222-2222-2222-222222222222";
    const p = duongDanTrongKho("so-hop-dong", dong, ma, "(완료)LOA.PDF");
    expect(p).toBe(`so-hop-dong/${dong}/${ma}.pdf`);
    expect(duongDanHopLe("so-hop-dong", dong, p)).toBe(true);
    expect(duongDanHopLe("so-cong-bo", dong, p)).toBe(false);
    expect(duongDanHopLe("so-hop-dong", dong, `so-hop-dong/${dong}/../x.pdf`)).toBe(false);
  });
  it("tên màn hợp lệ, đuôi tệp, dung lượng đọc được", () => {
    expect(laManTep("so-hop-dong")).toBe(true);
    expect(laManTep("nhan-vien")).toBe(false);
    expect(duoiTep("a.b.PDF")).toBe("pdf");
    expect(dungLuong(500)).toBe("1 KB");
    expect(dungLuong(2_621_440)).toBe("2,5 MB");
  });
});
