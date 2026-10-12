-- Mở rộng schema theo đúng cấu trúc app HR thật trên Lark Base (app_token
-- S2m8bj933aP3YPsKmuNjxSL6pdf), chia cụm nghiệp vụ. Chi tiết đối chiếu từng bảng:
-- docs/mapping-lark-hr.md. KHÔNG sửa đè 0001_khung_ban_dau.sql, chỉ ALTER/thêm bảng mới.
-- Mọi bảng mới đều bật RLS giống khuôn của 0001; policy cụ thể thêm sau khi chốt vai trò.
-- CHƯA chạy supabase db push — chờ token đăng nhập Supabase CLI (xem README).

-- ============================================================
-- NHÂN SỰ (module nhan-su)
-- ============================================================

create table phong_ban (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  khoi_id uuid references khoi(id),
  truong_phong_id uuid, -- fk nhan_vien, thêm sau khi tạo cột vì nhan_vien chưa có phong_ban_id lúc này
  mo_ta text,
  unique (ten, khoi_id)
);

alter table nhan_vien
  add column ngay_sinh date,
  add column gioi_tinh text check (gioi_tinh in ('Nam', 'Nữ', 'Khác')),
  add column cccd text unique,
  add column dien_thoai text,
  add column dia_chi text,
  add column phong_ban_id uuid references phong_ban(id),
  add column quan_ly_truc_tiep_id uuid references nhan_vien(id),
  add column loai_hop_dong text; -- 'Không xác định thời hạn' / 'Xác định thời hạn' / 'Thử việc' / 'Cộng tác viên'

alter table phong_ban
  add constraint phong_ban_truong_phong_fk foreign key (truong_phong_id) references nhan_vien(id);

-- 2.2 Mô tả công việc (Lark chỉ 1 dòng) — gộp làm cột, không đáng một bảng riêng
alter table tin_tuyen_dung
  add column mo_ta_cv text;

create table thong_tin_gia_dinh_nhan_su (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  quan_he text not null, -- 'Vợ/chồng' / 'Con' / 'Bố' / 'Mẹ' / ...
  ho_ten text not null,
  ngay_sinh date,
  dien_thoai text,
  la_nguoi_phu_thuoc_thue boolean not null default false
);

create table hop_dong_lao_dong (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  so_hop_dong text,
  loai text not null, -- khớp nhan_vien.loai_hop_dong
  ngay_ky date not null,
  ngay_hieu_luc date not null,
  ngay_het_han date, -- null = không xác định thời hạn
  trang_thai text not null default 'Còn hiệu lực'
    check (trang_thai in ('Còn hiệu lực', 'Sắp hết hạn', 'Đã hết hạn', 'Đã chấm dứt')),
  file_dinh_kem text -- URL Drive
);

create table hop_dong_khac (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  loai text not null, -- 'Phụ lục' / 'Bảo mật' / 'Không cạnh tranh' / ...
  ngay_ky date not null,
  noi_dung text,
  file_dinh_kem text
);

create table lo_trinh_thang_tien (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  tu_chuc_danh text,
  den_chuc_danh text not null,
  ngay_hieu_luc date not null,
  ly_do text,
  nguoi_de_xuat_id uuid references nhan_vien(id)
);

create table khao_sat_nghi_viec (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ngay_khao_sat date not null default current_date,
  ly_do_chinh text,
  danh_gia_cong_ty numeric(3, 1) check (danh_gia_cong_ty between 0 and 10),
  ghi_chu text
);

-- ============================================================
-- CHẤM CÔNG (module cham-cong)
-- Ghi chú: Attendance_Results (7.988 dòng) / Attendance_Records (12.460 dòng) trên Lark là dữ
-- liệu thô từ máy chấm công — quá lớn và quá chi tiết để mô phỏng tay, bảng cham_cong (0001) đã
-- đủ cột cho demo. Khi nối Supabase thật, import 2 bảng này bằng ETL/CSV, không viết migration
-- cho từng dòng log.
-- ============================================================

