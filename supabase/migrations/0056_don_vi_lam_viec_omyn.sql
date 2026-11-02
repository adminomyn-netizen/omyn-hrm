-- Chị Lâm 02/11: các phiếu phê duyệt chỉ còn đơn vị Omyn (bỏ AVI, ADL, MSC của bên Amia).
delete from public.pd_danh_muc where loai = 'Đơn vị làm việc' and gia_tri in ('AVI', 'ADL', 'MSC');
insert into public.pd_danh_muc (loai, gia_tri, thu_tu)
select 'Đơn vị làm việc', 'Omyn', 1
where not exists (select 1 from public.pd_danh_muc where loai = 'Đơn vị làm việc' and gia_tri = 'Omyn');
