-- Phiếu đánh giá phỏng vấn: mỗi ứng viên có thể có nhiều phiếu (mỗi vòng / mỗi người phỏng vấn một phiếu).
-- Tiêu chí lưu kèm điểm trong từng phiếu (jsonb) để sửa danh sách tiêu chí sau này không làm đổi phiếu cũ.
create table public.danh_gia_phong_van (
  id uuid primary key default gen_random_uuid(),
  ung_vien_id uuid not null references public.ung_vien (id) on delete cascade,
  vong text not null default 'Vòng 1' check (vong in ('Sàng lọc điện thoại', 'Vòng 1', 'Vòng 2', 'Vòng cuối')),
  nguoi_phong_van_id uuid references public.nhan_vien (id) on delete set null,
  ngay date not null default current_date,
  tieu_chi jsonb not null default '[]'::jsonb,
  luong_mong_muon text,
  ngay_co_the_di_lam date,
  diem_manh text,
  diem_can_luu_y text,
  nhan_xet text,
  ket_luan text not null default 'Cân nhắc' check (ket_luan in ('Đạt', 'Cân nhắc', 'Không đạt')),
  tao_boi uuid,
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);
create index danh_gia_phong_van_uv_idx on public.danh_gia_phong_van (ung_vien_id, ngay);

alter table public.danh_gia_phong_van enable row level security;
alter table public.danh_gia_phong_van force row level security;
drop policy if exists danh_gia_phong_van_chi_may_chu on public.danh_gia_phong_van;
create policy danh_gia_phong_van_chi_may_chu on public.danh_gia_phong_van for select to authenticated using (false);
