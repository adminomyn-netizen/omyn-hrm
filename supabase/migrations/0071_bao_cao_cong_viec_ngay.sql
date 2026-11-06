-- 0071 — BÁO CÁO CÔNG VIỆC HẰNG NGÀY (chị Lâm 06/11): link minh chứng cho từng việc trong ngày + báo cáo cuối ngày của từng người.
-- Chỉ THÊM cột/bảng, không đổi dữ liệu cũ. Máy chủ đọc/ghi (FORCE RLS như 0032).

alter table public.cong_viec_ngay
  add column if not exists link_bao_cao text check (link_bao_cao is null or (length(link_bao_cao) <= 500 and link_bao_cao ~* '^https?://')),
  add column if not exists ghi_chu text check (ghi_chu is null or length(ghi_chu) <= 1000);

create table if not exists public.cong_viec_bao_cao (
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  tom_tat text not null check (length(btrim(tom_tat)) > 0 and length(tom_tat) <= 2000),
  link text check (link is null or (length(link) <= 500 and link ~* '^https?://')),
  nop_luc timestamptz not null default now(),
  primary key (nhan_vien_id, ngay)
);
create index if not exists cong_viec_bao_cao_ngay_idx on public.cong_viec_bao_cao (ngay);

alter table public.cong_viec_bao_cao enable row level security;
alter table public.cong_viec_bao_cao force row level security;
drop policy if exists cong_viec_bao_cao_chi_may_chu on public.cong_viec_bao_cao;
create policy cong_viec_bao_cao_chi_may_chu on public.cong_viec_bao_cao for select to authenticated using (false);
