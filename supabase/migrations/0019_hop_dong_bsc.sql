-- 0019 — Hợp đồng lao động (Lark 1.3/1.4/1.5) + BSC & mục tiêu cá nhân (theo mô hình e-global-ops: góc nhìn → mục tiêu → chỉ số theo năm/tháng → chỉ số từng người → kế hoạch hành động → khoá tháng).
-- Cùng lô với 0017/0018 để anh Nam dán một lần. Toàn bộ chỉ máy chủ đọc/ghi (FORCE RLS, không chính sách cho trình duyệt) như 0016-0018.

create table public.hop_dong_lao_dong (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid references public.nhan_vien (id) on delete cascade,
  ten_nguoi_ky text,                                 -- cộng tác viên / người chưa có hồ sơ nhân sự
  loai text not null default 'Xác định thời hạn' check (loai in ('Thử việc', 'Xác định thời hạn', 'Không xác định thời hạn', 'Cộng tác viên', 'Khác')),
  so_hop_dong text,
  lan int not null default 1 check (lan between 1 and 20),
  tu_ngay date not null,
  den_ngay date,                                     -- null = không thời hạn
  trang_thai text not null default 'Chờ ký' check (trang_thai in ('Chờ ký', 'Đang hiệu lực', 'Đã hết hạn', 'Đã chấm dứt')),
  pham_vi text,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (den_ngay is null or den_ngay >= tu_ngay),
  check (nhan_vien_id is not null or ten_nguoi_ky is not null)
);
create index hop_dong_lao_dong_den_ngay_idx on public.hop_dong_lao_dong (den_ngay) where trang_thai = 'Đang hiệu lực';
create index hop_dong_lao_dong_nv_idx on public.hop_dong_lao_dong (nhan_vien_id);

create table public.danh_gia_tai_ky (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  hop_dong_id uuid references public.hop_dong_lao_dong (id) on delete set null,
  ket_qua_cong_viec int check (ket_qua_cong_viec between 1 and 5),
  thai_do int check (thai_do between 1 and 5),
  nang_luc int check (nang_luc between 1 and 5),
  muc_do_phu_hop int check (muc_do_phu_hop between 1 and 5),
  de_xuat text not null default 'Chờ quyết định' check (de_xuat in ('Chờ quyết định', 'Ký tiếp có thời hạn', 'Ký không thời hạn', 'Gia hạn thử việc', 'Không tái ký')),
  nhan_xet text,
  nguoi_danh_gia_id uuid references public.nhan_vien (id) on delete set null,
  ngay date default current_date,
  tao_luc timestamptz not null default now()
);
create index danh_gia_tai_ky_nv_idx on public.danh_gia_tai_ky (nhan_vien_id);

