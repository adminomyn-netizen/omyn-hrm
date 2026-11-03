-- 0064: SỔ ĐƠN LẺ (sàn, Facebook, Zalo, điện thoại). Điểm khách lẻ tự tính từ đơn "Đã giao" có gắn khách; dòng hàng (không bắt buộc) để tính lãi gộp kênh lẻ.
create table public.kd_don_le (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  ma_don text not null check (length(btrim(ma_don)) > 0),
  kenh text not null default 'Facebook' check (kenh in ('Shopee', 'TikTok Shop', 'Facebook', 'Zalo', 'Điện thoại', 'Khác')),
  khach_le_id uuid references public.kd_khach_le (id) on delete set null,
  gia_tri bigint not null check (gia_tri > 0),
  trang_thai text not null default 'Đang xử lý' check (trang_thai in ('Đang xử lý', 'Đã giao', 'Hoàn trả', 'Huỷ')),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  unique (kenh, ma_don)
);
create index kd_don_le_khach_idx on public.kd_don_le (khach_le_id, ngay desc);

create table public.kd_don_le_dong (
  id uuid primary key default gen_random_uuid(),
  don_le_id uuid not null references public.kd_don_le (id) on delete cascade,
  san_pham_id uuid not null references public.sp_san_pham (id) on delete restrict,
  so_luong int not null check (so_luong > 0),
  don_gia bigint not null check (don_gia >= 0),
  chiet_khau int not null default 0 check (chiet_khau between 0 and 100),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index kd_don_le_dong_don_idx on public.kd_don_le_dong (don_le_id);

do $$
declare t text;
begin
  foreach t in array array['kd_don_le', 'kd_don_le_dong'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
