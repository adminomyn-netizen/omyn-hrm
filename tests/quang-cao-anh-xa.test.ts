import { describe, expect, it } from "vitest";
import { anhXaMetaQuangCao, anhXaMetaSoLieu, anhXaMetaTaiKhoan, anhXaTikTokSoLieu, hanhDongMeta } from "@/lib/quang-cao-anh-xa";

describe("ánh xạ Meta", () => {
  it("tài khoản bỏ tiền tố act_", () => expect(anhXaMetaTaiKhoan({ id: "act_123", account_id: "123", name: "Omyn", currency: "VND" })).toEqual({ id: "123", ten: "Omyn", tien_te: "VND" }));
  it("hành động gộp theo loại, bỏ dòng hỏng", () => expect(hanhDongMeta([{ action_type: "purchase", value: "2" }, { action_type: "purchase", value: "1" }, { action_type: "link_click", value: "x" }, { value: "5" }])).toEqual({ purchase: 3, link_click: 0 }));
  it("số liệu: chuỗi số của Meta thành số, thiếu trường thành 0", () => expect(anhXaMetaSoLieu({ ad_id: "9", date_start: "2026-10-29", spend: "12345.67", impressions: "1000", clicks: "25" })).toMatchObject({ quang_cao_id: "9", ngay: "2026-10-29", chi_tieu: 12345.67, hien_thi: 1000, nhap: 25, tiep_can: 0, hanh_dong: {} }));
  it("quảng cáo lấy mã nội dung từ creative", () => expect(anhXaMetaQuangCao({ id: "1", adset_id: "2", campaign_id: "3", name: "QC", creative: { id: "c9" } })).toMatchObject({ nhom_id: "2", chien_dich_id: "3", ma_noi_dung: "c9" }));
});
describe("ánh xạ TikTok", () => {
  it("ngày cắt phần giờ, số từ chuỗi", () => expect(anhXaTikTokSoLieu({ dimensions: { ad_id: 77, stat_time_day: "2026-10-29 00:00:00" }, metrics: { spend: "10.5", impressions: "500", clicks: "7", conversion: "2", result: "2" } })).toEqual({ quang_cao_id: "77", ngay: "2026-10-29", chi_tieu: 10.5, hien_thi: 500, nhap: 7, tiep_can: 0, chuyen_doi: 2, ket_qua: 2 }));
});
