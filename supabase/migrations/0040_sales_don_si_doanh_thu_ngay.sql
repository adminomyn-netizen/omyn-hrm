-- 0040: Khúc SALES, lát 1: sổ đơn bán sỉ (đại lý, khách sỉ) và doanh thu hằng ngày theo gian hàng sàn.
-- Chỉ dựng sổ ghi chép; không nạp số liệu. Ép row level security như 0035.

create table public.kd_don_si (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  ma_don text not null check (length(btrim(ma_don)) > 0),
  dai_ly_id uuid not null references public.kd_dai_ly (id) on delete restrict,
  gia_tri bigint not null check (gia_tri >= 0),
  han_thanh_toan date,
  trang_thai text not null default 'Báo giá' check (trang_thai in ('Báo giá', 'Đã chốt', 'Đang giao', 'Đã giao', 'Đã thu đủ', 'Huỷ')),
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index kd_don_si_dai_ly_idx on public.kd_don_si (dai_ly_id, ngay desc);

create table public.kd_doanh_thu_ngay (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  gian_hang_id uuid not null references public.kd_gian_hang (id) on delete cascade,
  so_don int check (so_don is null or so_don >= 0),
  doanh_thu bigint check (doanh_thu is null or doanh_thu >= 0),
  so_don_huy int check (so_don_huy is null or so_don_huy >= 0),
  doanh_thu_hoan bigint check (doanh_thu_hoan is null or doanh_thu_hoan >= 0),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  unique (ngay, gian_hang_id)
);

do $$
declare t text;
begin
  foreach t in array array['kd_don_si', 'kd_doanh_thu_ngay'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
