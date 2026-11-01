-- 0055: Khách lẻ (sàn, Facebook, Zalo, điện thoại), sổ điểm và hạng khách. Chỉ dựng sổ, không nạp số liệu, không đặt mức điểm/hạng thay chị.
create table public.kd_khach_le (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  dien_thoai text,
  kenh text not null default 'Facebook' check (kenh in ('Shopee', 'TikTok Shop', 'Facebook', 'Zalo', 'Điện thoại', 'Khác')),
  ngay_sinh date,
  dia_chi text,
  dong_y_nhan_tin boolean not null default false,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create unique index kd_khach_le_dien_thoai_idx on public.kd_khach_le (dien_thoai) where dien_thoai is not null and dien_thoai <> '';

create table public.kd_diem_khach (
  id uuid primary key default gen_random_uuid(),
  khach_le_id uuid not null references public.kd_khach_le (id) on delete cascade,
  ngay date not null,
  loai text not null check (loai in ('Tích', 'Dùng')),
  so_diem int not null check (so_diem > 0),
  ma_don text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index kd_diem_khach_khach_idx on public.kd_diem_khach (khach_le_id, ngay desc);

create table public.kd_hang_khach (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  diem_toi_thieu int not null check (diem_toi_thieu >= 0) unique,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['kd_khach_le', 'kd_diem_khach', 'kd_hang_khach'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
