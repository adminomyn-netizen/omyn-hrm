-- 0012 — Quy trình tuyển dụng đầy đủ + hồ sơ nhân viên có giấy tờ.
-- Cấu trúc theo Base Lark của MSC (Tuyển dụng: 2.2 Yêu cầu, 4.1 Đề xuất, 1.2/1.3 chi phí và kênh, 3.1 Hồ sơ ứng viên; HRIS: 1.1 Quản lý nhân sự, 1.6 Gia đình).
-- CHỈ THÊM bảng/cột; không đổi hay xoá dữ liệu có sẵn. Mọi bảng mới: bật + ÉP RLS, không cấp quyền cho anon/authenticated
-- (trình duyệt không chạm DB; máy chủ dùng service_role sau khi kiểm vai trò). Nhật ký chỉ ghi mã bản ghi, không ghi dữ liệu cá nhân.

-- ───────── 1. Yêu cầu tuyển dụng (từ sếp / trưởng bộ phận → HCNS tiếp nhận) ─────────
create sequence public.yeu_cau_tuyen_dung_so;

create table public.yeu_cau_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique default ('YC-' || lpad(nextval('public.yeu_cau_tuyen_dung_so')::text, 4, '0')),
  vi_tri text not null check (char_length(vi_tri) between 2 and 120),
  khoi_id uuid references public.khoi (id),
  so_luong int not null default 1 check (so_luong between 1 and 99),
  loai_tuyen text not null default 'Trong định biên' check (loai_tuyen in ('Thay thế', 'Trong định biên', 'Ngoài định biên', 'Thời vụ')),
  thay_the_cho text,
  muc_luong text,
  mo_ta_ngan text,
  yeu_cau_chinh text,
  han_can_nhan_su date,
  nguoi_yeu_cau_id uuid references public.nhan_vien (id) on delete set null,
  nguoi_yeu_cau_ten text not null,
  trang_thai text not null default 'Chờ tiếp nhận'
    check (trang_thai in ('Chờ tiếp nhận', 'Đã tiếp nhận', 'Đang đăng tin', 'Hoàn thành', 'Từ chối', 'Huỷ')),
  nguoi_tiep_nhan_id uuid references public.nhan_vien (id) on delete set null,
  ngay_tiep_nhan timestamptz,
  ly_do_tu_choi text,
  ngay_hoan_thanh timestamptz,
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);
create index yeu_cau_tuyen_dung_tt_idx on public.yeu_cau_tuyen_dung (trang_thai, tao_luc desc);

-- Tin đăng sinh ra từ yêu cầu nào (1 yêu cầu có thể có nhiều tin, vd tách theo chi nhánh).
alter table public.tin_tuyen_dung
  add column if not exists yeu_cau_id uuid references public.yeu_cau_tuyen_dung (id) on delete set null;
create index if not exists tin_tuyen_dung_yc_idx on public.tin_tuyen_dung (yeu_cau_id);

-- Ứng viên: ngày nhận việc (để tính thời gian tuyển) + lý do không đạt.
alter table public.ung_vien
  add column if not exists ngay_nhan_viec date,
  add column if not exists ly_do_khong_dat text;

