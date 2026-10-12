-- Dữ liệu khung ban đầu: chỉ khối + nhân sự thật đã nhập tay (6 người, tạm,
-- trước khi có danh sách nhân sự đầy đủ của Omyn). KHÔNG seed chấm công/đơn
-- từ/lương/tuyển dụng/đánh giá — những bảng này để trống, chờ dữ liệu thật,
-- người dùng nhập qua chính app (chị Lâm chốt 12/10/2026: "không import ở
-- đâu hết, dữ liệu mẫu về chấm công/đang duyệt thì xóa hết, chỉ giữ danh
-- sách nhân sự thôi, mấy cái đấy bổ sung thực sau").
-- Chạy bằng: supabase db query --linked -f supabase/seed.sql

insert into khoi (ten, mo_ta) values
  ('Ban điều hành', 'Hội đồng quản trị & Tổng giám đốc'),
  ('Marketing', 'Thương hiệu, nội dung, truyền thông Huskin'),
  ('Kinh doanh', 'Bán hàng, kênh phân phối, đối tác'),
  ('Vận hành - Kho - Tài chính', 'Vận hành, kho vận, kế toán - tài chính')
on conflict do nothing;

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
from khoi where ten = 'Vận hành - Kho - Tài chính'
on conflict do nothing;
