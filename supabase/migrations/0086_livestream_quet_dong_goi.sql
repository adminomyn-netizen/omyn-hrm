-- 0086: LIVESTREAM + QUÉT ĐÓNG GÓI. Chỉ thêm cột và trigger, không đổi dữ liệu cũ.
-- Phiên live: thêm giờ, mục tiêu doanh thu, chi phí quảng cáo, lượt xem. Đơn lẻ gắn được vào một phiên live để doanh thu phiên tự tính từ đơn thật.
-- Đóng gói: ghi thời điểm đóng (quét mã) để đo năng suất.
alter table public.kd_phien_live
  add column gio_bat_dau timestamptz,
  add column gio_ket_thuc timestamptz,
  add column muc_tieu_doanh_thu bigint check (muc_tieu_doanh_thu is null or muc_tieu_doanh_thu >= 0),
  add column chi_phi_quang_cao bigint check (chi_phi_quang_cao is null or chi_phi_quang_cao >= 0),
  add column luot_xem int check (luot_xem is null or luot_xem >= 0),
  add column nguoi_xem_cao_nhat int check (nguoi_xem_cao_nhat is null or nguoi_xem_cao_nhat >= 0);

alter table public.kd_don_le
  add column phien_live_id uuid references public.kd_phien_live (id) on delete set null;
create index kd_don_le_phien_live_idx on public.kd_don_le (phien_live_id) where phien_live_id is not null;

alter table public.kho_dong_goi_giao add column dong_goi_luc timestamptz;

create trigger nk_kd_phien_live after insert or update or delete on public.kd_phien_live
  for each row execute function private.ghi_nhat_ky();
