-- Lịch phỏng vấn: chọn được NHIỀU người phỏng vấn cùng lúc (chị Phượng 11/11). Cột cũ nguoi_phong_van_id giữ nguyên, chỉ để đọc dữ liệu cũ.
alter table public.lich_phong_van add column if not exists nguoi_phong_van_ids uuid[] not null default '{}';
update public.lich_phong_van set nguoi_phong_van_ids = array[nguoi_phong_van_id]
  where nguoi_phong_van_id is not null and nguoi_phong_van_ids = '{}';
