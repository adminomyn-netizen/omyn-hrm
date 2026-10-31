-- 0047: Doanh thu sàn của Omyn lấy từ 3 nguồn: Shopee, TikTok Shop, Facebook (chị Lâm chốt). Các danh sách nền tảng và kênh bán thu về đúng 3 nguồn.
-- Các bảng này chưa có dòng nào nên đổi ràng buộc không ảnh hưởng dữ liệu.

alter table public.kd_gian_hang drop constraint kd_gian_hang_nen_tang_check;
alter table public.kd_gian_hang add constraint kd_gian_hang_nen_tang_check check (nen_tang in ('Shopee', 'TikTok Shop', 'Facebook'));
alter table public.kd_gian_hang alter column nen_tang set default 'Shopee';

alter table public.kd_doi_tra drop constraint kd_doi_tra_kenh_check;
alter table public.kd_doi_tra add constraint kd_doi_tra_kenh_check check (kenh in ('Shopee', 'TikTok Shop', 'Facebook', 'Sỉ và đại lý', 'Khác'));

alter table public.mkt_khuyen_mai drop constraint mkt_khuyen_mai_kenh_check;
alter table public.mkt_khuyen_mai add constraint mkt_khuyen_mai_kenh_check check (kenh in ('Shopee', 'TikTok Shop', 'Facebook', 'Sỉ và đại lý', 'Tất cả kênh'));

-- Omyn nhập khẩu hàng từ Hàn Quốc: kho, lô hàng và công nợ ghi theo nhà cung cấp (danh sách nhà cung cấp dùng chung, không gõ tay tên mỗi lần).
create table public.tc_nha_cung_cap (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(btrim(ten)) > 0),
  quoc_gia text not null default 'Hàn Quốc' check (quoc_gia in ('Hàn Quốc', 'Việt Nam', 'Khác')),
  nguoi_lien_he text,
  dien_thoai text,
  email text,
  dieu_khoan_thanh_toan text,
  trang_thai text not null default 'Đang hợp tác' check (trang_thai in ('Đang hợp tác', 'Tạm dừng', 'Ngừng')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
alter table public.tc_nha_cung_cap enable row level security;
alter table public.tc_nha_cung_cap force row level security;
drop policy if exists tc_nha_cung_cap_chi_may_chu on public.tc_nha_cung_cap;
create policy tc_nha_cung_cap_chi_may_chu on public.tc_nha_cung_cap for select to authenticated using (false);

-- Công nợ nhà cung cấp, lô hàng, phiếu kho chưa có dòng nào nên đổi cột tên gõ tay thành khoá tới danh sách nhà cung cấp.
alter table public.tc_cong_no_ncc drop column nha_cung_cap;
alter table public.tc_cong_no_ncc add column nha_cung_cap_id uuid not null references public.tc_nha_cung_cap (id) on delete restrict;
alter table public.kho_lo_hang add column nha_cung_cap_id uuid references public.tc_nha_cung_cap (id) on delete set null;
alter table public.kho_nhap_xuat add column nha_cung_cap_id uuid references public.tc_nha_cung_cap (id) on delete set null;
