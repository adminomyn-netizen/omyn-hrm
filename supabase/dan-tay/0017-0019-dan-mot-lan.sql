-- ===== 0017_hr_tuyen_dung_onboarding_60_ngay =====
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

-- ===== 0018_kpi_ranking =====
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

-- ===== 0019_hop_dong_bsc =====
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