create table dieu_chinh_sai_sot_cham_cong (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ngay date not null,
  gio_vao_cu time,
  gio_ra_cu time,
  gio_vao_moi time,
  gio_ra_moi time,
  ly_do text not null,
  nguoi_duyet_id uuid references nhan_vien(id),
  trang_thai text not null default 'Chờ duyệt'
    check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Từ chối')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- ĐƠN TỪ (module don-tu)
-- Lark có nhiều loại phiếu rời: xin phép làm online, đăng ký ra ngoài — gộp vào don_tu (0001)
-- bằng cách nới rộng check constraint, vì cùng một quy trình xin -> duyệt.
-- ============================================================

alter table don_tu drop constraint don_tu_loai_check;
alter table don_tu add constraint don_tu_loai_check
  check (loai in (
    'Nghỉ phép năm', 'Nghỉ ốm', 'Tạm ứng lương', 'Công tác',
    'Làm online', 'Ra ngoài', 'Nghỉ việc'
  ));

create table quy_phep_nam (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  nam int not null,
  so_ngay_duoc_huong numeric(4, 1) not null default 12,
  so_ngay_da_dung numeric(4, 1) not null default 0,
  so_ngay_con_lai numeric(4, 1) generated always as (so_ngay_duoc_huong - so_ngay_da_dung) stored,
  unique (nhan_vien_id, nam)
);

create table don_lam_them_gio (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ngay date not null,
  gio_bat_dau time not null,
  gio_ket_thuc time not null,
  ly_do text,
  trang_thai text not null default 'Chờ duyệt'
    check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Đã xác nhận', 'Từ chối')),
  nguoi_duyet_id uuid references nhan_vien(id),
  created_at timestamptz not null default now()
);

create table dang_ky_nghi_thang (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  thang date not null, -- lưu ngày đầu tháng, ví dụ 2026-10-01
  ngay_nghi date not null,
  ly_do text,
  trang_thai text not null default 'Đã đăng ký'
    check (trang_thai in ('Đã đăng ký', 'Đã duyệt', 'Hủy')),
  unique (nhan_vien_id, ngay_nghi)
);

create table de_nghi_hau_can_cong_tac (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  noi_den text not null,
  tu_ngay date not null,
  den_ngay date not null,
  phuong_tien text,
  khach_san_can_dat boolean not null default false,
  du_tru_chi_phi numeric(14, 0) default 0,
  trang_thai text not null default 'Chờ duyệt'
    check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Từ chối')),
  nguoi_duyet_id uuid references nhan_vien(id)
);

create table don_xin_nghi_viec (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ngay_nop date not null default current_date,
  ngay_nghi_du_kien date not null,
  ly_do text,
  trang_thai text not null default 'Chờ duyệt'
    check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Rút đơn')),
  nguoi_duyet_id uuid references nhan_vien(id)
);

-- ============================================================
-- LƯƠNG (module luong)
-- ============================================================

create table hieu_qua_bsc (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ky text not null, -- 'Q4/2026'
  chi_tieu text not null,
  trong_so numeric(5, 2) not null check (trong_so between 0 and 1),
  ket_qua numeric(5, 1),
  diem_quy_doi numeric(5, 1)
);

create table quan_ly_thuong_phat (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  loai text not null check (loai in ('Thưởng', 'Phạt')),
  so_tien numeric(14, 0) not null,
  ly_do text not null,
  ky_luong_id uuid references ky_luong(id),
  nguoi_de_xuat_id uuid references nhan_vien(id),
  created_at timestamptz not null default now()
);

create table dong_bo_luong_kinh_doanh (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ky_luong_id uuid not null references ky_luong(id) on delete cascade,
  so_tien numeric(14, 0) not null,
  nguon text not null, -- vd 'Hoa hồng bán hàng tháng 10'
  unique (nhan_vien_id, ky_luong_id, nguon)
);

create table thue_tncn (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ky_luong_id uuid not null references ky_luong(id) on delete cascade,
  thu_nhap_chiu_thue numeric(14, 0) not null default 0,
  so_thue_phai_nop numeric(14, 0) not null default 0,
  da_khai boolean not null default false,
  unique (nhan_vien_id, ky_luong_id)
);

-- ============================================================
-- ĐÁNH GIÁ (module danh-gia)
-- ============================================================

create table khao_sat_enps (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ky text not null, -- 'Q4/2026'
  diem_gioi_thieu int not null check (diem_gioi_thieu between 0 and 10),
  gop_y text,
  created_at timestamptz not null default now()
);

create table quan_ly_tai_san_cap_phat (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  ten_tai_san text not null,
  ma_tai_san text,
  ngay_cap date not null,
  ngay_thu_hoi date,
  tinh_trang text not null default 'Đang sử dụng'
    check (tinh_trang in ('Đang sử dụng', 'Đã thu hồi', 'Mất', 'Hỏng'))
);

-- ============================================================
-- TUYỂN DỤNG (module tuyen-dung) + ONBOARDING
-- ============================================================

create table muc_tieu_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  khoi_id uuid references khoi(id),
  ky text not null, -- 'Q4/2026'
  so_luong_muc_tieu int not null,
  so_luong_da_tuyen int not null default 0,
  unique (khoi_id, ky)
);

