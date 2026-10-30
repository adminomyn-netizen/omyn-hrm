-- 0025: Nhân sự nhóm 4 (lịch nhắc): các hạn báo cáo cơ quan nhà nước (báo cáo biến động lao động, nội quy lao động…).
-- Mốc ngày để TRỐNG đến khi kế toán/luật sư xác nhận (chị Lâm dặn không tự khẳng định); hạn chưa nhập thì không nhắc.
-- Ép row level security như 0017+.

create table public.han_bao_cao_nha_nuoc (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  co_quan text,
  chu_ky text not null default 'Hằng năm' check (chu_ky in ('Hằng tháng', 'Hằng quý', '6 tháng', 'Hằng năm', 'Một lần')),
  han_ngay int check (han_ngay between 1 and 31),
  han_thang int check (han_thang between 1 and 12),
  han_mot_lan date,
  dang_bat boolean not null default true,
  xac_nhan_boi text,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (chu_ky = 'Một lần' or han_mot_lan is null),
  check (han_ngay is null or chu_ky <> 'Hằng năm' or han_thang is not null)
);

alter table public.han_bao_cao_nha_nuoc enable row level security;
alter table public.han_bao_cao_nha_nuoc force row level security;
drop policy if exists han_bao_cao_nha_nuoc_chi_may_chu on public.han_bao_cao_nha_nuoc;
create policy han_bao_cao_nha_nuoc_chi_may_chu on public.han_bao_cao_nha_nuoc for select to authenticated using (false);

insert into public.han_bao_cao_nha_nuoc (ten, co_quan, chu_ky, ghi_chu) values
  ('Báo cáo tình hình biến động lao động', 'Sở Lao động – Thương binh và Xã hội / Cổng dịch vụ công', '6 tháng', 'Chờ kế toán/luật sư xác nhận mốc ngày (đối chiếu hrm.vieclamngay.vn); nhập hạn rồi mới nhắc'),
  ('Báo cáo tình hình sử dụng lao động hằng năm', 'Sở Lao động – Thương binh và Xã hội', 'Hằng năm', 'Chờ kế toán/luật sư xác nhận mốc ngày; nhập hạn rồi mới nhắc'),
  ('Nội quy lao động: đăng ký hoặc rà soát', 'Cơ quan quản lý lao động cấp tỉnh', 'Một lần', 'Chờ luật sư xác nhận điều kiện áp dụng và thời hạn; nhập hạn rồi mới nhắc');
