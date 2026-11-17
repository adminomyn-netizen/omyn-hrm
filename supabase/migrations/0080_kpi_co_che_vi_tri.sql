-- 0080: Cơ chế KPI theo vị trí, đúng mẫu chị Phượng gửi (17/11): mô tả công việc, mục đích, các nhóm công việc có tỷ trọng
-- (tổng 100%), nguyên tắc đánh giá, quy trình; Ban lãnh đạo chấm % hoàn thành từng nhóm mỗi tháng.
-- Thay mô hình "mục tiêu/đơn vị" của 0079 (2 bảng đó còn trống, giữ nguyên, không dùng nữa). Chỉ thêm bảng mới.

create table public.kpi_co_che_vi_tri (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) between 2 and 120),            -- vị trí = chức danh, khớp với nhan_vien.chuc_danh
  mo_ta_cong_viec text check (mo_ta_cong_viec is null or length(mo_ta_cong_viec) <= 6000),
  muc_dich text check (muc_dich is null or length(muc_dich) <= 6000),
  nguyen_tac text check (nguyen_tac is null or length(nguyen_tac) <= 6000),
  quy_trinh text check (quy_trinh is null or length(quy_trinh) <= 6000),
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);
create unique index kpi_co_che_vi_tri_ten_uq on public.kpi_co_che_vi_tri (lower(btrim(ten))) where hoat_dong;

create table public.kpi_co_che_nhom (
  id uuid primary key default gen_random_uuid(),
  co_che_id uuid not null references public.kpi_co_che_vi_tri (id) on delete cascade,
  stt int not null default 1 check (stt between 1 and 50),
  ten text not null check (length(btrim(ten)) between 1 and 200),
  noi_dung text check (noi_dung is null or length(noi_dung) <= 2000),
  ty_trong numeric(5,2) not null check (ty_trong > 0 and ty_trong <= 100),
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);
create index kpi_co_che_nhom_cc_idx on public.kpi_co_che_nhom (co_che_id, stt);

create table public.kpi_cham_thang (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  nhom_id uuid not null references public.kpi_co_che_nhom (id) on delete cascade,
  thang date not null check (extract(day from thang) = 1),
  ty_le numeric(5,2) not null check (ty_le >= 0 and ty_le <= 100),          -- % hoàn thành nhóm này trong tháng
  ty_trong numeric(5,2) not null check (ty_trong > 0 and ty_trong <= 100),   -- tỷ trọng tại lúc chấm (sửa tỷ trọng sau này không làm đổi điểm các tháng cũ)
  nguoi_cham uuid references auth.users (id) on delete set null,
  cap_nhat_luc timestamptz not null default now(),
  unique (nhan_vien_id, nhom_id, thang)
);
create index kpi_cham_thang_thang_idx on public.kpi_cham_thang (thang, nhan_vien_id);

do $$
declare t text;
begin
  foreach t in array array['kpi_co_che_vi_tri', 'kpi_co_che_nhom', 'kpi_cham_thang'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

create trigger nk_kpi_co_che_vi_tri after insert or update or delete on public.kpi_co_che_vi_tri
  for each row execute function private.ghi_nhat_ky();
create trigger nk_kpi_co_che_nhom after insert or update or delete on public.kpi_co_che_nhom
  for each row execute function private.ghi_nhat_ky();
create trigger nk_kpi_cham_thang after insert or update or delete on public.kpi_cham_thang
  for each row execute function private.ghi_nhat_ky();
