-- 0043: Khúc KHO, lát 2: sổ lô hàng và hạn sử dụng (báo trước khi lô sắp hết hạn) và mức tồn tối thiểu của từng sản phẩm. Không nạp số liệu.

create table public.kho_lo_hang (
  id uuid primary key default gen_random_uuid(),
  san_pham_id uuid not null references public.sp_san_pham (id) on delete restrict,
  so_lo text not null check (length(btrim(so_lo)) > 0),
  ngay_san_xuat date,
  han_dung date not null,
  so_luong_nhap int check (so_luong_nhap is null or so_luong_nhap >= 0),
  trang_thai text not null default 'Còn trong kho' check (trang_thai in ('Còn trong kho', 'Đã bán hết', 'Đã huỷ hoặc trả')),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  unique (san_pham_id, so_lo)
);
create index kho_lo_hang_han_idx on public.kho_lo_hang (han_dung);

alter table public.kho_lo_hang enable row level security;
alter table public.kho_lo_hang force row level security;
drop policy if exists kho_lo_hang_chi_may_chu on public.kho_lo_hang;
create policy kho_lo_hang_chi_may_chu on public.kho_lo_hang for select to authenticated using (false);

alter table public.sp_san_pham add column ton_toi_thieu int check (ton_toi_thieu is null or ton_toi_thieu >= 0);
