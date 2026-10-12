-- Dữ liệu mẫu để demo, khớp với src/lib/demo-data.ts.
-- Chạy bằng: supabase db execute -f supabase/seed.sql (sau khi đã push migration).

insert into khoi (ten, mo_ta) values
  ('Ban điều hành', 'Hội đồng quản trị & Tổng giám đốc'),
  ('Marketing', 'Thương hiệu, nội dung, truyền thông Huskin'),
  ('Kinh doanh', 'Bán hàng, kênh phân phối, đối tác'),
  ('Vận hành - Kho - Tài chính', 'Vận hành, kho vận, kế toán - tài chính');

insert into nhan_vien (ma_nhan_vien, ho_ten, chuc_danh, khoi_id, email, ngay_vao_lam, trang_thai)
select 'NV003', 'Nguyễn Thị Hoa', 'Trưởng phòng Marketing', id, 'hoa.nguyen@omyn.vn', date '2024-03-15', 'Đang làm'
from khoi where ten = 'Marketing'
union all
select 'NV004', 'Trần Văn Khôi', 'Chuyên viên Nội dung', id, 'khoi.tran@omyn.vn', date '2025-02-01', 'Đang làm'
from khoi where ten = 'Marketing'
union all
select 'NV005', 'Lê Thị Mai', 'Trưởng phòng Kinh doanh', id, 'mai.le@omyn.vn', date '2024-05-10', 'Đang làm'
from khoi where ten = 'Kinh doanh'
union all
select 'NV006', 'Phan Đức Anh', 'Nhân viên Kinh doanh', id, 'anh.phan@omyn.vn', date '2025-06-01', 'Thử việc'
from khoi where ten = 'Kinh doanh'
union all
select 'NV007', 'Vũ Thị Ngọc', 'Kế toán trưởng', id, 'ngoc.vu@omyn.vn', date '2024-02-20', 'Đang làm'
from khoi where ten = 'Vận hành - Kho - Tài chính'
union all
select 'NV008', 'Đỗ Minh Quân', 'Nhân viên Kho vận', id, 'quan.do@omyn.vn', date '2025-04-18', 'Đang làm'
from khoi where ten = 'Vận hành - Kho - Tài chính';

insert into cham_cong (nhan_vien_id, ngay, gio_vao, gio_ra, trang_thai)
select nv.id, current_date, v.gio_vao, v.gio_ra, v.trang_thai
from (values
  ('NV003', time '08:12', time '17:31', 'Đúng giờ'),
  ('NV004', time '08:42', time '17:35', 'Đi muộn'),
  ('NV005', time '08:10', time '17:32', 'Đúng giờ'),
  ('NV006', time '08:19', time '17:33', 'Đúng giờ'),
  ('NV007', time '08:05', time '17:30', 'Đúng giờ'),
  ('NV008', null::time, null::time, 'Vắng mặt')
) as v(ma, gio_vao, gio_ra, trang_thai)
join nhan_vien nv on nv.ma_nhan_vien = v.ma;

insert into don_tu (nhan_vien_id, loai, tu_ngay, den_ngay, trang_thai)
select nv.id, v.loai, v.tu::date, v.den::date, v.trang_thai
from (values
  ('NV004', 'Nghỉ phép năm', '2026-10-14', '2026-10-15', 'Chờ duyệt'),
  ('NV006', 'Tạm ứng lương', '2026-10-12', '2026-10-12', 'Chờ duyệt'),
  ('NV008', 'Nghỉ ốm', '2026-10-09', '2026-10-10', 'Đã duyệt')
) as v(ma, loai, tu, den, trang_thai)
join nhan_vien nv on nv.ma_nhan_vien = v.ma;

with ky as (
  insert into ky_luong (ten_ky, da_thanh_toan) values ('Tháng 09/2026', true)
  returning id
)
insert into bang_luong (ky_luong_id, nhan_vien_id, luong_co_ban, phu_cap)
select ky.id, nv.id, v.co_ban, v.phu_cap
from ky, (values
  ('NV003', 13500000, 1500000),
  ('NV004', 12000000, 1000000),
  ('NV005', 15000000, 2000000),
  ('NV006', 13500000, 1500000),
  ('NV007', 16500000, 1000000),
  ('NV008', 18000000, 1500000)
) as v(ma, co_ban, phu_cap)
join nhan_vien nv on nv.ma_nhan_vien = v.ma;

insert into tin_tuyen_dung (vi_tri, khoi_id, so_luong_can, trang_thai)
select v.vi_tri, k.id, v.so_luong, v.trang_thai
from (values
  ('Chuyên viên Content Social', 'Marketing', 1, 'Đang phỏng vấn'),
  ('Nhân viên Kinh doanh B2B', 'Kinh doanh', 2, 'Đang tuyển'),
  ('Thủ kho', 'Vận hành - Kho - Tài chính', 1, 'Đang tuyển')
) as v(vi_tri, khoi_ten, so_luong, trang_thai)
join khoi k on k.ten = v.khoi_ten;

insert into ung_vien (tin_tuyen_dung_id, ho_ten, trang_thai)
select t.id, 'Ứng viên ' || gs.n, 'Mới nộp'
from tin_tuyen_dung t, generate_series(1, 7) as gs(n)
where t.vi_tri = 'Chuyên viên Content Social';

insert into ung_vien (tin_tuyen_dung_id, ho_ten, trang_thai)
select t.id, 'Ứng viên ' || gs.n, 'Mới nộp'
from tin_tuyen_dung t, generate_series(1, 3) as gs(n)
where t.vi_tri = 'Nhân viên Kinh doanh B2B';

insert into danh_gia_hieu_suat (nhan_vien_id, ky, diem, xep_loai)
select nv.id, v.ky, v.diem, v.xep_loai
from (values
  ('NV003', 'Q3/2026', 92, 'Xuất sắc'),
  ('NV004', 'Q3/2026', 78, 'Tốt'),
  ('NV005', 'Q3/2026', 85, 'Tốt'),
  ('NV007', 'Q3/2026', 70, 'Đạt')
) as v(ma, ky, diem, xep_loai)
join nhan_vien nv on nv.ma_nhan_vien = v.ma;
