-- 0053: Đơn bán sỉ có dòng hàng (sản phẩm, số lượng, đơn giá, chiết khấu). Chỉ dựng sổ, không nạp số liệu.
-- Thêm cột ten (= mã đơn, tự sinh) để ô chọn "đơn sỉ" dùng chung được như các sổ khác.
alter table public.kd_don_si add column if not exists ten text generated always as (ma_don) stored;

create table public.kd_don_si_dong (
  id uuid primary key default gen_random_uuid(),
  don_si_id uuid not null references public.kd_don_si (id) on delete cascade,
  san_pham_id uuid not null references public.sp_san_pham (id) on delete restrict,
  so_luong int not null check (so_luong > 0),
  don_gia bigint not null check (don_gia >= 0),
  chiet_khau int not null default 0 check (chiet_khau between 0 and 100),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index kd_don_si_dong_don_idx on public.kd_don_si_dong (don_si_id);

alter table public.kd_don_si_dong enable row level security;
alter table public.kd_don_si_dong force row level security;
drop policy if exists kd_don_si_dong_chi_may_chu on public.kd_don_si_dong;
create policy kd_don_si_dong_chi_may_chu on public.kd_don_si_dong for select to authenticated using (false);
