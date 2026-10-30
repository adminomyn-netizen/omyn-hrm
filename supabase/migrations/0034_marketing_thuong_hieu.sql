-- 0034: Mảng 4 Marketing & Thương hiệu (nhóm Drive 04): lịch nội dung, duyệt nội dung quảng cáo, booking KOL/KOC, ngân sách quảng cáo.
-- Chỉ dựng sổ ghi chép (QT.04.01-03); không có số liệu thật nào được nạp sẵn. Ép row level security như 0017+.

create table public.mkt_lich_noi_dung (
  id uuid primary key default gen_random_uuid(),
  ngay_dang date not null,
  kenh text not null default 'Facebook' check (kenh in ('Facebook', 'TikTok', 'Shopee', 'Zalo', 'Website', 'Khác')),
  chu_de text not null check (length(btrim(chu_de)) > 0),
  nguoi_lam_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Lên ý tưởng' check (trang_thai in ('Lên ý tưởng', 'Đang làm', 'Chờ duyệt', 'Đã duyệt', 'Đã đăng', 'Huỷ')),
  link_bai text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index mkt_lich_noi_dung_ngay_idx on public.mkt_lich_noi_dung (ngay_dang desc);

create table public.mkt_duyet_noi_dung (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null check (length(btrim(tieu_de)) > 0),
  kenh text not null default 'Facebook' check (kenh in ('Facebook', 'TikTok', 'Shopee', 'Zalo', 'Website', 'Khác')),
  noi_dung text,
  link text,
  nguoi_gui_id uuid references public.nhan_vien (id) on delete set null,
  ngay_gui date not null default current_date,
  khong_tu_cam boolean not null default false,
  co_so_cong_bo boolean not null default false,
  co_dong_y_hinh_anh boolean not null default false,
  trang_thai text not null default 'Chờ duyệt' check (trang_thai in ('Chờ duyệt', 'Đạt', 'Cần sửa', 'Không đạt')),
  nguoi_duyet text,
  nhan_xet text,
  tao_luc timestamptz not null default now()
);

create table public.mkt_kol_koc (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  loai text not null default 'KOC' check (loai in ('KOL', 'KOC')),
  kenh text not null default 'TikTok' check (kenh in ('Facebook', 'TikTok', 'Instagram', 'YouTube', 'Khác')),
  link_kenh text,
  san_pham text,
  chi_phi_thoa_thuan bigint check (chi_phi_thoa_thuan is null or chi_phi_thoa_thuan >= 0),
  chi_phi_thuc_te bigint check (chi_phi_thuc_te is null or chi_phi_thuc_te >= 0),
  ngay_dang date,
  trang_thai text not null default 'Đã liên hệ' check (trang_thai in ('Đã liên hệ', 'Đã chốt', 'Đã đăng', 'Đã nghiệm thu', 'Đã thanh toán', 'Huỷ')),
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  link_bai text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.mkt_ngan_sach_qc (
  id uuid primary key default gen_random_uuid(),
  thang date not null check (extract(day from thang) = 1),
  kenh text not null default 'Facebook' check (kenh in ('Facebook', 'TikTok', 'Shopee', 'Google', 'KOL/KOC', 'Khác')),
  ngan_sach_duyet bigint not null check (ngan_sach_duyet >= 0),
  thuc_chi bigint check (thuc_chi is null or thuc_chi >= 0),
  trang_thai text not null default 'Chờ duyệt' check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Đã quyết toán')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['mkt_lich_noi_dung', 'mkt_duyet_noi_dung', 'mkt_kol_koc', 'mkt_ngan_sach_qc'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
