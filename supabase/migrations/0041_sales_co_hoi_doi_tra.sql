-- 0041: Khúc SALES, lát 2: cơ hội khách sỉ (từ liên hệ đầu tới chốt) và đổi trả, hoàn hàng. Chỉ dựng sổ; không nạp số liệu.

create table public.kd_co_hoi (
  id uuid primary key default gen_random_uuid(),
  ten_khach text not null check (length(btrim(ten_khach)) > 0),
  dien_thoai text,
  nguon text not null default 'Khác' check (nguon in ('Facebook', 'Zalo', 'Giới thiệu', 'Hội chợ, sự kiện', 'Khác')),
  nhu_cau text,
  gia_tri_du_kien bigint check (gia_tri_du_kien is null or gia_tri_du_kien >= 0),
  giai_doan text not null default 'Mới' check (giai_doan in ('Mới', 'Đã liên hệ', 'Đã báo giá', 'Thương lượng', 'Đã chốt', 'Mất')),
  lien_he_tiep date,
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.kd_doi_tra (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  kenh text not null default 'Shopee' check (kenh in ('Shopee', 'TikTok Shop', 'Lazada', 'Facebook Shop', 'Sỉ và đại lý', 'Khác')),
  ma_don text,
  loai text not null default 'Hoàn tiền' check (loai in ('Hoàn tiền', 'Đổi hàng')),
  ly_do text not null default 'Khác' check (ly_do in ('Lỗi sản phẩm', 'Giao sai hàng', 'Hư hỏng khi vận chuyển', 'Khách đổi ý', 'Khác')),
  so_tien bigint check (so_tien is null or so_tien >= 0),
  trang_thai text not null default 'Mới' check (trang_thai in ('Mới', 'Đang xử lý', 'Đã nhận hàng về', 'Đã hoàn tất', 'Từ chối')),
  nguoi_xu_ly_id uuid references public.nhan_vien (id) on delete set null,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['kd_co_hoi', 'kd_doi_tra'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
