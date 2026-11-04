-- 0068 — % KPI nền trong thỏa thuận lương không còn mặc định 10 (chị Phượng/chị Lâm 4/11: để trống, xem bảng lương rồi điều chỉnh).
-- Chỉ đổi giá trị mặc định cho dòng mới; không sửa dữ liệu đã có (bảng đang rỗng).
alter table public.luong_thoa_thuan alter column ty_le_kpi set default 0;
