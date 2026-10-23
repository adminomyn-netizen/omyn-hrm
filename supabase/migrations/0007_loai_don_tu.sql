-- 0007 — MỞ RỘNG LOẠI ĐƠN TỪ (chủ app chốt 23/10/2026): đi trễ, về sớm, nghỉ phép năm (12 ngày/năm), nghỉ không lương,
-- giải trình công, làm remote, công tác, nghỉ chế độ (thai sản…), chấm công ngoài công ty. Chỉ nới ràng buộc, không đổi dữ liệu.
alter table public.don_tu drop constraint if exists don_tu_loai_check;
alter table public.don_tu add constraint don_tu_loai_check check (loai in (
  'Đi trễ', 'Về sớm', 'Nghỉ phép năm', 'Nghỉ không lương', 'Nghỉ ốm', 'Nghỉ chế độ',
  'Giải trình công', 'Làm remote', 'Công tác', 'Chấm công ngoài công ty', 'Tạm ứng lương'
));
