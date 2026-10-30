-- 0026: Nhân sự — Đào tạo (kế hoạch, khoá học/chứng chỉ), Kỷ luật, Khung cấp bậc, Lịch sử thăng chức/điều chuyển.
-- Chỉ dựng sổ ghi chép; mức lương theo cấp bậc và hình thức kỷ luật theo luật ghi "chờ chị Lâm/luật sư xác nhận". Ép row level security như 0017+.

create table public.dao_tao_ke_hoach (
  id uuid primary key default gen_random_uuid(),
  chu_de text not null check (length(btrim(chu_de)) > 0),
  khoi_id uuid references public.khoi (id) on delete set null,
  hinh_thuc text not null default 'Nội bộ' check (hinh_thuc in ('Nội bộ', 'Thuê ngoài', 'Online', 'Kèm cặp')),
  ngay_du_kien date,
  so_nguoi int check (so_nguoi is null or so_nguoi > 0),
  ngan_sach bigint check (ngan_sach is null or ngan_sach >= 0),
  nguoi_phu_trach text,
  trang_thai text not null default 'Dự kiến' check (trang_thai in ('Dự kiến', 'Đã duyệt', 'Đang diễn ra', 'Hoàn thành', 'Huỷ')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.dao_tao_khoa_hoc (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ten_khoa text not null check (length(btrim(ten_khoa)) > 0),
  don_vi_cap text,
  loai text not null default 'Khoá học' check (loai in ('Khoá học', 'Chứng chỉ', 'Chứng nhận nội bộ')),
  ngay_hoan_thanh date,
  ngay_het_han date,
  chi_phi bigint check (chi_phi is null or chi_phi >= 0),
  trang_thai text not null default 'Đang học' check (trang_thai in ('Đang học', 'Đã hoàn thành', 'Không đạt')),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (ngay_het_han is null or ngay_hoan_thanh is null or ngay_het_han >= ngay_hoan_thanh)
);
create index dao_tao_khoa_hoc_nv_idx on public.dao_tao_khoa_hoc (nhan_vien_id);

create table public.ky_luat (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  hinh_thuc text not null default 'Khiển trách' check (hinh_thuc in ('Nhắc nhở', 'Khiển trách', 'Kéo dài thời hạn nâng lương', 'Cách chức', 'Sa thải')),
  hanh_vi text not null check (length(btrim(hanh_vi)) > 0),
  can_cu text,
  so_quyet_dinh text,
  nguoi_quyet_dinh text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index ky_luat_nv_idx on public.ky_luat (nhan_vien_id, ngay desc);

create table public.khung_cap_bac (
  id uuid primary key default gen_random_uuid(),
  ma_cap text not null check (length(btrim(ma_cap)) > 0),
  ten_cap text not null check (length(btrim(ten_cap)) > 0),
  thu_tu int not null default 1 check (thu_tu between 1 and 99),
  khoi_id uuid references public.khoi (id) on delete set null,
  dieu_kien text,
  luong_tu bigint check (luong_tu is null or luong_tu >= 0),
  luong_den bigint check (luong_den is null or luong_den >= 0),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (luong_tu is null or luong_den is null or luong_den >= luong_tu)
);

create table public.thang_chuc_dieu_chuyen (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  loai text not null default 'Thăng chức' check (loai in ('Thăng chức', 'Điều chuyển', 'Giáng chức', 'Bổ nhiệm', 'Miễn nhiệm')),
  ngay_hieu_luc date not null,
  tu_chuc_danh text,
  den_chuc_danh text,
  tu_khoi_id uuid references public.khoi (id) on delete set null,
  den_khoi_id uuid references public.khoi (id) on delete set null,
  so_quyet_dinh text,
  ly_do text,
  tao_luc timestamptz not null default now()
);
create index thang_chuc_dieu_chuyen_nv_idx on public.thang_chuc_dieu_chuyen (nhan_vien_id, ngay_hieu_luc desc);

do $$
declare t text;
begin
  foreach t in array array['dao_tao_ke_hoach', 'dao_tao_khoa_hoc', 'ky_luat', 'khung_cap_bac', 'thang_chuc_dieu_chuyen'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
