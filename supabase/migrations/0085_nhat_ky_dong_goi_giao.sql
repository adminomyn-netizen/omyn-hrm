-- 0085: ghi nhật ký thay đổi cho sổ Đóng gói và giao hàng (trước đây chưa có), vì nhập đối soát vận chuyển sẽ cập nhật hàng loạt tiền COD đã nhận và phí vận chuyển.
create trigger nk_kho_dong_goi_giao after insert or update or delete on public.kho_dong_goi_giao
  for each row execute function private.ghi_nhat_ky();
