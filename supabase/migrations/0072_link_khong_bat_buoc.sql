-- Link không bắt buộc (chị Phượng/chị Lâm 09/11/2026): thư viện tài sản nội dung được lưu không cần link lưu trữ.
alter table public.mkt_tai_san alter column link drop not null;