-- BSC: khung dùng chung nhiều năm; chỉ số và số liệu theo năm.
create table public.bsc_goc_nhin (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  sap_xep int not null default 0,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.bsc_muc_tieu (
  id uuid primary key default gen_random_uuid(),
  goc_nhin_id uuid not null references public.bsc_goc_nhin (id) on delete cascade,
  ten text not null,
  mo_ta text,
  bat_dau date,
  ket_thuc date,
  sap_xep int not null default 0,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now(),
  check (ket_thuc is null or bat_dau is null or ket_thuc >= bat_dau)
);
create index bsc_muc_tieu_goc_idx on public.bsc_muc_tieu (goc_nhin_id, sap_xep);

create table public.bsc_lien_ket (                    -- mũi tên nhân quả giữa hai mục tiêu
  id uuid primary key default gen_random_uuid(),
  tu_muc_tieu_id uuid not null references public.bsc_muc_tieu (id) on delete cascade,
  den_muc_tieu_id uuid not null references public.bsc_muc_tieu (id) on delete cascade,
  unique (tu_muc_tieu_id, den_muc_tieu_id),
  check (tu_muc_tieu_id <> den_muc_tieu_id)
);

create table public.bsc_chi_so (
  id uuid primary key default gen_random_uuid(),
  nam smallint not null check (nam between 2020 and 2100),
  muc_tieu_id uuid not null references public.bsc_muc_tieu (id) on delete cascade,
  ten text not null,
  mo_ta text,
  don_vi text not null default '',
  cach_gop text not null default 'Cộng dồn' check (cach_gop in ('Cộng dồn', 'Trung bình', 'Cuối kỳ')),
  trong_so numeric(5, 2) not null default 0 check (trong_so >= 0),   -- tương đối, trung bình có trọng số tự chuẩn hoá; nhóm không đủ 100% chỉ cảnh báo
  duong_dan_bao_cao text,
  hoat_dong boolean not null default true,
  sap_xep int not null default 0,
  tao_luc timestamptz not null default now()
);
create index bsc_chi_so_nam_idx on public.bsc_chi_so (nam, muc_tieu_id, sap_xep);

create table public.bsc_chi_so_thang (
  id uuid primary key default gen_random_uuid(),
  chi_so_id uuid not null references public.bsc_chi_so (id) on delete cascade,
  thang smallint not null check (thang between 1 and 12),
  ke_hoach numeric(20, 4),
  thuc_te numeric(20, 4),
  unique (chi_so_id, thang)
);

create table public.bsc_chi_so_nguoi (                -- chỉ số được giao cho ai (mục tiêu cá nhân)
  id uuid primary key default gen_random_uuid(),
  chi_so_id uuid not null references public.bsc_chi_so (id) on delete cascade,
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  unique (chi_so_id, nhan_vien_id)
);

create table public.bsc_nguoi_thang (
  id uuid primary key default gen_random_uuid(),
  chi_so_id uuid not null references public.bsc_chi_so (id) on delete cascade,
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  thang smallint not null check (thang between 1 and 12),
  loai text not null check (loai in ('Kế hoạch', 'Thực tế')),
  gia_tri numeric(20, 4) not null,
  unique (chi_so_id, nhan_vien_id, thang, loai)
);
create index bsc_nguoi_thang_nv_idx on public.bsc_nguoi_thang (nhan_vien_id, thang);

create table public.bsc_ke_hoach_hanh_dong (
  id uuid primary key default gen_random_uuid(),
  chi_so_id uuid not null references public.bsc_chi_so (id) on delete cascade,
  ten text not null,
  mo_ta text,
  nguoi_thuc_hien_id uuid not null references public.nhan_vien (id) on delete restrict,
  nguoi_giao_id uuid references public.nhan_vien (id) on delete set null,
  nguoi_giam_sat_id uuid references public.nhan_vien (id) on delete set null,
  uu_tien text not null default 'P2' check (uu_tien in ('P0', 'P1', 'P2', 'P3')),
  bat_dau date not null,
  ket_thuc date not null,
  tien_do int not null default 0 check (tien_do between 0 and 100),
  ket_qua text,
  hoan_thanh_luc timestamptz,
  tao_luc timestamptz not null default now(),
  check (ket_thuc >= bat_dau)
);
create index bsc_khhd_nguoi_idx on public.bsc_ke_hoach_hanh_dong (nguoi_thuc_hien_id, ket_thuc);

create table public.bsc_khoa_thang (                  -- tháng đã khoá thì không sửa số liệu BSC
  id uuid primary key default gen_random_uuid(),
  nam smallint not null,
  thang smallint not null check (thang between 1 and 12),
  khoa_boi uuid references auth.users (id) on delete set null,
  khoa_luc timestamptz not null default now(),
  unique (nam, thang)
);

do $$
declare t text;
begin
  foreach t in array array['hop_dong_lao_dong', 'danh_gia_tai_ky', 'bsc_goc_nhin', 'bsc_muc_tieu', 'bsc_lien_ket', 'bsc_chi_so', 'bsc_chi_so_thang', 'bsc_chi_so_nguoi', 'bsc_nguoi_thang', 'bsc_ke_hoach_hanh_dong', 'bsc_khoa_thang'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

-- 4 góc nhìn BSC chuẩn để có sẵn khung (sửa tên được ở màn cấu hình).
insert into public.bsc_goc_nhin (ten, sap_xep) values ('Tài chính', 1), ('Khách hàng', 2), ('Quy trình nội bộ', 3), ('Học hỏi và phát triển', 4);
