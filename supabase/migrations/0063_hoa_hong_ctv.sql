-- 0063: cộng tác viên / đại lý giới thiệu và sổ hoa hồng theo đơn. Chỉ dựng sổ, không đặt tỷ lệ thay chị. Bảng trống.
create table public.kd_ctv (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  loai text not null default 'Cộng tác viên' check (loai in ('Cộng tác viên', 'Đại lý giới thiệu')),
  dien_thoai text,
  ty_le_hoa_hong int check (ty_le_hoa_hong is null or (ty_le_hoa_hong between 1 and 100)),
  tai_khoan_nhan text,
  dang_hop_tac boolean not null default true,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.kd_hoa_hong (
  id uuid primary key default gen_random_uuid(),
  ctv_id uuid not null references public.kd_ctv (id) on delete restrict,
  ngay date not null,
  ma_don text,
  so_tien_don bigint not null check (so_tien_don > 0),
  ty_le int not null check (ty_le between 1 and 100),
  so_tien_hoa_hong bigint not null check (so_tien_hoa_hong >= 0),
  trang_thai text not null default 'Chờ duyệt' check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Đã chi', 'Huỷ')),
  ngay_chi date,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  constraint kd_hoa_hong_chi_phai_co_ngay check (trang_thai <> 'Đã chi' or ngay_chi is not null)
);
create unique index kd_hoa_hong_khong_trung_don on public.kd_hoa_hong (ctv_id, ma_don) where ma_don is not null and trang_thai <> 'Huỷ';
create index kd_hoa_hong_ctv_idx on public.kd_hoa_hong (ctv_id, ngay desc);

do $$
declare t text;
begin
  foreach t in array array['kd_ctv', 'kd_hoa_hong'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
