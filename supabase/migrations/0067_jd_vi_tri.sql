-- 0067 — Mô tả công việc (JD) theo từng vị trí tuyển dụng (chị Lâm 4/11: "Phần tuyển dụng có mục JD từng vị trí không?").
-- Chỉ thêm bảng mới (không đụng bảng cũ). FORCE RLS, chỉ máy chủ (khoá service) đọc/ghi, như các sổ HR khác.

create table public.jd_vi_tri (
  id uuid primary key default gen_random_uuid(),
  vi_tri text not null check (char_length(vi_tri) between 2 and 120),
  khoi_id uuid references public.khoi (id) on delete set null,
  cap_bac text,
  bao_cao_cho text,
  hinh_thuc text not null default 'Toàn thời gian' check (hinh_thuc in ('Toàn thời gian', 'Bán thời gian', 'Thời vụ', 'Cộng tác viên', 'Thực tập')),
  muc_dich text,
  nhiem_vu text,
  yeu_cau text,
  ky_nang text,
  quyen_loi text,
  muc_luong text,
  trang_thai text not null default 'Đang dùng' check (trang_thai in ('Nháp', 'Đang dùng', 'Ngừng dùng')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create unique index jd_vi_tri_vi_tri_uq on public.jd_vi_tri (lower(vi_tri)) where trang_thai <> 'Ngừng dùng';

alter table public.jd_vi_tri enable row level security;
alter table public.jd_vi_tri force row level security;
drop policy if exists jd_vi_tri_chi_may_chu on public.jd_vi_tri;
create policy jd_vi_tri_chi_may_chu on public.jd_vi_tri for select to authenticated using (false);
