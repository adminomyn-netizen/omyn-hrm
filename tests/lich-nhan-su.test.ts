import { describe, expect, it } from "vitest";
import { hanBaoCaoTrongThang, suKienThang, tinLichHomNay, type DuLieuLich, type BaoCaoL } from "@/lib/lich-nhan-su";

const bc = (mo: Partial<BaoCaoL>): BaoCaoL => ({ ten: "BC", co_quan: null, chu_ky: "Hằng năm", han_ngay: null, han_thang: null, han_mot_lan: null, dang_bat: true, ...mo });
const rong: DuLieuLich = { nhanSu: [], hopDong: [], nghiPhep: [], baoCao: [], nghiViec: [] };

describe("hạn báo cáo nhà nước", () => {
  it("chưa nhập hạn thì không có hạn nào; tắt thì không có", () => {
    expect(hanBaoCaoTrongThang(bc({ chu_ky: "6 tháng" }), 2026, 6)).toEqual([]);
    expect(hanBaoCaoTrongThang(bc({ chu_ky: "Hằng năm", han_ngay: 25, han_thang: 11, dang_bat: false }), 2026, 11)).toEqual([]);
  });
  it("hằng năm đúng tháng; 6 tháng lặp hai lần; hằng quý lặp bốn lần; hằng tháng mọi tháng; một lần đúng ngày", () => {
    expect(hanBaoCaoTrongThang(bc({ chu_ky: "Hằng năm", han_ngay: 25, han_thang: 11 }), 2026, 11)).toEqual(["2026-11-25"]);
    expect(hanBaoCaoTrongThang(bc({ chu_ky: "Hằng năm", han_ngay: 25, han_thang: 11 }), 2026, 10)).toEqual([]);
    const sau = bc({ chu_ky: "6 tháng", han_ngay: 5, han_thang: 6 });
    expect([hanBaoCaoTrongThang(sau, 2026, 6), hanBaoCaoTrongThang(sau, 2026, 12), hanBaoCaoTrongThang(sau, 2026, 7)]).toEqual([["2026-06-05"], ["2026-12-05"], []]);
    const quy = bc({ chu_ky: "Hằng quý", han_ngay: 20, han_thang: 1 });
    expect([1, 4, 7, 10, 2].map((m) => hanBaoCaoTrongThang(quy, 2026, m).length)).toEqual([1, 1, 1, 1, 0]);
    expect(hanBaoCaoTrongThang(bc({ chu_ky: "Hằng tháng", han_ngay: 31 }), 2026, 2)).toEqual(["2026-02-28"]);
    expect(hanBaoCaoTrongThang(bc({ chu_ky: "Một lần", han_mot_lan: "2026-12-30" }), 2026, 12)).toEqual(["2026-12-30"]);
  });
});

