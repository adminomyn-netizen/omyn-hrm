-- 0011 — Giới hạn vị trí chấm công: chỉ cho chấm công vào/ra khi ở trong bán kính (mặc định 100 m) quanh văn phòng.
-- Một dòng duy nhất (id = 1). Toạ độ gieo sẵn chỉ là ƯỚC LƯỢNG theo tên khu (chưa tra được số nhà), nên `da_xac_nhan = false`:
-- chưa xác nhận thì CHƯA chặn ai. Người ở văn phòng bấm "Đặt vị trí = chỗ tôi đang đứng" để chốt toạ độ thật, từ đó khoá có hiệu lực.
create table public.vi_tri_cham_cong (
  id smallint primary key default 1 check (id = 1),
  ten text not null,
  dia_chi text not null,
  vi_do double precision not null check (vi_do between -90 and 90),
  kinh_do double precision not null check (kinh_do between -180 and 180),
  ban_kinh_m integer not null default 100 check (ban_kinh_m between 20 and 5000),
  da_xac_nhan boolean not null default false,
  cap_nhat_luc timestamptz not null default now(),
  cap_nhat_boi uuid references auth.users (id) on delete set null
);
insert into public.vi_tri_cham_cong (ten, dia_chi, vi_do, kinh_do)
values ('Văn phòng Omyn', 'Số nhà 12, liền kề 7, khu đấu giá Mậu Lương, Kiến Hưng, Hà Đông, Hà Nội', 20.9555, 105.7940);

alter table public.vi_tri_cham_cong enable row level security;
alter table public.vi_tri_cham_cong force row level security;
grant select on public.vi_tri_cham_cong to authenticated;
create policy vi_tri_cham_cong_xem on public.vi_tri_cham_cong for select to authenticated using (true);

-- Lưu khoảng cách thật lúc bấm để đối chiếu sau (làm tròn mét).
alter table public.cham_cong add column if not exists khoang_cach_vao_m integer;
alter table public.cham_cong add column if not exists khoang_cach_ra_m integer;
