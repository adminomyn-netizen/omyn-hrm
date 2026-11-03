-- 0060: phiếu kho có LÝ DO; điều chỉnh tăng/giảm (kể cả xuất huỷ) bắt buộc ghi lý do.
alter table public.kho_nhap_xuat
  add column ly_do text check (ly_do is null or ly_do in ('Hết hạn, huỷ', 'Hư hỏng, vỡ', 'Hao hụt', 'Mất', 'Kiểm kê lệch', 'Mẫu dùng thử, quà tặng', 'Nhập nhầm, sửa lại', 'Khác')),
  add constraint kho_nhap_xuat_dieu_chinh_co_ly_do check (loai not in ('Điều chỉnh tăng', 'Điều chỉnh giảm') or ly_do is not null);
