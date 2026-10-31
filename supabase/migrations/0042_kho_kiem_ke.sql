-- 0042: Khúc KHO, lát 1: sổ kiểm kê kho. Mỗi lần đếm thực tế một sản phẩm là một dòng; chênh lệch so với sổ tính ở màn Tồn kho. Không nạp số liệu.

create table public.kho_kiem_ke (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  san_pham_id uuid not null references public.sp_san_pham (id) on delete restrict,
  ton_thuc_te int not null check (ton_thuc_te >= 0),
  nguoi_kiem_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Chờ xử lý chênh lệch' check (trang_thai in ('Chờ xử lý chênh lệch', 'Đã điều chỉnh', 'Khớp')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index kho_kiem_ke_sp_idx on public.kho_kiem_ke (san_pham_id, ngay desc);

alter table public.kho_kiem_ke enable row level security;
alter table public.kho_kiem_ke force row level security;
drop policy if exists kho_kiem_ke_chi_may_chu on public.kho_kiem_ke;
create policy kho_kiem_ke_chi_may_chu on public.kho_kiem_ke for select to authenticated using (false);
