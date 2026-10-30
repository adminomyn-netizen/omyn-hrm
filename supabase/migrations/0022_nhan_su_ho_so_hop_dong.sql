-- 0022: Nhân sự nhóm 1 (hồ sơ + hợp đồng): phụ lục hợp đồng, tài sản cấp phát, và LỊCH SỬ thay đổi dùng chung cho cả mảng Nhân sự
-- (ai, lúc nào, sửa gì). Cùng nguyên tắc 0017+: ép row level security, chỉ máy chủ đọc/ghi.

create table public.hop_dong_phu_luc (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  so_hop_dong text,
  so_phu_luc text,
  loai_thay_doi text not null default 'Khác' check (loai_thay_doi in ('Gia hạn', 'Điều chỉnh lương', 'Điều chỉnh chức danh', 'Điều chỉnh địa điểm', 'Khác')),
  ngay_hieu_luc date not null,
  den_ngay_moi date,
  noi_dung text not null check (length(btrim(noi_dung)) > 0),
  trang_thai text not null default 'Chờ ký' check (trang_thai in ('Chờ ký', 'Đã ký')),
  tao_luc timestamptz not null default now(),
  check (den_ngay_moi is null or den_ngay_moi >= ngay_hieu_luc)
);
create index hop_dong_phu_luc_nv_idx on public.hop_dong_phu_luc (nhan_vien_id);

create table public.tai_san_cap_phat (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ten_tai_san text not null check (length(btrim(ten_tai_san)) > 0),
  ma_tai_san text,
  so_luong int not null default 1 check (so_luong > 0),
  ngay_cap date not null,
  ngay_tra date,
  tinh_trang text not null default 'Đang giữ' check (tinh_trang in ('Đang giữ', 'Đã trả', 'Mất/hỏng')),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (ngay_tra is null or ngay_tra >= ngay_cap)
);
create index tai_san_cap_phat_nv_idx on public.tai_san_cap_phat (nhan_vien_id, tinh_trang);

create table public.nhan_su_lich_su (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid,
  doi_tuong text not null,
  doi_tuong_id uuid,
  hanh_dong text not null check (hanh_dong in ('Thêm', 'Sửa', 'Xoá')),
  mo_ta text not null,
  truoc jsonb,
  sau jsonb,
  user_id uuid,
  ten_nguoi text,
  luc timestamptz not null default now()
);
create index nhan_su_lich_su_nv_idx on public.nhan_su_lich_su (nhan_vien_id, luc desc);
create index nhan_su_lich_su_dt_idx on public.nhan_su_lich_su (doi_tuong, luc desc);

do $$
declare t text;
begin
  foreach t in array array['hop_dong_phu_luc', 'tai_san_cap_phat', 'nhan_su_lich_su'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
