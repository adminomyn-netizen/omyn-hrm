-- 0046: Cơ hội khách sỉ thêm cột ngày chốt (anh Nam chốt). Doanh số theo người tính cơ hội đã chốt theo ngày này; thiếu thì lấy ngày tạo cơ hội.
alter table public.kd_co_hoi add column ngay_chot date;
