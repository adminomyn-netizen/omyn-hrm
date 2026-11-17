-- 0079: KPI theo vị trí (chức danh), mục tiêu và kết quả THEO THÁNG (chị Lâm 17/11, theo câu hỏi của chị Phượng).
-- Chỉ thêm 2 bảng mới, KHÔNG đụng kpi_chi_tieu/kpi_ket_qua (KPI thi đua theo ngày giữ nguyên).
-- Vị trí = chức danh trong hồ sơ nhân sự (nhan_vien.chuc_danh), so khớp không phân biệt hoa thường.

create table public.kpi_chi_tieu_thang (
  id uuid primary key default gen_random_uuid(),
  chuc_danh text not null check (length(btrim(chuc_danh)) between 2 and 120),
  khoi_id uuid references public.khoi (id) on delete cascade,   -- null = mọi khối có chức danh này
  ten text not null check (length(btrim(ten)) between 1 and 200),
  don_vi text not null default '',
  muc_tieu_thang numeric not null check (muc_tieu_thang > 0),
  trong_so int not null default 1 check (trong_so between 1 and 10),
  chieu text not null default 'Càng cao càng tốt' check (chieu in ('Càng cao càng tốt', 'Càng thấp càng tốt')),
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);
create index kpi_chi_tieu_thang_cd_idx on public.kpi_chi_tieu_thang (lower(chuc_danh));

create table public.kpi_ket_qua_thang (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  chi_tieu_id uuid not null references public.kpi_chi_tieu_thang (id) on delete cascade,
  thang date not null check (extract(day from thang) = 1),      -- ngày đầu tháng
  thuc_te numeric not null check (thuc_te >= 0),
  nguoi_nhap uuid references auth.users (id) on delete set null,
  cap_nhat_luc timestamptz not null default now(),
  unique (nhan_vien_id, chi_tieu_id, thang)
);
create index kpi_ket_qua_thang_thang_idx on public.kpi_ket_qua_thang (thang, chi_tieu_id);

do $$
declare t text;
begin
  foreach t in array array['kpi_chi_tieu_thang', 'kpi_ket_qua_thang'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

-- Mọi thêm/sửa/xoá để lại nhật ký.
create trigger nk_kpi_chi_tieu_thang after insert or update or delete on public.kpi_chi_tieu_thang
  for each row execute function private.ghi_nhat_ky();
create trigger nk_kpi_ket_qua_thang after insert or update or delete on public.kpi_ket_qua_thang
  for each row execute function private.ghi_nhat_ky();
