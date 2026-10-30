-- 0038: Mảng 6/7 Tài chính & Kho (nhóm Drive 06-07) và mảng 2 Chiến lược (nhóm Drive 02): phiếu nhập xuất kho, đóng gói và giao hàng,
-- chứng từ xuất nhập khẩu, công nợ nhà cung cấp, kế hoạch tài chính, lịch nghiên cứu thị trường, khảo sát khách.
-- Chỉ dựng sổ ghi chép; không nạp số liệu nào. Tồn kho tính từ phiếu nhập xuất, không nhập tay. Ép row level security như 0017+.

create table public.kho_nhap_xuat (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  loai text not null default 'Nhập' check (loai in ('Nhập', 'Xuất', 'Điều chỉnh tăng', 'Điều chỉnh giảm')),
  san_pham_id uuid not null references public.sp_san_pham (id) on delete restrict,
  so_luong int not null check (so_luong > 0),
  so_lo text,
  doi_tuong text,
  chung_tu text,
  nguoi_lap_id uuid references public.nhan_vien (id) on delete set null,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index kho_nhap_xuat_sp_idx on public.kho_nhap_xuat (san_pham_id, ngay desc);

create table public.kho_dong_goi_giao (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  ma_don text not null check (length(btrim(ma_don)) > 0),
  kenh text not null default 'Sàn' check (kenh in ('Sàn', 'Sỉ và đại lý', 'Livestream', 'Khác')),
  nguoi_dong_goi_id uuid references public.nhan_vien (id) on delete set null,
  don_vi_van_chuyen text,
  ma_van_don text,
  trang_thai text not null default 'Chờ đóng' check (trang_thai in ('Chờ đóng', 'Đã đóng', 'Đã giao', 'Hoàn hoặc trả')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.tc_chung_tu_xnk (
  id uuid primary key default gen_random_uuid(),
  so_chung_tu text not null check (length(btrim(so_chung_tu)) > 0),
  loai text not null default 'Hoá đơn' check (loai in ('Tờ khai', 'Hoá đơn', 'Vận đơn', 'Packing list', 'Khác')),
  ngay date,
  doi_tac text,
  gia_tri bigint check (gia_tri is null or gia_tri >= 0),
  link_file text,
  trang_thai text not null default 'Đang thu thập' check (trang_thai in ('Đang thu thập', 'Đủ', 'Đã lưu')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.tc_cong_no_ncc (
  id uuid primary key default gen_random_uuid(),
  nha_cung_cap text not null check (length(btrim(nha_cung_cap)) > 0),
  ngay date not null,
  loai text not null default 'Phát sinh' check (loai in ('Phát sinh', 'Đã trả')),
  so_tien bigint not null check (so_tien > 0),
  han_thanh_toan date,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.tc_ke_hoach (
  id uuid primary key default gen_random_uuid(),
  thang date not null check (extract(day from thang) = 1),
  loai text not null default 'Chi' check (loai in ('Thu', 'Chi')),
  hang_muc text not null check (length(btrim(hang_muc)) > 0),
  ke_hoach bigint check (ke_hoach is null or ke_hoach >= 0),
  thuc_te bigint check (thuc_te is null or thuc_te >= 0),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.cl_nghien_cuu (
  id uuid primary key default gen_random_uuid(),
  chu_de text not null check (length(btrim(chu_de)) > 0),
  ngay_du_kien date,
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Kế hoạch' check (trang_thai in ('Kế hoạch', 'Đang làm', 'Hoàn thành')),
  link_bao_cao text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.cl_khao_sat (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  doi_tuong text,
  ngay date,
  link_form text,
  so_phan_hoi int check (so_phan_hoi is null or so_phan_hoi >= 0),
  tom_tat text,
  tao_luc timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['kho_nhap_xuat', 'kho_dong_goi_giao', 'tc_chung_tu_xnk', 'tc_cong_no_ncc', 'tc_ke_hoach', 'cl_nghien_cuu', 'cl_khao_sat'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