-- ───────── 2. Đăng tin theo kênh + chi phí ─────────
create table public.dang_tin_kenh (
  id uuid primary key default gen_random_uuid(),
  tin_tuyen_dung_id uuid not null references public.tin_tuyen_dung (id) on delete cascade,
  kenh text not null check (kenh in ('Facebook', 'Website OMYN', 'TopCV', 'Zalo', 'LinkedIn', 'VietnamWorks', 'Nội bộ', 'Khác')),
  link_bai text,
  ngay_dang date not null default current_date,
  chi_phi bigint not null default 0 check (chi_phi >= 0),
  trang_thai text not null default 'Đang đăng' check (trang_thai in ('Đang đăng', 'Đã gỡ')),
  ghi_chu text,
  nguoi_dang_id uuid references public.nhan_vien (id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index dang_tin_kenh_tin_idx on public.dang_tin_kenh (tin_tuyen_dung_id);

-- ───────── 3. Hồ sơ cá nhân (sơ yếu lý lịch) ─────────
create table public.ho_so_ca_nhan (
  nhan_vien_id uuid primary key references public.nhan_vien (id) on delete cascade,
  gioi_tinh text check (gioi_tinh in ('Nam', 'Nữ')),
  ngay_sinh date,
  dan_toc text,
  ton_giao text,
  tinh_trang_hon_nhan text check (tinh_trang_hon_nhan in ('Độc thân', 'Đã lập gia đình', 'Đã lập gia đình, có con', 'Khác')),
  dien_thoai text,
  cccd text,
  ngay_cap_cccd date,
  noi_cap_cccd text,
  dia_chi_thuong_tru text,
  dia_chi_hien_tai text,
  nguoi_than_ten text,
  nguoi_than_quan_he text,
  nguoi_than_dien_thoai text,
  trinh_do text,
  truong text,
  nganh text,
  ma_so_thue text,
  so_bhxh text,
  ngan_hang text,
  so_tai_khoan text,
  ghi_chu text,
  cap_nhat_luc timestamptz not null default now(),
  cap_nhat_boi uuid references auth.users (id) on delete set null
);

create table public.than_nhan (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ho_ten text not null,
  quan_he text not null check (quan_he in ('Vợ', 'Chồng', 'Con', 'Cha', 'Mẹ', 'Anh chị em', 'Người giám hộ')),
  ngay_sinh date,
  cccd text,
  phu_thuoc boolean not null default false,
  tao_luc timestamptz not null default now()
);
create index than_nhan_nv_idx on public.than_nhan (nhan_vien_id);

-- ───────── 4. Giấy tờ đính kèm (bản scan) ─────────
create table public.tai_lieu_nhan_vien (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  loai text not null check (loai in (
    'CCCD mặt trước', 'CCCD mặt sau', 'Sơ yếu lý lịch', 'Bằng cấp', 'Hợp đồng lao động', 'Cam kết bảo mật (NDA)',
    'Giấy khám sức khoẻ', 'Sổ BHXH', 'Giấy tờ người phụ thuộc', 'Khác')),
  ten_tep text not null,
  duong_dan text not null unique,
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png')),
  kich_thuoc int not null check (kich_thuoc > 0 and kich_thuoc <= 10485760),
  trang_thai text not null default 'Chờ xác nhận' check (trang_thai in ('Chờ xác nhận', 'Đã xác nhận', 'Cần bổ sung')),
  ghi_chu text,
  tai_boi uuid references auth.users (id) on delete set null,
  tao_luc timestamptz not null default now(),
  -- Không xoá cứng: chỉ gỡ khỏi hồ sơ (kèm lý do), tệp vẫn nằm trong kho để truy vết.
  da_go boolean not null default false,
  go_luc timestamptz,
  go_boi uuid references auth.users (id) on delete set null,
  ly_do_go text
);
create index tai_lieu_nv_idx on public.tai_lieu_nhan_vien (nhan_vien_id) where not da_go;

-- Ai đã mở giấy tờ nào, lúc nào (giấy tờ là dữ liệu nhạy cảm).
create table public.nhat_ky_xem_tai_lieu (
  id bigint generated always as identity primary key,
  tai_lieu_id uuid not null references public.tai_lieu_nhan_vien (id) on delete cascade,
  nguoi_id uuid references auth.users (id) on delete set null,
  luc timestamptz not null default now()
);
create index nhat_ky_xem_tl_idx on public.nhat_ky_xem_tai_lieu (tai_lieu_id, luc desc);

-- ───────── 5. Kho tệp riêng tư: chỉ PDF/JPG/PNG, tối đa 10 MB, không link công khai ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ho-so-nhan-vien', 'ho-so-nhan-vien', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];

-- ───────── 6. Nhật ký thao tác: chỉ ghi mã bản ghi, KHÔNG chép dữ liệu cá nhân ─────────
create function private.ghi_nhat_ky_an() returns trigger
language plpgsql security definer set search_path = '' as $$
declare nguoi uuid;
begin
  nguoi := coalesce(nullif(current_setting('private.nguoi_thuc_hien', true), '')::uuid, nullif(auth.jwt() ->> 'sub', '')::uuid);
  insert into public.nhat_ky (nguoi_thuc_hien, bang, hanh_dong, ban_ghi, truoc, sau)
  values (nguoi, tg_table_name, tg_op,
          coalesce(case when tg_op <> 'DELETE' then to_jsonb(new) ->> 'id' end, case when tg_op <> 'INSERT' then to_jsonb(old) ->> 'id' end,
                   case when tg_op <> 'DELETE' then to_jsonb(new) ->> 'nhan_vien_id' end, case when tg_op <> 'INSERT' then to_jsonb(old) ->> 'nhan_vien_id' end),
          null, null);
  return coalesce(new, old);
end $$;

revoke all on function private.ghi_nhat_ky_an() from public, anon, authenticated;

create trigger nk_yeu_cau_tuyen_dung after insert or update or delete on public.yeu_cau_tuyen_dung for each row execute function private.ghi_nhat_ky_an();
create trigger nk_dang_tin_kenh after insert or update or delete on public.dang_tin_kenh for each row execute function private.ghi_nhat_ky_an();
create trigger nk_ho_so_ca_nhan after insert or update or delete on public.ho_so_ca_nhan for each row execute function private.ghi_nhat_ky_an();
create trigger nk_than_nhan after insert or update or delete on public.than_nhan for each row execute function private.ghi_nhat_ky_an();
create trigger nk_tai_lieu_nhan_vien after insert or update or delete on public.tai_lieu_nhan_vien for each row execute function private.ghi_nhat_ky_an();

-- ───────── 7. Khoá: RLS bật + ép, không policy, không grant (chỉ service_role đi qua) ─────────
do $$
declare t text;
begin
  foreach t in array array['yeu_cau_tuyen_dung', 'dang_tin_kenh', 'ho_so_ca_nhan', 'than_nhan', 'tai_lieu_nhan_vien', 'nhat_ky_xem_tai_lieu']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    -- policy từ chối tất cả cho trình duyệt: ghi rõ ý định (bài kiểm cấu trúc đòi mỗi bảng có policy); máy chủ dùng service_role nên không bị ảnh hưởng.
    execute format('create policy tu_choi_trinh_duyet on public.%I for all to authenticated using (false) with check (false)', t);
  end loop;
end $$;
revoke all on sequence public.yeu_cau_tuyen_dung_so from anon, authenticated;
