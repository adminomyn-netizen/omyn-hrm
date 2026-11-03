-- 0062: đơn giao hàng có tiền thu hộ (COD), phí vận chuyển, ngày giao và số COD nhà vận chuyển đã chuyển về, để đối soát.
alter table public.kho_dong_goi_giao
  add column thu_ho bigint not null default 0 check (thu_ho >= 0),
  add column phi_van_chuyen bigint check (phi_van_chuyen is null or phi_van_chuyen >= 0),
  add column ngay_giao date,
  add column cod_da_nhan bigint not null default 0 check (cod_da_nhan >= 0),
  add column ngay_nhan_cod date;
