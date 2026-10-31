-- 0048: Duyệt bao bì và nhãn thêm kết quả "Đã chốt thiết kế": thiết kế đã chốt nhưng CHƯA qua kiểm pháp lý (khác với "Đạt" là đã duyệt đủ).
alter table public.sp_duyet_bao_bi drop constraint sp_duyet_bao_bi_trang_thai_check;
alter table public.sp_duyet_bao_bi add constraint sp_duyet_bao_bi_trang_thai_check check (trang_thai in ('Chờ duyệt', 'Đã chốt thiết kế', 'Đạt', 'Cần sửa'));
