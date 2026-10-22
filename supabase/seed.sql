-- Dữ liệu khung ban đầu: CHỈ các khối theo sơ đồ chức danh của OMYN (thư mục Drive 08/07.1).
-- KHÔNG có nhân viên, chấm công, đơn từ, lương, tuyển dụng, đánh giá mẫu: mọi dữ liệu đó do người dùng nhập qua chính app
-- (chủ dự án chốt 22/10/2026: "xoá hết dữ liệu mẫu, giờ chỉ có nhập vào").
-- Chạy bằng: supabase db query --linked -f supabase/seed.sql

insert into khoi (ten, mo_ta) values
  ('Ban điều hành', 'Tổng giám đốc, Phó Tổng giám đốc, Trợ lý vận hành'),
  ('Marketing & Ecom', 'Marketing, nội dung, video, KOL/KOC, vận hành sàn, livestream'),
  ('Kinh doanh', 'CSKH sỉ và đại lý, CSKH lẻ'),
  ('Tài chính - Kế toán', 'Kế toán tổng hợp, kho và đóng hàng'),
  ('Hành chính nhân sự', 'HCNS và tuyển dụng; có quyền Quản trị')
on conflict do nothing;
