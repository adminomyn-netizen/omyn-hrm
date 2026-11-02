-- Chị Lâm 02/11: phiếu phê duyệt dùng đúng phòng ban của Omyn (5 khối đã có ở bảng khoi), bỏ tên phòng của Amia.
delete from public.pd_danh_muc where loai in ('Nhóm làm việc', 'Bộ phận', 'Phòng ban');
insert into public.pd_danh_muc (loai, gia_tri, thu_tu)
select l.loai, k.ten, k.thu_tu
from (values ('Nhóm làm việc'), ('Bộ phận'), ('Phòng ban')) as l(loai),
     (values ('Ban điều hành', 1), ('Marketing & Ecom', 2), ('Kinh doanh', 3), ('Tài chính - Kế toán', 4), ('Hành chính nhân sự', 5)) as k(ten, thu_tu);
