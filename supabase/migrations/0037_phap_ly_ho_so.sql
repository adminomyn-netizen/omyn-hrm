-- 0037: Mảng 1 Pháp lý & Hồ sơ công ty (nhóm Drive 01): hồ sơ theo mã sản phẩm, sổ công bố, sổ hợp đồng, nhãn hiệu và kiểu dáng, đồng ý dữ liệu cá nhân.
-- Chỉ dựng sổ ghi chép (QT.01.01-05); không nạp số công bố hay hợp đồng nào. Ép row level security như 0017+.

create table public.pl_ho_so_san_pham (
  id uuid primary key default gen_random_uuid(),
  san_pham_id uuid not null unique references public.sp_san_pham (id) on delete cascade,
  co_cong_bo boolean not null default false,
  co_hoa_don_nhap boolean not null default false,
  co_coa boolean not null default false,
  co_nhan_phu boolean not null default false,
  co_hop_dong_nha_may boolean not null default false,
  da_giao_nhan_ho_so_goc boolean not null default false,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.pl_so_cong_bo (
  id uuid primary key default gen_random_uuid(),
  san_pham_id uuid not null references public.sp_san_pham (id) on delete cascade,
  so_cong_bo text,
  co_quan text,
  ngay_cong_bo date,
  ngay_het_han date,
  trang_thai text not null default 'Đang chuẩn bị' check (trang_thai in ('Đang chuẩn bị', 'Đã nộp', 'Còn hiệu lực', 'Hết hiệu lực')),
  link_file text,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (ngay_het_han is null or ngay_cong_bo is null or ngay_het_han >= ngay_cong_bo)
);

create table public.pl_so_hop_dong (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  doi_tac text,
  loai text not null default 'Khác' check (loai in ('Nhà máy', 'Đại lý', 'Dịch vụ', 'Thuê mặt bằng', 'KOL/KOC', 'Khác')),
  so_hop_dong text,
  ngay_ky date,
  ngay_het_han date,
  gia_tri bigint check (gia_tri is null or gia_tri >= 0),
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  da_duoc_dong_y_gui boolean not null default false,
  trang_thai text not null default 'Đang soạn' check (trang_thai in ('Đang soạn', 'Chờ ký', 'Đang hiệu lực', 'Hết hạn', 'Chấm dứt')),
  link_file text,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (ngay_het_han is null or ngay_ky is null or ngay_het_han >= ngay_ky)
);

create table public.pl_nhan_hieu (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  loai text not null default 'Nhãn hiệu' check (loai in ('Nhãn hiệu', 'Kiểu dáng công nghiệp')),
  so_don text,
  so_van_bang text,
  ngay_cap date,
  ngay_het_han date,
  trang_thai text not null default 'Đang nộp đơn' check (trang_thai in ('Đang nộp đơn', 'Đã được cấp', 'Cần gia hạn', 'Hết hiệu lực')),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (ngay_het_han is null or ngay_cap is null or ngay_het_han >= ngay_cap)
);

create table public.pl_dong_y_du_lieu (
  id uuid primary key default gen_random_uuid(),
  khach text not null check (length(btrim(khach)) > 0),
  kenh text,
  ngay_dong_y date not null,
  hinh_thuc text not null default 'Biểu mẫu' check (hinh_thuc in ('Văn bản ký', 'Tin nhắn', 'Biểu mẫu')),
  pham_vi text,
  link_bang_chung text,
  ngay_thu_hoi date,
  tao_luc timestamptz not null default now(),
  check (ngay_thu_hoi is null or ngay_thu_hoi >= ngay_dong_y)
);

do $$
declare t text;
begin
  foreach t in array array['pl_ho_so_san_pham', 'pl_so_cong_bo', 'pl_so_hop_dong', 'pl_nhan_hieu', 'pl_dong_y_du_lieu'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
