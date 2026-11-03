-- 0065: phiếu xuất kho TỰ SINH từ dòng hàng của đơn lẻ "Đã giao". Xoá dòng hàng/đơn thì phiếu tự xoá theo (hàng coi như về kho).
alter table public.kho_nhap_xuat add column don_le_dong_id uuid references public.kd_don_le_dong (id) on delete cascade;
create index kho_nhap_xuat_don_le_dong_idx on public.kho_nhap_xuat (don_le_dong_id) where don_le_dong_id is not null;
