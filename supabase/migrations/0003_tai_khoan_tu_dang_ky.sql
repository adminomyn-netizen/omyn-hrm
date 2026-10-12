-- Gắn tài khoản đăng nhập (Supabase Auth) với hồ sơ nhân sự, để mỗi nhân
-- viên tự đăng ký chỉ thấy chấm công/lịch của chính mình, không thấy của
-- người khác (chị Lâm chốt 12/10/2026).
alter table nhan_vien
  add column user_id uuid unique references auth.users(id) on delete set null;
