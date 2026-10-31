-- 0044: Khúc MARKETING, lát 1: chiến dịch marketing và chương trình khuyến mãi (sàn, sỉ). Chỉ dựng sổ; không nạp số liệu.

create table public.mkt_chien_dich (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  muc_tieu text not null default 'Doanh thu' check (muc_tieu in ('Doanh thu', 'Nhận diện thương hiệu', 'Ra mắt sản phẩm', 'Kéo khách cũ quay lại', 'Khác')),
  tu_ngay date not null,
  den_ngay date not null,
  kenh text,
  ngan_sach bigint check (ngan_sach is null or ngan_sach >= 0),
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Lên kế hoạch' check (trang_thai in ('Lên kế hoạch', 'Đang chạy', 'Đã kết thúc', 'Huỷ')),
  ket_qua text,
  tao_luc timestamptz not null default now(),
  check (den_ngay >= tu_ngay)
);

create table public.mkt_khuyen_mai (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  kenh text not null default 'Shopee' check (kenh in ('Shopee', 'TikTok Shop', 'Lazada', 'Facebook Shop', 'Sỉ và đại lý', 'Tất cả kênh')),
  hinh_thuc text not null default 'Giảm giá' check (hinh_thuc in ('Giảm giá', 'Mã giảm giá', 'Quà tặng kèm', 'Mua nhiều giảm sâu', 'Flash sale', 'Khác')),
  tu_ngay date not null,
  den_ngay date not null,
  muc_giam text,
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Lên kế hoạch' check (trang_thai in ('Lên kế hoạch', 'Chờ duyệt', 'Đang chạy', 'Đã kết thúc', 'Huỷ')),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (den_ngay >= tu_ngay)
);

do $$
declare t text;
begin
  foreach t in array array['mkt_chien_dich', 'mkt_khuyen_mai'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
