-- 0008 — ĐƠN TỪ THEO GIỜ (chủ app chốt 23/10/2026): nghỉ một buổi/theo khoảng giờ; giải trình công ghi giờ vào/ra ĐÚNG người đề nghị.
-- Chỉ THÊM cột có thể trống, không đổi dữ liệu cũ.
alter table public.don_tu
  add column if not exists gio_tu time,        -- nghỉ từ giờ (đơn nghỉ trong một ngày); trống = cả ngày
  add column if not exists gio_den time,       -- nghỉ đến giờ
  add column if not exists gio_vao_dung time,  -- giải trình công: giờ vào đúng đề nghị sửa về; trống = không sửa giờ vào
  add column if not exists gio_ra_dung time;   -- giải trình công: giờ ra đúng đề nghị sửa về; trống = không sửa giờ ra
alter table public.don_tu add constraint don_tu_gio_nghi_hop_le check (gio_tu is null or gio_den is null or gio_den > gio_tu);
