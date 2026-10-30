/** Chuyển dữ liệu API Meta/TikTok sang dòng của bảng qc_* (hàm thuần, có test). KHÔNG nhận khoá, không gọi mạng. */

type Obj = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? null : String(v));
const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

export const anhXaMetaTaiKhoan = (a: Obj) => ({ id: String(a.account_id ?? a.id ?? "").replace(/^act_/, ""), ten: s(a.name) ?? "(không tên)", tien_te: s(a.currency) ?? "VND" });
export const anhXaMetaChienDich = (c: Obj, taiKhoanId: string) => ({ id: String(c.id), tai_khoan_id: taiKhoanId, ten: s(c.name) ?? "(không tên)", muc_tieu: s(c.objective), trang_thai: s(c.status), trang_thai_hieu_luc: s(c.effective_status), ngan_sach_ngay: c.daily_budget == null ? null : n(c.daily_budget), ngan_sach_tron_doi: c.lifetime_budget == null ? null : n(c.lifetime_budget), bat_dau: s(c.start_time), ket_thuc: s(c.stop_time), du_lieu_goc: c });
export const anhXaMetaNhom = (a: Obj) => ({ id: String(a.id), chien_dich_id: String(a.campaign_id), ten: s(a.name) ?? "(không tên)", trang_thai: s(a.status), trang_thai_hieu_luc: s(a.effective_status), ngan_sach_ngay: a.daily_budget == null ? null : n(a.daily_budget), du_lieu_goc: a });
export const anhXaMetaQuangCao = (a: Obj) => ({ id: String(a.id), nhom_id: String(a.adset_id), chien_dich_id: String(a.campaign_id), ten: s(a.name) ?? "(không tên)", trang_thai: s(a.status), trang_thai_hieu_luc: s(a.effective_status), ma_noi_dung: s((a.creative as Obj | undefined)?.id), du_lieu_goc: a });

/** Meta trả `actions` là mảng [{action_type, value}]; lưu thành {loại: số}. */
export function hanhDongMeta(actions: unknown): Record<string, number> {
  const ra: Record<string, number> = {};
  if (Array.isArray(actions)) for (const a of actions as Obj[]) if (a.action_type) ra[String(a.action_type)] = (ra[String(a.action_type)] ?? 0) + n(a.value);
  return ra;
}
export const anhXaMetaSoLieu = (r: Obj) => ({ quang_cao_id: String(r.ad_id), ngay: String(r.date_start), chi_tieu: n(r.spend), hien_thi: Math.round(n(r.impressions)), nhap: Math.round(n(r.clicks)), tiep_can: Math.round(n(r.reach)), hanh_dong: hanhDongMeta(r.actions) });

export const anhXaTikTokTaiKhoan = (a: Obj) => ({ id: String(a.advertiser_id), ten: s(a.advertiser_name) ?? s(a.name) ?? "(không tên)", tien_te: s(a.currency), mui_gio: s(a.timezone) });
export const anhXaTikTokChienDich = (c: Obj, taiKhoanId: string) => ({ id: String(c.campaign_id), tai_khoan_id: taiKhoanId, ten: s(c.campaign_name) ?? "(không tên)", muc_tieu: s(c.objective_type), trang_thai: s(c.operation_status ?? c.secondary_status), ngan_sach: c.budget == null ? null : n(c.budget), du_lieu_goc: c });
export const anhXaTikTokNhom = (a: Obj) => ({ id: String(a.adgroup_id), chien_dich_id: String(a.campaign_id), ten: s(a.adgroup_name) ?? "(không tên)", trang_thai: s(a.operation_status ?? a.secondary_status), ngan_sach: a.budget == null ? null : n(a.budget), du_lieu_goc: a });
export const anhXaTikTokQuangCao = (a: Obj) => ({ id: String(a.ad_id), nhom_id: String(a.adgroup_id), chien_dich_id: String(a.campaign_id), ten: s(a.ad_name) ?? "(không tên)", trang_thai: s(a.operation_status ?? a.secondary_status), du_lieu_goc: a });
/** Dòng báo cáo TikTok: {dimensions: {ad_id, stat_time_day}, metrics: {spend, ...}}; ngày dạng "2026-10-29 00:00:00". */
export function anhXaTikTokSoLieu(r: { dimensions?: Obj; metrics?: Obj }) {
  const d = r.dimensions ?? {}, m = r.metrics ?? {};
  return { quang_cao_id: String(d.ad_id), ngay: String(d.stat_time_day).slice(0, 10), chi_tieu: n(m.spend), hien_thi: Math.round(n(m.impressions)), nhap: Math.round(n(m.clicks)), tiep_can: Math.round(n(m.reach)), chuyen_doi: n(m.conversion), ket_qua: n(m.result) };
}

