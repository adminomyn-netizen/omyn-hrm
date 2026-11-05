-- 0069 — Công chuẩn không đặt cứng 24 (chị Phượng + anh Nam 05/11): tự tính theo tháng = số ngày − Chủ nhật, khối văn phòng trừ thêm số thứ Bảy nghỉ mỗi tháng (hiện 2).
-- Thêm tham số, đã được chị Phượng chốt bằng lời nên ghi sẵn thời điểm xác nhận (không chặn duyệt kỳ lương).
insert into public.tham_so_luong (khoa, nhan, gia_tri, don_vi, nguon, xac_nhan_luc)
values ('t7_nghi_moi_thang', 'Số thứ Bảy nghỉ mỗi tháng (khối văn phòng)', 2, 'ngay', 'Chị Phượng 05/11/2026: nghỉ Chủ nhật và 2 thứ Bảy', now())
on conflict (khoa) do nothing;
update public.tham_so_luong set nhan = 'Công chuẩn khối văn phòng (không còn dùng, tự tính theo tháng)' where khoa = 'cong_chuan_van_phong';
