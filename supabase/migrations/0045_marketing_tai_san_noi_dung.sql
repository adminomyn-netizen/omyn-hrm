-- 0045: Khúc MARKETING, lát 3: thư viện tài sản nội dung (ảnh, video, mẫu thiết kế) kèm nguồn gốc và bản quyền. Chỉ dựng sổ; không nạp số liệu.

create table public.mkt_tai_san (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  loai text not null default 'Ảnh sản phẩm' check (loai in ('Ảnh sản phẩm', 'Video', 'Logo và nhận diện', 'Mẫu thiết kế', 'Tài liệu thương hiệu', 'Khác')),
  link text not null check (length(btrim(link)) > 0),
  san_pham_id uuid references public.sp_san_pham (id) on delete set null,
  nguon_goc text not null default 'Chưa rõ nguồn' check (nguon_goc in ('Của công ty', 'Đã mua bản quyền', 'Có đồng ý bằng văn bản của người xuất hiện', 'Chưa rõ nguồn')),
  han_su_dung date,
  nguoi_tao_id uuid references public.nhan_vien (id) on delete set null,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

alter table public.mkt_tai_san enable row level security;
alter table public.mkt_tai_san force row level security;
drop policy if exists mkt_tai_san_chi_may_chu on public.mkt_tai_san;
create policy mkt_tai_san_chi_may_chu on public.mkt_tai_san for select to authenticated using (false);