describe("lịch nhân sự theo tháng", () => {
  const nv = (mo: object) => ({ id: "a", ho_ten: "An", trang_thai: "Đang làm", ngay_vao_lam: null, ngay_sinh: null, ...mo });
  it("hợp đồng hết hạn + đánh giá tái ký 45 ngày trước", () => {
    const d: DuLieuLich = { ...rong, nhanSu: [nv({})], hopDong: [{ nhan_vien_id: "a", loai: "Xác định thời hạn", tu_ngay: "2025-12-15", den_ngay: "2026-12-14", trang_thai: "Đang hiệu lực" }] };
    expect(suKienThang(d, 2026, 12).map((s) => [s.ngay, s.loai])).toEqual([["2026-12-14", "hop-dong"]]);
    expect(suKienThang(d, 2026, 10).map((s) => [s.ngay, s.loai])).toEqual([["2026-10-30", "danh-gia"]]);
  });
  it("thử việc: hết thử việc, đánh giá 30/60 ngày; có hợp đồng thử việc thì dùng ngày hợp đồng", () => {
    const d: DuLieuLich = { ...rong, nhanSu: [nv({ trang_thai: "Thử việc", ngay_vao_lam: "2026-10-01" })] };
    expect(suKienThang(d, 2026, 10).map((s) => [s.ngay, s.loai])).toEqual([["2026-10-31", "bhxh"], ["2026-10-31", "danh-gia"]]);
    expect(suKienThang(d, 2026, 11).map((s) => [s.ngay, s.loai]).sort()).toEqual([["2026-11-30", "danh-gia"], ["2026-11-30", "thu-viec"]].sort());
    const co: DuLieuLich = { ...d, hopDong: [{ nhan_vien_id: "a", loai: "Thử việc", tu_ngay: "2026-10-01", den_ngay: "2026-11-15", trang_thai: "Đang hiệu lực" }] };
    expect(suKienThang(co, 2026, 11).filter((s) => s.loai === "thu-viec").map((s) => s.ngay)).toEqual(["2026-11-15"]);
  });
  it("sinh nhật theo năm đang xem; người đã nghỉ không có; BHXH báo tăng/giảm sau 30 ngày; nghỉ phép bỏ Chủ nhật", () => {
    const d: DuLieuLich = {
      ...rong,
      nhanSu: [nv({ ngay_sinh: "1995-11-12", ngay_vao_lam: "2026-10-20" }), nv({ id: "b", ho_ten: "Bình", trang_thai: "Đã nghỉ", ngay_sinh: "1990-11-05" })],
      nghiPhep: [{ nhan_vien_id: "a", loai: "Nghỉ phép năm", tu_ngay: "2026-11-05", den_ngay: "2026-11-09" }],
      nghiViec: [{ nhan_vien_id: "b", ngay_lam_viec_cuoi: "2026-10-15", trang_thai: "Đã đóng" }],
    };
    const k = suKienThang(d, 2026, 11);
    expect(k.filter((s) => s.loai === "sinh-nhat").map((s) => [s.ngay, s.tieuDe])).toEqual([["2026-11-12", "Sinh nhật: An"]]);
    expect(k.filter((s) => s.loai === "bhxh").map((s) => [s.ngay, s.tieuDe])).toEqual([["2026-11-14", "Hạn báo giảm lao động BHXH: Bình"], ["2026-11-19", "Hạn báo tăng lao động BHXH: An"]]);
    expect(k.filter((s) => s.loai === "nghi-phep").map((s) => s.ngay)).toEqual(["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-09"]);
    expect(k.every((s) => s.phu === undefined || !s.phu.includes("undefined"))).toBe(true);
  });
  it("hạn báo cáo nhà nước chỉ hiện khi đã nhập mốc, kèm ghi chú chờ xác nhận", () => {
    const d: DuLieuLich = { ...rong, baoCao: [bc({ ten: "Báo cáo biến động lao động", chu_ky: "6 tháng", han_ngay: 5, han_thang: 6, co_quan: "Sở LĐTBXH" })] };
    const k = suKienThang(d, 2026, 12);
    expect(k).toHaveLength(1);
    expect(k[0]).toMatchObject({ ngay: "2026-12-05", loai: "bao-cao", tieuDe: "Hạn nộp: Báo cáo biến động lao động" });
    expect(k[0].phu).toMatch(/chờ kế toán\/luật sư xác nhận/);
  });
});

describe("nhắc sáng lịch nhân sự", () => {
  const ev = [
    { ngay: "2026-11-12", loai: "sinh-nhat" as const, tieuDe: "Sinh nhật: An" },
    { ngay: "2026-11-15", loai: "bao-cao" as const, tieuDe: "Hạn nộp: BC" },
    { ngay: "2026-11-30", loai: "bhxh" as const, tieuDe: "Hạn báo tăng: B" },
  ];
  it("nhắc sinh nhật hôm nay và hạn còn 3 ngày; hạn còn xa thì không", () => {
    const t = tinLichHomNay(ev, "2026-11-12");
    expect(t?.noiDung).toBe("Sinh nhật: An; Hạn nộp: BC (còn 3 ngày)");
    expect(t?.khung).toBe("lich_nhan_su_2026-11-12");
  });
  it("không có mốc đúng ngày thì không nhắc", () => {
    expect(tinLichHomNay(ev, "2026-11-20")).toBeNull();
    expect(tinLichHomNay(ev, "2026-11-13")).toBeNull();
  });
});
