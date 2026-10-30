-- 0017 — HR vận hành theo Lark, cụm 1: từ KẾ HOẠCH TUYỂN DỤNG tới LỘ TRÌNH 60 NGÀY (chị Lâm 30/10: "quan trọng là phần đi từ kế hoạch tuyển dụng cho xong lộ trình làm việc 60 ngày").
-- Nguồn: docs/mapping-lark-hr.md (cụm 1 tuyển dụng + cụm 2 onboarding & thử việc). Mọi bảng FORCE RLS + chỉ máy chủ (khoá service) đọc/ghi, như 0016.

create table public.muc_tieu_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  ky text not null,                                  -- ví dụ "Quý 4/2026"
  vi_tri text not null,
  khoi_id uuid references public.khoi (id) on delete set null,
  chi_tieu int not null check (chi_tieu >= 0),
  da_tuyen int not null default 0 check (da_tuyen >= 0),
  han_hoan_thanh date,
  uu_tien text not null default 'Trung bình' check (uu_tien in ('Cao', 'Trung bình', 'Thấp')),
  trang_thai text not null default 'Đang tuyển' check (trang_thai in ('Kế hoạch', 'Đang tuyển', 'Đủ người', 'Tạm dừng', 'Huỷ')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.ngan_sach_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  ky text not null,
  hang_muc text not null,                            -- đăng tin, headhunt, giới thiệu, sự kiện…
  du_kien bigint not null default 0 check (du_kien >= 0),
  thuc_te bigint not null default 0 check (thuc_te >= 0),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.kenh_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  loai text not null default 'Miễn phí' check (loai in ('Miễn phí', 'Trả phí', 'Giới thiệu nội bộ', 'Trường/Đối tác', 'Khác')),
  chi_phi bigint not null default 0 check (chi_phi >= 0),
  so_cv int not null default 0 check (so_cv >= 0),
  so_phong_van int not null default 0 check (so_phong_van >= 0),
  so_nhan_viec int not null default 0 check (so_nhan_viec >= 0),
  trang_thai text not null default 'Đang dùng' check (trang_thai in ('Đang dùng', 'Tạm dừng')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.lich_phong_van (
  id uuid primary key default gen_random_uuid(),
  ung_vien_id uuid references public.ung_vien (id) on delete cascade,
  ten_ung_vien text,
  vi_tri text,
  vong text not null default 'Vòng 1' check (vong in ('Sàng lọc điện thoại', 'Vòng 1', 'Vòng 2', 'Vòng cuối')),
  thoi_gian timestamptz not null,
  hinh_thuc text not null default 'Trực tiếp' check (hinh_thuc in ('Trực tiếp', 'Online', 'Điện thoại')),
  dia_diem text,
  nguoi_phong_van_id uuid references public.nhan_vien (id) on delete set null,
  ket_qua text not null default 'Chờ' check (ket_qua in ('Chờ', 'Đạt', 'Không đạt', 'Hoãn', 'Vắng mặt')),
  nhan_xet text,
  tao_luc timestamptz not null default now()
);
create index lich_phong_van_tg_idx on public.lich_phong_van (thoi_gian);

create table public.offer_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  ung_vien_id uuid references public.ung_vien (id) on delete set null,
  ten_ung_vien text not null,
  vi_tri text not null,
  luong_de_xuat bigint check (luong_de_xuat >= 0),
  ngay_gui date,
  han_tra_loi date,
  ngay_nhan_viec date,
  trang_thai text not null default 'Soạn' check (trang_thai in ('Soạn', 'Chờ duyệt', 'Đã gửi', 'Đồng ý', 'Từ chối', 'Thương lượng', 'Huỷ')),
  ly_do_tu_choi text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.de_xuat_phe_duyet (
  id uuid primary key default gen_random_uuid(),
  loai text not null default 'Tuyển dụng' check (loai in ('Tuyển dụng', 'Ngân sách tuyển dụng', 'Offer', 'Điều chỉnh nhân sự')),
  tieu_de text not null,
  nguoi_de_xuat_id uuid references public.nhan_vien (id) on delete set null,
  noi_dung text,
  so_tien bigint check (so_tien >= 0),
  trang_thai text not null default 'Chờ duyệt' check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Từ chối')),
  nguoi_duyet_id uuid references public.nhan_vien (id) on delete set null,
  duyet_luc timestamptz,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

-- Onboarding & thử việc: mỗi người mới một dòng, lộ trình 60 ngày là các nhiệm vụ con.
create table public.theo_doi_onboarding (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid references public.nhan_vien (id) on delete set null,
  ho_ten text not null,
  vi_tri text,
  email text,
  dien_thoai text,
  khoi_id uuid references public.khoi (id) on delete set null,
  quan_ly_id uuid references public.nhan_vien (id) on delete set null,
  mentor_id uuid references public.nhan_vien (id) on delete set null,
  ngay_bat_dau date not null,
  so_ngay_thu_viec int not null default 60 check (so_ngay_thu_viec between 1 and 180),
  trang_thai_ho_so text not null default 'Chưa gửi form' check (trang_thai_ho_so in ('Chưa gửi form', 'Đã gửi form', 'Đã điền', 'Thiếu thông tin', 'Đủ hồ sơ')),
  thong_tin_con_thieu text,
  tk_lark_da_tao boolean not null default false,
  da_gioi_thieu_cong_ty boolean not null default false,
  tinh_trang text not null default 'Đang thử việc' check (tinh_trang in ('Chuẩn bị', 'Đang thử việc', 'Đạt, lên chính thức', 'Không đạt', 'Nghỉ giữa chừng')),
  ngay_hoan_tat date,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.onb_nhiem_vu (
  id uuid primary key default gen_random_uuid(),
  onb_id uuid not null references public.theo_doi_onboarding (id) on delete cascade,
  giai_doan text not null check (giai_doan in ('Trước ngày 1', 'Tuần 1', 'Ngày 30', 'Ngày 60')),
  noi_dung text not null,
  han date,
  xong boolean not null default false,
  xong_luc timestamptz,
  thu_tu int not null default 0
);
create index onb_nhiem_vu_onb_idx on public.onb_nhiem_vu (onb_id, thu_tu);

create table public.danh_gia_thu_viec (
  id uuid primary key default gen_random_uuid(),
  onb_id uuid not null references public.theo_doi_onboarding (id) on delete cascade,
  moc text not null check (moc in ('30 ngày', '60 ngày')),
  nguoi_danh_gia text not null default 'Mentor' check (nguoi_danh_gia in ('Mentor', 'Quản lý', 'Nhân sự')),
  diem int check (diem between 1 and 5),
  ket_qua text not null default 'Chờ' check (ket_qua in ('Chờ', 'Đạt', 'Cần theo dõi', 'Không đạt')),
  diem_manh text,
  can_cai_thien text,
  ngay date not null default current_date,
  tao_luc timestamptz not null default now()
);
create index danh_gia_thu_viec_onb_idx on public.danh_gia_thu_viec (onb_id, moc);

do $$
declare t text;
begin
  foreach t in array array['muc_tieu_tuyen_dung', 'ngan_sach_tuyen_dung', 'kenh_tuyen_dung', 'lich_phong_van', 'offer_tuyen_dung', 'de_xuat_phe_duyet', 'theo_doi_onboarding', 'onb_nhiem_vu', 'danh_gia_thu_viec'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
