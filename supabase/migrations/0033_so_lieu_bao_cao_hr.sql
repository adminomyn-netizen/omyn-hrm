-- 0033: Số liệu đầu vào cho Báo cáo HR mà app chưa có nguồn: doanh thu và ngân sách quỹ lương theo tháng, định biên theo khối,
-- vị trí chủ chốt và người kế cận, tạm ứng nhân viên. Chỉ nhập tay; báo cáo không bịa số khi các bảng này còn trống.
-- Ép row level security như 0017+.

create table public.chi_so_hr_ky (
  id uuid primary key default gen_random_uuid(),
  thang date not null unique check (extract(day from thang) = 1),
  doanh_thu bigint check (doanh_thu is null or doanh_thu >= 0),
  ngan_sach_quy_luong bigint check (ngan_sach_quy_luong is null or ngan_sach_quy_luong >= 0),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.chi_so_hr_dinh_bien (
  id uuid primary key default gen_random_uuid(),
  khoi_id uuid not null unique references public.khoi (id) on delete cascade,
  so_dinh_bien int not null check (so_dinh_bien >= 0),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.chi_so_hr_chu_chot (
  id uuid primary key default gen_random_uuid(),
  vi_tri text not null check (length(btrim(vi_tri)) > 0),
  khoi_id uuid references public.khoi (id) on delete set null,
  nguoi_giu_id uuid references public.nhan_vien (id) on delete set null,
  ke_can_id uuid references public.nhan_vien (id) on delete set null,
  muc_san_sang text check (muc_san_sang is null or muc_san_sang in ('Sẵn sàng ngay', 'Sau 1 năm', 'Chưa sẵn sàng')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.tam_ung_nhan_vien (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  so_tien bigint not null check (so_tien > 0),
  ngay_ung date not null,
  tinh_trang text not null default 'Chưa thu hồi' check (tinh_trang in ('Chưa thu hồi', 'Đã thu hồi')),
  ngay_thu_hoi date,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (ngay_thu_hoi is null or ngay_thu_hoi >= ngay_ung)
);
create index tam_ung_nv_idx on public.tam_ung_nhan_vien (nhan_vien_id, ngay_ung desc);

do $$
declare t text;
begin
  foreach t in array array['chi_so_hr_ky', 'chi_so_hr_dinh_bien', 'chi_so_hr_chu_chot', 'tam_ung_nhan_vien'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