create table ngan_sach_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  tin_tuyen_dung_id uuid references tin_tuyen_dung(id) on delete cascade,
  khoan_muc text not null, -- 'Đăng tuyển' / 'Headhunt' / 'Quà giới thiệu' / ...
  ngan_sach_du_kien numeric(14, 0) not null default 0,
  thuc_chi numeric(14, 0) not null default 0
);

create table kenh_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique -- 'LinkedIn' / 'TopCV' / 'Giới thiệu nội bộ' / ...
);

create table hieu_suat_kenh_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  kenh_tuyen_dung_id uuid not null references kenh_tuyen_dung(id) on delete cascade,
  ky text not null,
  so_cv_nhan int not null default 0,
  so_qua_phong_van int not null default 0,
  so_tuyen_thanh_cong int not null default 0,
  unique (kenh_tuyen_dung_id, ky)
);

create table yeu_cau_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  tin_tuyen_dung_id uuid not null references tin_tuyen_dung(id) on delete cascade,
  tieu_chi text not null,
  bat_buoc boolean not null default true
);

-- Hồ sơ ứng viên (0001 đã có ung_vien) — bổ sung cột theo dữ liệu thật trên Lark
alter table ung_vien
  add column tin_tuyen_dung_kenh_id uuid references kenh_tuyen_dung(id),
  add column ngay_nop date not null default current_date,
  add column ghi_chu text;

create table lich_phong_van (
  id uuid primary key default gen_random_uuid(),
  ung_vien_id uuid not null references ung_vien(id) on delete cascade,
  vong text not null, -- 'Sơ loại' / 'Chuyên môn' / 'Lãnh đạo'
  thoi_gian timestamptz not null,
  nguoi_phong_van_id uuid references nhan_vien(id),
  ket_qua text check (ket_qua in ('Đạt', 'Không đạt', 'Chờ kết quả'))
);

-- Gộp "3.4 Offer" (cụm 1) và "1.1 Dữ liệu Offer từ Tuyển dụng" (cụm 2) — cùng một nghiệp vụ offer
create table offer_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  ung_vien_id uuid not null references ung_vien(id) on delete cascade,
  vi_tri text not null,
  luong_offer numeric(14, 0) not null,
  ngay_gui date not null default current_date,
  ngay_du_kien_nhan date,
  trang_thai text not null default 'Đã gửi'
    check (trang_thai in ('Đã gửi', 'Đã nhận', 'Từ chối', 'Hết hạn'))
);

