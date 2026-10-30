-- 0023: Nhân sự nhóm 2 (công lương, bảo hiểm): giờ tăng ca đã xác nhận (có giới hạn theo luật), thưởng/hoa hồng/phụ cấp khác theo ngày,
-- và sổ ghi việc ĐÃ ĐỔ phiếu phê duyệt vào hồ sơ (để mỗi phiếu chỉ đổ một lần). Ép row level security như 0017+.

create table public.tang_ca (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  so_gio numeric(4, 1) not null check (so_gio > 0 and so_gio <= 12),
  loai_ngay text not null default 'Ngày thường' check (loai_ngay in ('Ngày thường', 'Ngày nghỉ tuần', 'Ngày lễ')),
  ly_do text,
  phieu_id uuid references public.pd_phieu (id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index tang_ca_nv_ngay_idx on public.tang_ca (nhan_vien_id, ngay);
create unique index tang_ca_phieu_ngay_uniq on public.tang_ca (phieu_id, ngay) where phieu_id is not null;

create table public.thuong_hoa_hong (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  loai text not null default 'Thưởng' check (loai in ('Thưởng', 'Hoa hồng', 'Phụ cấp khác')),
  so_tien bigint not null check (so_tien >= 0),
  ly_do text,
  tao_luc timestamptz not null default now()
);
create index thuong_hoa_hong_nv_ngay_idx on public.thuong_hoa_hong (nhan_vien_id, ngay);

create table public.pd_ap_dung (
  phieu_id uuid primary key references public.pd_phieu (id) on delete cascade,
  ket_qua text not null,
  luc timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['tang_ca', 'thuong_hoa_hong', 'pd_ap_dung'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

-- Giới hạn tăng ca theo BLLĐ 2019 (Điều 107 và Nghị định hướng dẫn) — chưa có người xác nhận (xac_nhan_boi trống) = "chờ kế toán/luật sư xác nhận".
insert into public.tham_so_luong (khoa, nhan, gia_tri, don_vi, nguon) values
  ('ot_gioi_han_thang', 'Giới hạn giờ tăng ca mỗi tháng', 40, 'so', 'BLLĐ 2019 Điều 107 — chờ kế toán/luật sư xác nhận'),
  ('ot_gioi_han_nam', 'Giới hạn giờ tăng ca mỗi năm', 200, 'so', 'BLLĐ 2019 Điều 107 — chờ kế toán/luật sư xác nhận'),
  ('ot_gioi_han_ngay_tong', 'Tổng giờ làm + tăng ca tối đa mỗi ngày', 12, 'so', 'BLLĐ 2019 Điều 107 — chờ kế toán/luật sư xác nhận')
on conflict (khoa) do nothing;
