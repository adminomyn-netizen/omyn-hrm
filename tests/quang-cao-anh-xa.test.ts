import { describe, expect, it } from "vitest";
import { anhXaShopeeDon, anhXaShopeeQuangCaoNgay, donHuyShopee, gopDonTheoNgay, muaMeta, anhXaMetaQuangCao, anhXaMetaSoLieu, anhXaMetaTaiKhoan, anhXaTikTokSoLieu, hanhDongMeta } from "@/lib/quang-cao-anh-xa";

describe("ánh xạ Meta", () => {
  it("tài khoản bỏ tiền tố act_", () => expect(anhXaMetaTaiKhoan({ id: "act_123", account_id: "123", name: "Omyn", currency: "VND" })).toEqual({ id: "123", ten: "Omyn", tien_te: "VND" }));
  it("hành động gộp theo loại, bỏ dòng hỏng", () => expect(hanhDongMeta([{ action_type: "purchase", value: "2" }, { action_type: "purchase", value: "1" }, { action_type: "link_click", value: "x" }, { value: "5" }])).toEqual({ purchase: 3, link_click: 0 }));
  it("số liệu: chuỗi số của Meta thành số, thiếu trường thành 0", () => expect(anhXaMetaSoLieu({ ad_id: "9", date_start: "2026-10-29", spend: "12345.67", impressions: "1000", clicks: "25" })).toMatchObject({ quang_cao_id: "9", ngay: "2026-10-29", chi_tieu: 12345.67, hien_thi: 1000, nhap: 25, tiep_can: 0, hanh_dong: {} }));
  it("quảng cáo lấy mã nội dung từ creative", () => expect(anhXaMetaQuangCao({ id: "1", adset_id: "2", campaign_id: "3", name: "QC", creative: { id: "c9" } })).toMatchObject({ nhom_id: "2", chien_dich_id: "3", ma_noi_dung: "c9" }));
});
describe("ánh xạ TikTok", () => {
  it("ngày cắt phần giờ, số từ chuỗi", () => expect(anhXaTikTokSoLieu({ dimensions: { ad_id: 77, stat_time_day: "2026-10-29 00:00:00" }, metrics: { spend: "10.5", impressions: "500", clicks: "7", conversion: "2", result: "2" } })).toEqual({ quang_cao_id: "77", ngay: "2026-10-29", chi_tieu: 10.5, hien_thi: 500, nhap: 7, tiep_can: 0, chuyen_doi: 2, ket_qua: 2 }));
});

describe("ánh xạ Meta mua hàng + Shopee", () => {
  it("ưu tiên omni_purchase, không có thì purchase", () => {
    expect(muaMeta([{ action_type: "omni_purchase", value: "3" }, { action_type: "purchase", value: "5" }], [{ action_type: "omni_purchase", value: "900000" }])).toEqual({ don: 3, doanhThu: 900000 });
    expect(muaMeta([{ action_type: "purchase", value: "2" }], [{ action_type: "purchase", value: "100" }])).toEqual({ don: 2, doanhThu: 100 });
    expect(muaMeta(undefined, undefined)).toEqual({ don: 0, doanhThu: 0 });
  });
  it("đơn Shopee: ngày theo giờ Việt Nam (17:30 UTC đã sang ngày hôm sau)", () => {
    const d = anhXaShopeeDon({ order_sn: "A1", order_status: "COMPLETED", create_time: Date.parse("2026-10-29T17:30:00Z") / 1000, total_amount: 250000, item_list: [{}, {}] }, "9");
    expect(d).toMatchObject({ ma_don: "A1", gian_hang_id: "9", ngay: "2026-10-30", tong_tien: 250000, so_san_pham: 2 });
  });
  it("gộp theo ngày: đơn huỷ không tính doanh thu và không tính vào số đơn", () => {
    expect(donHuyShopee("CANCELLED")).toBe(true); expect(donHuyShopee("COMPLETED")).toBe(false);
    expect(gopDonTheoNgay([{ ngay: "2026-10-30", trang_thai: "COMPLETED", tong_tien: 100 }, { ngay: "2026-10-30", trang_thai: "CANCELLED", tong_tien: 999 }, { ngay: "2026-10-30", trang_thai: "SHIPPED", tong_tien: 50.5 }, { ngay: "2026-10-31", trang_thai: "COMPLETED", tong_tien: 10 }]))
      .toEqual([{ ngay: "2026-10-30", so_don: 2, don_huy: 1, doanh_thu: 150.5 }, { ngay: "2026-10-31", so_don: 1, don_huy: 0, doanh_thu: 10 }]);
  });
  it("quảng cáo Shopee: ngày dd-mm-yyyy thành yyyy-mm-dd", () => {
    expect(anhXaShopeeQuangCaoNgay({ date: "29-10-2026", expense: "12000", impression: "900", clicks: "40", broad_order: "2", broad_gmv: "500000" }, "9")).toEqual({ gian_hang_id: "9", ngay: "2026-10-29", chi_phi_qc: 12000, hien_thi_qc: 900, nhap_qc: 40, don_tu_qc: 2, doanh_thu_tu_qc: 500000 });
  });
});