-- Gộp "4.1 Đề xuất tuyển dụng" + "4.2 Đề xuất ngân sách tuyển dụng" — cùng quy trình đề xuất/duyệt
create table de_xuat_phe_duyet (
  id uuid primary key default gen_random_uuid(),
  loai_de_xuat text not null check (loai_de_xuat in ('Tuyển dụng', 'Ngân sách tuyển dụng')),
  tin_tuyen_dung_id uuid references tin_tuyen_dung(id) on delete cascade,
  noi_dung text not null,
  nguoi_de_xuat_id uuid references nhan_vien(id),
  nguoi_duyet_id uuid references nhan_vien(id),
  trang_thai text not null default 'Chờ duyệt'
    check (trang_thai in ('Chờ duyệt', 'Đã duyệt', 'Từ chối')),
  created_at timestamptz not null default now()
);

create table theo_doi_onboarding (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references nhan_vien(id) on delete cascade,
  buoc text not null, -- 'Ký HĐLĐ' / 'Cấp tài khoản' / 'Đào tạo tuần 1' / ...
  han_hoan_thanh date,
  ngay_hoan_thanh date,
  trang_thai text not null default 'Chưa làm'
    check (trang_thai in ('Chưa làm', 'Đang làm', 'Hoàn thành', 'Quá hạn'))
);

-- ============================================================
-- RLS — bật cho mọi bảng mới, cùng khuôn với 0001 (policy cụ thể thêm sau khi chốt vai trò)
-- ============================================================

alter table phong_ban enable row level security;
alter table thong_tin_gia_dinh_nhan_su enable row level security;
alter table hop_dong_lao_dong enable row level security;
alter table hop_dong_khac enable row level security;
alter table lo_trinh_thang_tien enable row level security;
alter table khao_sat_nghi_viec enable row level security;
alter table dieu_chinh_sai_sot_cham_cong enable row level security;
alter table quy_phep_nam enable row level security;
alter table don_lam_them_gio enable row level security;
alter table dang_ky_nghi_thang enable row level security;
alter table de_nghi_hau_can_cong_tac enable row level security;
alter table don_xin_nghi_viec enable row level security;
alter table hieu_qua_bsc enable row level security;
alter table quan_ly_thuong_phat enable row level security;
alter table dong_bo_luong_kinh_doanh enable row level security;
alter table thue_tncn enable row level security;
alter table khao_sat_enps enable row level security;
alter table quan_ly_tai_san_cap_phat enable row level security;
alter table muc_tieu_tuyen_dung enable row level security;
alter table ngan_sach_tuyen_dung enable row level security;
alter table kenh_tuyen_dung enable row level security;
alter table hieu_suat_kenh_tuyen_dung enable row level security;
alter table yeu_cau_tuyen_dung enable row level security;
alter table lich_phong_van enable row level security;
alter table offer_tuyen_dung enable row level security;
alter table de_xuat_phe_duyet enable row level security;
alter table theo_doi_onboarding enable row level security;

-- ============================================================
-- BỎ QUA CÓ CHỦ ĐÍCH (rỗng hoặc quá ít dữ liệu trên Lark lúc tra 12/10/2026, xem docs/mapping-lark-hr.md):
-- Đánh giá sau 30/60 ngày (mentor/HR) · Nhân sự đánh giá sau thử việc · Test Bộ 1/2/3 onboarding ·
-- Đề xuất offer tuyển dụng · Ghi nhận chi tiêu quỹ · Ghi nhận hỗ trợ KPI · Khảo sát tín nhiệm ·
-- Form đánh giá tái ký HĐ · Phiếu đề xuất điều chỉnh nhân sự.
-- CHƯA LÀM — chờ quyền đọc base V70gblwgkaq7M1sXk4ojD6QMpmc:
-- Nhân viên đến hạn HĐLĐ · Sinh nhật nhân viên · Lịch nghỉ phép (3 trang trong app, chưa rõ cấu trúc).
-- ============================================================
