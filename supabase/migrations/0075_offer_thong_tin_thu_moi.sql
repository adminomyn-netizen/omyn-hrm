-- Offer: thêm thông tin để dựng thư mời nhận việc (đều tuỳ chọn, để trống thì thư chừa chỗ điền tay).
alter table public.offer_tuyen_dung
  add column if not exists loai_hop_dong text check (loai_hop_dong in ('Thử việc', 'Hợp đồng lao động')),
  add column if not exists thoi_gian_thu_viec text,
  add column if not exists dia_diem_lam_viec text,
  add column if not exists nguoi_ky text,
  add column if not exists chuc_danh_nguoi_ky text,
  add column if not exists phuc_loi text;
