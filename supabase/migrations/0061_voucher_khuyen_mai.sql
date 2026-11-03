-- 0061: voucher / mã giảm giá và sổ dùng voucher (hiệu quả khuyến mãi theo kênh tự tính từ đây).
-- Chỉ dựng sổ, không đặt mã hay mức giảm thay chị. Bảng trống.
create table public.kd_voucher (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique check (ma = upper(btrim(ma)) and length(ma) > 0),
  ten text not null check (length(btrim(ten)) > 0),
  loai text not null default 'Giảm %' check (loai in ('Giảm %', 'Giảm tiền')),
  gia_tri int not null check (gia_tri > 0),
  giam_toi_da bigint check (giam_toi_da is null or giam_toi_da > 0),
  don_toi_thieu bigint not null default 0 check (don_toi_thieu >= 0),
  kenh text not null default 'Tất cả' check (kenh in ('Tất cả', 'Shopee', 'TikTok Shop', 'Facebook', 'Zalo', 'Điện thoại', 'Khác')),
  tu_ngay date not null,
  den_ngay date not null,
  gioi_han_luot int check (gioi_han_luot is null or gioi_han_luot > 0),
  gioi_han_moi_khach int check (gioi_han_moi_khach is null or gioi_han_moi_khach > 0),
  bat boolean not null default true,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  constraint kd_voucher_ngay_hop_le check (den_ngay >= tu_ngay),
  constraint kd_voucher_phan_tram_hop_le check (loai <> 'Giảm %' or gia_tri <= 100)
);

create table public.kd_voucher_dung (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.kd_voucher (id) on delete restrict,
  khach_le_id uuid references public.kd_khach_le (id) on delete set null,
  ngay date not null,
  kenh text not null check (kenh in ('Shopee', 'TikTok Shop', 'Facebook', 'Zalo', 'Điện thoại', 'Khác')),
  ma_don text,
  so_tien_don bigint not null check (so_tien_don > 0),
  so_tien_giam bigint not null default 0 check (so_tien_giam >= 0),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  constraint kd_voucher_dung_giam_khong_qua_don check (so_tien_giam <= so_tien_don)
);
create index kd_voucher_dung_voucher_idx on public.kd_voucher_dung (voucher_id, ngay desc);

do $$
declare t text;
begin
  foreach t in array array['kd_voucher', 'kd_voucher_dung'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
