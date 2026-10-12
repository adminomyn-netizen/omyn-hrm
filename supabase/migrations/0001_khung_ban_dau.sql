-- Khung bảng ban đầu cho Omyn HRM.
-- Chạy sau khi đã `supabase link` tới project thật, bằng `supabase db push`.
-- Mọi bảng đều bật Row Level Security — phân quyền cụ thể sẽ thêm policy sau,
-- khi đã chốt vai trò thật (admin / trưởng khối / C&B / nhân viên).

create extension if not exists "pgcrypto";

create table khoi (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique,
  mo_ta text
);

create table nhan_vien (
  id uuid primary key default gen_random_uuid(),
  ma_nhan_vien text unique,
  ho_ten text not null,
  chuc_danh text,
  khoi_id uuid references khoi(id),
  email text unique,
  ngay_vao_lam date,
  trang_thai text not null default 'Đang làm'
    check (trang_thai in ('Đang làm', 'Thử việc', 'Đã nghỉ')),
  created_at timestamptz not null default now()
);

create table cham_cong (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ngay date not null,
  gio_vao time,
  gio_ra time,
  trang_thai text not null default 'Đúng giờ'
    check (trang_thai in ('Đúng giờ', 'Đi muộn', 'Vắng mặt')),
  unique (nhan_vien_id, ngay)
);

create table don_tu (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  loai text not null
    check (loai in ('Nghỉ phép năm', 'Nghỉ ốm', 'Tạm ứng lương', 'Công tác')),
  tu_ngay date not null,
  den_ngay date not null,
  ly_do text,
  trang_thai text not null default 'Chờ duyệt'
    check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Từ chối')),
  nguoi_duyet_id uuid references nhan_vien(id),
  created_at timestamptz not null default now()
);

create table ky_luong (
  id uuid primary key default gen_random_uuid(),
  ten_ky text not null unique, -- ví dụ "Tháng 10/2026"
  da_thanh_toan boolean not null default false
);

create table bang_luong (
  id uuid primary key default gen_random_uuid(),
  ky_luong_id uuid not null references ky_luong(id) on delete cascade,
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  luong_co_ban numeric(14, 0) not null default 0,
  phu_cap numeric(14, 0) not null default 0,
  thuc_linh numeric(14, 0) generated always as (luong_co_ban + phu_cap) stored,
  unique (ky_luong_id, nhan_vien_id)
);

create table tin_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  vi_tri text not null,
  khoi_id uuid references khoi(id),
  so_luong_can int not null default 1,
  trang_thai text not null default 'Đang tuyển'
    check (trang_thai in ('Đang tuyển', 'Đang phỏng vấn', 'Đã đóng')),
  created_at timestamptz not null default now()
);

create table ung_vien (
  id uuid primary key default gen_random_uuid(),
  tin_tuyen_dung_id uuid not null references tin_tuyen_dung(id) on delete cascade,
  ho_ten text not null,
  email text,
  dien_thoai text,
  trang_thai text not null default 'Mới nộp'
);

create table danh_gia_hieu_suat (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ky text not null, -- ví dụ "Q4/2026"
  diem numeric(5, 1) not null check (diem between 0 and 100),
  xep_loai text not null
    check (xep_loai in ('Xuất sắc', 'Tốt', 'Đạt', 'Cần cải thiện')),
  nguoi_danh_gia_id uuid references nhan_vien(id),
  created_at timestamptz not null default now()
);

alter table khoi enable row level security;
alter table nhan_vien enable row level security;
alter table cham_cong enable row level security;
alter table don_tu enable row level security;
alter table ky_luong enable row level security;
alter table bang_luong enable row level security;
alter table tin_tuyen_dung enable row level security;
alter table ung_vien enable row level security;
alter table danh_gia_hieu_suat enable row level security;
