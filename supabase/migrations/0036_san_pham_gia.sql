-- 0036: Mảng 3 Sản phẩm & Giá (nhóm Drive 03): danh mục sản phẩm, bảng giá theo kênh, kiểm lô nhập, phát triển sản phẩm mới, duyệt bao bì và nhãn.
-- Chỉ dựng sổ ghi chép (QT.03.01-04); không nạp giá hay số liệu nào. Ép row level security như 0017+.

create table public.sp_san_pham (
  id uuid primary key default gen_random_uuid(),
  ma_sp text not null unique check (length(btrim(ma_sp)) > 0),
  ten text not null check (length(btrim(ten)) > 0),
  nhom_hang text,
  nha_san_xuat text,
  nguon_goc text not null default 'Nhập khẩu' check (nguon_goc in ('Nhập khẩu', 'Sản xuất trong nước')),
  quy_cach text,
  trang_thai text not null default 'Đang phát triển' check (trang_thai in ('Đang phát triển', 'Đang bán', 'Ngừng bán')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.sp_gia (
  id uuid primary key default gen_random_uuid(),
  san_pham_id uuid not null references public.sp_san_pham (id) on delete cascade,
  kenh text not null default 'Sàn' check (kenh in ('Sàn', 'Sỉ', 'Đại lý', 'Lẻ')),
  gia_von bigint check (gia_von is null or gia_von >= 0),
  gia_niem_yet bigint check (gia_niem_yet is null or gia_niem_yet >= 0),
  chiet_khau numeric(5, 2) check (chiet_khau is null or (chiet_khau >= 0 and chiet_khau <= 100)),
  gia_ban bigint check (gia_ban is null or gia_ban >= 0),
  hieu_luc_tu date,
  trang_thai text not null default 'Chờ duyệt' check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Hết hiệu lực')),
  nguoi_duyet text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index sp_gia_sp_idx on public.sp_gia (san_pham_id, kenh);

create table public.sp_kiem_lo (
  id uuid primary key default gen_random_uuid(),
  san_pham_id uuid not null references public.sp_san_pham (id) on delete cascade,
  so_lo text not null check (length(btrim(so_lo)) > 0),
  ngay_nhap date not null,
  so_luong int check (so_luong is null or so_luong >= 0),
  han_dung date,
  co_coa boolean not null default false,
  da_luu_mau boolean not null default false,
  ket_qua text not null default 'Chờ kiểm' check (ket_qua in ('Chờ kiểm', 'Đạt', 'Không đạt')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.sp_phat_trien_moi (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  y_tuong text,
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  ngay_du_kien date,
  trang_thai text not null default 'Ý tưởng' check (trang_thai in ('Ý tưởng', 'Làm mẫu', 'Duyệt bao bì', 'Chuẩn bị công bố', 'Ra mắt', 'Dừng')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.sp_duyet_bao_bi (
  id uuid primary key default gen_random_uuid(),
  san_pham_id uuid references public.sp_san_pham (id) on delete set null,
  tieu_de text not null check (length(btrim(tieu_de)) > 0),
  link_mau text,
  du_thong_tin boolean not null default false,
  khong_ghi_cong_dung_nhu_thuoc boolean not null default false,
  khop_ho_so_cong_bo boolean not null default false,
  trang_thai text not null default 'Chờ duyệt' check (trang_thai in ('Chờ duyệt', 'Đạt', 'Cần sửa')),
  nguoi_duyet text,
  nhan_xet text,
  tao_luc timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['sp_san_pham', 'sp_gia', 'sp_kiem_lo', 'sp_phat_trien_moi', 'sp_duyet_bao_bi'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
