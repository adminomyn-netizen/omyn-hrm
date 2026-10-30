-- 0018 — Bộ KPI + xếp hạng thi đua theo ngày/tháng/quý (chị Lâm 30/10: "KPI ranking từng phòng, từng nhân sự trong phòng và toàn công ty, để có thưởng").
-- Mô hình đơn giản: chỉ tiêu (chung hoặc theo khối) có mục tiêu NGÀY; mỗi ngày nhập kết quả từng người; điểm = trung bình % đạt có trần 120%, nhân trọng số.

create table public.kpi_chi_tieu (
  id uuid primary key default gen_random_uuid(),
  khoi_id uuid references public.khoi (id) on delete cascade,   -- null = chỉ tiêu chung cho mọi khối
  ten text not null,
  don_vi text not null default '',
  muc_tieu_ngay numeric not null check (muc_tieu_ngay > 0),
  trong_so int not null default 1 check (trong_so between 1 and 10),
  chieu text not null default 'Càng cao càng tốt' check (chieu in ('Càng cao càng tốt', 'Càng thấp càng tốt')),
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.kpi_ket_qua (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  chi_tieu_id uuid not null references public.kpi_chi_tieu (id) on delete cascade,
  ngay date not null,
  thuc_te numeric not null check (thuc_te >= 0),
  ghi_chu text,
  nguoi_nhap uuid references auth.users (id) on delete set null,
  cap_nhat_luc timestamptz not null default now(),
  unique (nhan_vien_id, chi_tieu_id, ngay)
);
create index kpi_ket_qua_ngay_idx on public.kpi_ket_qua (ngay, chi_tieu_id);

create table public.kpi_thuong (
  id uuid primary key default gen_random_uuid(),
  ky_loai text not null default 'Tháng' check (ky_loai in ('Tháng', 'Quý')),
  pham_vi text not null default 'Phòng' check (pham_vi in ('Phòng', 'Cá nhân trong phòng', 'Cá nhân toàn công ty')),
  hang int not null check (hang between 1 and 3),
  so_tien bigint not null default 0 check (so_tien >= 0),
  mo_ta text,
  tao_luc timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['kpi_chi_tieu', 'kpi_ket_qua', 'kpi_thuong'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
