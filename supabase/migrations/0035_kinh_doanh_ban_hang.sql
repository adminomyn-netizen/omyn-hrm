-- 0035: Mảng 5 Kinh doanh & Bán hàng (nhóm Drive 05): gian hàng sàn, đối soát tiền sàn, đại lý/khách sỉ, công nợ đại lý, phiên livestream, khiếu nại, chỉ tiêu doanh số.
-- Chỉ dựng sổ ghi chép (QT.05.01-05); không nạp số liệu nào. Ép row level security như 0017+.

create table public.kd_gian_hang (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  nen_tang text not null default 'Shopee' check (nen_tang in ('Shopee', 'TikTok Shop', 'Lazada', 'Facebook Shop', 'Website', 'Khác')),
  link text,
  nguoi_van_hanh_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Đang bán' check (trang_thai in ('Đang bán', 'Tạm dừng', 'Đóng')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.kd_doi_soat_san (
  id uuid primary key default gen_random_uuid(),
  gian_hang_id uuid not null references public.kd_gian_hang (id) on delete cascade,
  thang date not null check (extract(day from thang) = 1),
  doanh_thu_don bigint check (doanh_thu_don is null or doanh_thu_don >= 0),
  tien_san_chuyen bigint check (tien_san_chuyen is null or tien_san_chuyen >= 0),
  trang_thai text not null default 'Chờ đối soát' check (trang_thai in ('Chờ đối soát', 'Khớp', 'Lệch, đang xử lý')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.kd_dai_ly (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  loai text not null default 'Đại lý' check (loai in ('Đại lý', 'Khách sỉ', 'Cộng tác viên')),
  dien_thoai text,
  dia_chi text,
  chiet_khau numeric(5, 2) check (chiet_khau is null or (chiet_khau >= 0 and chiet_khau <= 100)),
  han_muc_cong_no bigint check (han_muc_cong_no is null or han_muc_cong_no >= 0),
  hop_dong_tu date,
  hop_dong_den date,
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Đang hợp tác' check (trang_thai in ('Đang hợp tác', 'Tạm dừng', 'Ngừng')),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (hop_dong_tu is null or hop_dong_den is null or hop_dong_den >= hop_dong_tu)
);

create table public.kd_cong_no_dai_ly (
  id uuid primary key default gen_random_uuid(),
  dai_ly_id uuid not null references public.kd_dai_ly (id) on delete cascade,
  ngay date not null,
  loai text not null default 'Phát sinh' check (loai in ('Phát sinh', 'Đã thu')),
  so_tien bigint not null check (so_tien > 0),
  han_thanh_toan date,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index kd_cong_no_dai_ly_idx on public.kd_cong_no_dai_ly (dai_ly_id, ngay desc);

create table public.kd_phien_live (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  nen_tang text not null default 'TikTok' check (nen_tang in ('TikTok', 'Shopee', 'Facebook')),
  chu_de text not null check (length(btrim(chu_de)) > 0),
  host_id uuid references public.nhan_vien (id) on delete set null,
  doanh_thu bigint check (doanh_thu is null or doanh_thu >= 0),
  so_don int check (so_don is null or so_don >= 0),
  trang_thai text not null default 'Lên kế hoạch' check (trang_thai in ('Lên kế hoạch', 'Đã live', 'Huỷ')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.kd_khieu_nai (
  id uuid primary key default gen_random_uuid(),
  ngay_nhan date not null,
  kenh text not null default 'Shopee' check (kenh in ('Shopee', 'TikTok Shop', 'Facebook', 'Zalo', 'Điện thoại', 'Khác')),
  khach text,
  noi_dung text not null check (length(btrim(noi_dung)) > 0),
  han_tra_loi date,
  nguoi_xu_ly_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Mới' check (trang_thai in ('Mới', 'Đang xử lý', 'Đã trả lời', 'Đã đóng')),
  ket_qua text,
  tao_luc timestamptz not null default now()
);

create table public.kd_chi_tieu (
  id uuid primary key default gen_random_uuid(),
  thang date not null check (extract(day from thang) = 1),
  kenh text not null default 'Tổng' check (kenh in ('Tổng', 'Sàn', 'Sỉ và đại lý', 'Livestream')),
  chi_tieu bigint not null check (chi_tieu >= 0),
  thuc_dat bigint check (thuc_dat is null or thuc_dat >= 0),
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['kd_gian_hang', 'kd_doi_soat_san', 'kd_dai_ly', 'kd_cong_no_dai_ly', 'kd_phien_live', 'kd_khieu_nai', 'kd_chi_tieu'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
