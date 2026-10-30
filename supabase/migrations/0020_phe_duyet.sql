-- 0020: Bộ PHÊ DUYỆT (chuyển từ Lark): 19 loại phiếu cấu hình trong mã nguồn (src/lib/phe-duyet-mau.ts),
--  · pd_danh_muc: danh sách lựa chọn "Data from Base" của Lark (đơn vị, bộ phận, khoản chi, tài khoản quỹ…), sửa được trong app;
--  · pd_cau_hinh_phieu: nhóm mã (HR/FIN/MKT/ADM…) của từng loại phiếu, sửa được;
--  · pd_luong_duyet: ma trận người duyệt theo bước (chị Lâm bổ sung sau), có điều kiện rẽ nhánh theo một ô của phiếu;
--  · pd_phieu / pd_buoc / pd_lich_su / pd_tep: phiếu đã nộp, người duyệt từng bước (chụp lại lúc nộp), lịch sử, tệp đính kèm;
--  · pd_dem_so + pd_cap_so(): số phiếu chạy tăng, không trùng (HR-2610-0001 = nhóm-năm tháng-số thứ tự);
--  · thong_bao_app: chuông thông báo trong ứng dụng.
-- Mọi bảng: bật + ÉP row level security, chỉ máy chủ (service role) đọc/ghi; quyền kiểm ở server action.

create table public.pd_danh_muc (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (length(btrim(loai)) > 0),
  gia_tri text not null check (length(btrim(gia_tri)) > 0),
  thu_tu int not null default 0,
  tao_luc timestamptz not null default now(),
  unique (loai, gia_tri)
);

