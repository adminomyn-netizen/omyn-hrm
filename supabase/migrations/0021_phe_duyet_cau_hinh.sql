-- 0021: màn Setup luồng phiếu của Kỹ thuật:
--  · pd_o_cau_hinh: ghi đè từng ô của phiếu (bắt buộc / hiện luôn / hiện theo điều kiện / ẩn) lên cấu hình mẫu trong mã nguồn;
--  · pd_thong_bao_cau_hinh: ai nhận thông báo ở sự kiện nào của phiếu (ngoài người nộp và người duyệt luôn được báo);
--  · pd_cau_hinh_lich_su: mọi thay đổi cấu hình luồng phiếu — ai sửa gì, lúc nào, trước/sau.
-- Cùng nguyên tắc 0020: ép row level security, chỉ máy chủ đọc/ghi.

create table public.pd_o_cau_hinh (
  id uuid primary key default gen_random_uuid(),
  ma_phieu text not null,
  truong text not null,
  bat_buoc text not null default 'Mặc định' check (bat_buoc in ('Mặc định', 'Bắt buộc', 'Không bắt buộc')),
  che_do_hien text not null default 'Mặc định' check (che_do_hien in ('Mặc định', 'Luôn hiện', 'Theo điều kiện', 'Ẩn')),
  hien_truong text,
  hien_gia_tri text[],
  tao_luc timestamptz not null default now(),
  unique (ma_phieu, truong),
  check ((che_do_hien = 'Theo điều kiện') = (hien_truong is not null and coalesce(array_length(hien_gia_tri, 1), 0) > 0))
);

create table public.pd_thong_bao_cau_hinh (
  id uuid primary key default gen_random_uuid(),
  ma_phieu text not null,
  su_kien text not null check (su_kien in ('Nộp phiếu', 'Duyệt xong', 'Từ chối', 'Cần bổ sung', 'Huỷ')),
  loai_nguoi text not null check (loai_nguoi in ('Quản lý trực tiếp', 'Quản lý cấp trên', 'Chức danh', 'Nhân viên', 'Giám đốc', 'Kỹ thuật')),
  chuc_danh text,
  nhan_vien_id uuid references public.nhan_vien (id) on delete cascade,
  dang_bat boolean not null default true,
  tao_luc timestamptz not null default now(),
  check (loai_nguoi <> 'Chức danh' or length(btrim(coalesce(chuc_danh, ''))) > 0),
  check (loai_nguoi <> 'Nhân viên' or nhan_vien_id is not null)
);
create index pd_thong_bao_cau_hinh_idx on public.pd_thong_bao_cau_hinh (ma_phieu, su_kien);

create table public.pd_cau_hinh_lich_su (
  id uuid primary key default gen_random_uuid(),
  ma_phieu text not null,
  doi_tuong text not null check (doi_tuong in ('Bước duyệt', 'Ô nhập', 'Thông báo', 'Nhóm mã', 'Trạng thái loại phiếu')),
  hanh_dong text not null check (hanh_dong in ('Thêm', 'Sửa', 'Xoá')),
  mo_ta text not null,
  truoc jsonb,
  sau jsonb,
  user_id uuid,
  ten_nguoi text,
  luc timestamptz not null default now()
);
create index pd_cau_hinh_lich_su_idx on public.pd_cau_hinh_lich_su (ma_phieu, luc desc);

do $$
declare t text;
begin
  foreach t in array array['pd_o_cau_hinh', 'pd_thong_bao_cau_hinh', 'pd_cau_hinh_lich_su'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
