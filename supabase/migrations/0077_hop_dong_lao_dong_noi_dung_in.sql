-- Hợp đồng lao động: thêm các ô nội dung chính để dựng bản hợp đồng in/PDF (đều tuỳ chọn; để trống thì bản in chừa chỗ điền tay).
alter table public.hop_dong_lao_dong
  add column if not exists chuc_danh text,
  add column if not exists cong_viec text,
  add column if not exists dia_diem_lam_viec text,
  add column if not exists muc_luong bigint check (muc_luong >= 0),
  add column if not exists hinh_thuc_tra_luong text,
  add column if not exists thoi_han_tra_luong text,
  add column if not exists phu_cap text,
  add column if not exists thoi_gio_lam_viec text,
  add column if not exists dieu_khoan_khac text,
  add column if not exists nguoi_dai_dien text,
  add column if not exists chuc_danh_dai_dien text;