create table public.pd_cau_hinh_phieu (
  id uuid primary key default gen_random_uuid(),
  ma_phieu text not null unique,
  nhom_ma text not null default 'HR' check (nhom_ma ~ '^[A-Z]{2,6}$'),
  dang_dung boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.pd_luong_duyet (
  id uuid primary key default gen_random_uuid(),
  ma_phieu text not null,
  buoc int not null check (buoc between 1 and 30),
  ten_buoc text,
  kieu text not null default 'AND' check (kieu in ('AND', 'OR', 'CC')),
  loai_nguoi text not null default 'Quản lý trực tiếp'
    check (loai_nguoi in ('Quản lý trực tiếp', 'Quản lý cấp trên', 'Chức danh', 'Nhân viên', 'Giám đốc', 'Kỹ thuật')),
  chuc_danh text,
  nhan_vien_id uuid references public.nhan_vien (id) on delete cascade,
  dieu_kien_truong text,
  dieu_kien_gia_tri text,
  tao_luc timestamptz not null default now(),
  check (loai_nguoi <> 'Chức danh' or length(btrim(coalesce(chuc_danh, ''))) > 0),
  check (loai_nguoi <> 'Nhân viên' or nhan_vien_id is not null),
  check ((dieu_kien_truong is null) = (dieu_kien_gia_tri is null))
);
create index pd_luong_duyet_phieu_idx on public.pd_luong_duyet (ma_phieu, buoc);

create table public.pd_dem_so (
  nhom_ma text not null,
  thang text not null check (thang ~ '^[0-9]{4}$'),
  so int not null default 0,
  primary key (nhom_ma, thang)
);

-- Cấp số tiếp theo trong nhóm/tháng, nguyên tử (hai người nộp cùng lúc không bao giờ trùng số).
create function public.pd_cap_so(p_nhom text, p_thang text) returns int
language sql volatile set search_path = public as $$
  insert into public.pd_dem_so (nhom_ma, thang, so) values (p_nhom, p_thang, 1)
  on conflict (nhom_ma, thang) do update set so = public.pd_dem_so.so + 1
  returning so;
$$;
revoke all on function public.pd_cap_so(text, text) from public, anon, authenticated;

create table public.pd_phieu (
  id uuid primary key default gen_random_uuid(),
  so_phieu text not null unique,
  ma_phieu text not null,
  nhom_ma text not null,
  nguoi_nop_id uuid references public.nhan_vien (id) on delete set null,
  nguoi_tao_user uuid,
  du_lieu jsonb not null default '{}'::jsonb,
  trang_thai text not null default 'Chờ duyệt' check (trang_thai in ('Chờ duyệt', 'Cần bổ sung', 'Đã duyệt', 'Từ chối', 'Đã huỷ')),
  buoc_hien_tai int not null default 1,
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now(),
  hoan_tat_luc timestamptz
);
create index pd_phieu_nguoi_nop_idx on public.pd_phieu (nguoi_nop_id, tao_luc desc);
create index pd_phieu_trang_thai_idx on public.pd_phieu (trang_thai, tao_luc desc);
create index pd_phieu_ma_idx on public.pd_phieu (ma_phieu, tao_luc desc);

create table public.pd_buoc (
  id uuid primary key default gen_random_uuid(),
  phieu_id uuid not null references public.pd_phieu (id) on delete cascade,
  buoc int not null,
  ten_buoc text,
  kieu text not null check (kieu in ('AND', 'OR', 'CC')),
  nhan_vien_id uuid references public.nhan_vien (id) on delete set null,
  user_id uuid,
  ten_nguoi text,
  trang_thai text not null default 'Chờ' check (trang_thai in ('Chờ', 'Đã duyệt', 'Từ chối', 'Bỏ qua', 'Đã xem')),
  y_kien text,
  xu_ly_luc timestamptz
);
create index pd_buoc_phieu_idx on public.pd_buoc (phieu_id, buoc);
create index pd_buoc_user_idx on public.pd_buoc (user_id, trang_thai);

create table public.pd_lich_su (
  id uuid primary key default gen_random_uuid(),
  phieu_id uuid not null references public.pd_phieu (id) on delete cascade,
  buoc int,
  user_id uuid,
  ten_nguoi text,
  hanh_dong text not null check (hanh_dong in ('Nộp', 'Duyệt', 'Từ chối', 'Yêu cầu bổ sung', 'Nộp lại', 'Huỷ', 'Bỏ qua bước', 'Ghi chú')),
  ghi_chu text,
  luc timestamptz not null default now()
);
create index pd_lich_su_phieu_idx on public.pd_lich_su (phieu_id, luc);

create table public.pd_tep (
  id uuid primary key default gen_random_uuid(),
  phieu_id uuid not null references public.pd_phieu (id) on delete cascade,
  truong text not null,
  ten_tep text not null,
  duong_dan text not null,
  kich_thuoc bigint not null default 0 check (kich_thuoc >= 0),
  loai text,
  tao_luc timestamptz not null default now()
);
create index pd_tep_phieu_idx on public.pd_tep (phieu_id);

create table public.thong_bao_app (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tieu_de text not null,
  noi_dung text,
  url text,
  da_doc boolean not null default false,
  tao_luc timestamptz not null default now()
);
create index thong_bao_app_user_idx on public.thong_bao_app (user_id, da_doc, tao_luc desc);

do $$
declare t text;
begin
  foreach t in array array['pd_danh_muc', 'pd_cau_hinh_phieu', 'pd_luong_duyet', 'pd_dem_so', 'pd_phieu', 'pd_buoc', 'pd_lich_su', 'pd_tep', 'thong_bao_app'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

-- Danh mục lựa chọn khởi tạo (chị Lâm bổ sung/sửa trong app; các danh sách chưa có số liệu để trống).
insert into public.pd_danh_muc (loai, gia_tri, thu_tu) values
  ('Đơn vị làm việc', 'AVI', 1), ('Đơn vị làm việc', 'ADL', 2), ('Đơn vị làm việc', 'MSC', 3),
  ('Nhóm làm việc', 'Phòng Tiếp thị', 1), ('Nhóm làm việc', 'Phòng Nhân lực & Phát triển', 2), ('Nhóm làm việc', 'Phòng kinh doanh', 3),
  ('Nhóm làm việc', 'Phòng Hành chính', 4), ('Nhóm làm việc', 'Phòng Công nghệ Thông tin', 5), ('Nhóm làm việc', 'Bộ phận Hành chính & Nhân lực', 6),
  ('Nhóm làm việc', 'Bộ phận Tư vấn', 7), ('Nhóm làm việc', 'Bộ phận Trị liệu', 8), ('Nhóm làm việc', 'Bộ phận Thu ngân', 9),
  ('Nhóm làm việc', 'Phòng Dịch vụ & Khách hàng', 10), ('Nhóm làm việc', 'Phòng Kế Toán', 11),
  ('Bộ phận', 'Phòng Tiếp thị', 1), ('Bộ phận', 'Phòng Nhân lực & Phát triển', 2), ('Bộ phận', 'Phòng kinh doanh', 3),
  ('Bộ phận', 'Phòng Hành chính', 4), ('Bộ phận', 'Phòng Công nghệ Thông tin', 5), ('Bộ phận', 'Bộ phận Tư vấn', 6),
  ('Bộ phận', 'Bộ phận Trị liệu', 7), ('Bộ phận', 'Bộ phận Thu ngân', 8), ('Bộ phận', 'Phòng Dịch vụ & Khách hàng', 9), ('Bộ phận', 'Phòng Kế Toán', 10),
  ('Phòng ban', 'Phòng Tiếp thị', 1), ('Phòng ban', 'Phòng Nhân lực & Phát triển', 2), ('Phòng ban', 'Phòng kinh doanh', 3),
  ('Phòng ban', 'Phòng Hành chính', 4), ('Phòng ban', 'Phòng Công nghệ Thông tin', 5), ('Phòng ban', 'Bộ phận Tư vấn', 6),
  ('Phòng ban', 'Bộ phận Trị liệu', 7), ('Phòng ban', 'Bộ phận Thu ngân', 8), ('Phòng ban', 'Phòng Dịch vụ & Khách hàng', 9), ('Phòng ban', 'Phòng Kế Toán', 10),
  ('Loại nghỉ', 'Nghỉ phép năm', 1), ('Loại nghỉ', 'Nghỉ không lương', 2), ('Loại nghỉ', 'Nghỉ ốm', 3), ('Loại nghỉ', 'Nghỉ việc riêng', 4),
  ('Tài khoản quỹ', 'Két tiền mặt', 1), ('Tài khoản quỹ', 'Tài khoản ngân hàng', 2)
on conflict do nothing;

-- Nhóm mã khởi tạo theo đề xuất của chị Lâm (sửa được trong app).
insert into public.pd_cau_hinh_phieu (ma_phieu, nhom_ma) values
  ('ban-giao-cong-viec', 'HR'), ('ban-giao-nghia-vu-tai-chinh', 'FIN'), ('ban-giao-tai-san', 'HR'),
  ('ke-hoach-ngan-sach', 'FIN'), ('dang-ky-vang-mat', 'HR'), ('tiep-nhan-yeu-cau-hanh-chinh', 'ADM'),
  ('phieu-thu-tien', 'FIN'), ('xac-nhan-lam-them-gio', 'HR'), ('dang-ky-truc-page', 'MKT'),
  ('de-xuat-khen-thuong-ky-luat', 'HR'), ('de-xuat-dieu-chinh-nhan-su', 'HR'), ('xin-nghi-viec', 'HR'),
  ('xin-phep-lam-online', 'HR'), ('dieu-chinh-sai-sot-cham-cong', 'HR'), ('de-nghi-hoan-ung', 'FIN'),
  ('de-nghi-thanh-toan', 'FIN'), ('de-nghi-tam-ung', 'FIN'), ('de-xuat-tuyen-dung', 'HR'), ('de-xuat-di-cong-tac', 'HR')
on conflict (ma_phieu) do nothing;

-- Luồng duyệt mặc định (CHỈ là khung để chạy được ngay; ma trận người duyệt thật chị Lâm sẽ sửa trong app):
-- bước 1 quản lý trực tiếp, bước 2 giám đốc.
insert into public.pd_luong_duyet (ma_phieu, buoc, ten_buoc, kieu, loai_nguoi)
select c.ma_phieu, b.buoc, b.ten, 'AND', b.loai
from public.pd_cau_hinh_phieu c
cross join (values (1, 'Quản lý trực tiếp duyệt', 'Quản lý trực tiếp'), (2, 'Giám đốc duyệt', 'Giám đốc')) as b(buoc, ten, loai);

-- Kho tệp đính kèm: bucket riêng tư, không chính sách nào → chỉ service role truy cập (nếu có schema storage).
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit) values ('phe-duyet-tep', 'phe-duyet-tep', false, 26214400) on conflict (id) do update set file_size_limit = 26214400;
  end if;
end $$;