/** Meta: đơn mua và giá trị mua từ `actions`/`action_values`. Ưu tiên omni_purchase (đã khử trùng lặp giữa các kênh), không có mới dùng purchase. */
export function muaMeta(actions: unknown, giaTri: unknown): { don: number; doanhThu: number } {
  const lay = (v: unknown) => { const m = hanhDongMeta(v); return m.omni_purchase ?? m.purchase ?? 0; };
  return { don: Math.round(lay(actions)), doanhThu: lay(giaTri) };
}
export const anhXaMetaSoLieuDayDu = (r: Obj) => { const mua = muaMeta(r.actions, r.action_values); return { ...anhXaMetaSoLieu(r), don_mua: mua.don, doanh_thu: mua.doanhThu }; };

// ---- Shopee ----
const ngayVN = (giayUnix: number) => new Date(giayUnix * 1000 + 7 * 3600e3).toISOString().slice(0, 10);
/** Đơn Shopee bị huỷ/đang huỷ/hoàn không tính doanh thu. */
export const donHuyShopee = (trangThai: string | null) => /^(CANCELLED|IN_CANCEL|INVALID)$/i.test(trangThai ?? "");

export const anhXaShopeeDon = (o: Obj, gianHangId: string) => {
  const t = n(o.create_time);
  return { ma_don: String(o.order_sn), gian_hang_id: gianHangId, trang_thai: s(o.order_status), tao_don_luc: new Date(t * 1000).toISOString(), ngay: ngayVN(t), tong_tien: n(o.total_amount), phi_van_chuyen: n(o.actual_shipping_fee ?? o.estimated_shipping_fee), so_san_pham: Array.isArray(o.item_list) ? o.item_list.length : 0, du_lieu_goc: o };
};

/** Gộp đơn theo ngày: số đơn (không tính đơn huỷ), đơn huỷ, doanh thu (không tính đơn huỷ). */
export function gopDonTheoNgay(dons: readonly { ngay: string; trang_thai: string | null; tong_tien: number }[]) {
  const m = new Map<string, { so_don: number; don_huy: number; doanh_thu: number }>();
  for (const d of dons) {
    const x = m.get(d.ngay) ?? { so_don: 0, don_huy: 0, doanh_thu: 0 };
    if (donHuyShopee(d.trang_thai)) x.don_huy++; else { x.so_don++; x.doanh_thu += d.tong_tien; }
    m.set(d.ngay, x);
  }
  return [...m].map(([ngay, x]) => ({ ngay, ...x, doanh_thu: Math.round(x.doanh_thu * 100) / 100 }));
}

/** Một dòng báo cáo quảng cáo theo ngày của Shopee (ngày dạng dd-mm-yyyy). */
export function anhXaShopeeQuangCaoNgay(r: Obj, gianHangId: string) {
  const [d, m, y] = String(r.date).split("-");
  return { gian_hang_id: gianHangId, ngay: `${y}-${m}-${d}`, chi_phi_qc: n(r.expense), hien_thi_qc: Math.round(n(r.impression)), nhap_qc: Math.round(n(r.clicks)), don_tu_qc: Math.round(n(r.broad_order)), doanh_thu_tu_qc: n(r.broad_gmv) };
}
