-- 0082: ĐƠN SÀN HAI LỚP TRẠNG THÁI. Giữ trạng thái GỐC của sàn (mã Shopee/TikTok) trên đơn lẻ, và bảng GHÉP mã sàn -> trạng thái nội bộ (4 trạng thái cũ, không đổi).
-- Chỉ thêm: cột mới (cho phép trống) + bảng mới. Không đổi dữ liệu cũ. Ghép ban đầu là GỢI Ý theo mã trạng thái công khai của sàn, sửa được trên màn hình.

alter table public.kd_don_le add column trang_thai_san text;

create table public.kd_trang_thai_san_map (
  id uuid primary key default gen_random_uuid(),
  nen_tang text not null check (nen_tang in ('Shopee', 'TikTok Shop', 'Facebook', 'Zalo', 'Điện thoại', 'Khác')),
  ma_san text not null check (length(btrim(ma_san)) > 0),
  trang_thai_noi_bo text not null check (trang_thai_noi_bo in ('Đang xử lý', 'Đã giao', 'Hoàn trả', 'Huỷ')),
  ghi_chu text,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);
create unique index kd_trang_thai_san_map_uq on public.kd_trang_thai_san_map (nen_tang, lower(btrim(ma_san)));

insert into public.kd_trang_thai_san_map (nen_tang, ma_san, trang_thai_noi_bo, ghi_chu) values
  ('Shopee', 'UNPAID', 'Đang xử lý', 'Chưa thanh toán'),
  ('Shopee', 'READY_TO_SHIP', 'Đang xử lý', 'Chờ lấy hàng'),
  ('Shopee', 'PROCESSED', 'Đang xử lý', 'Đã chuẩn bị hàng'),
  ('Shopee', 'RETRY_SHIP', 'Đang xử lý', 'Giao lại'),
  ('Shopee', 'SHIPPED', 'Đang xử lý', 'Đang giao'),
  ('Shopee', 'TO_CONFIRM_RECEIVE', 'Đang xử lý', 'Chờ người mua xác nhận đã nhận'),
  ('Shopee', 'IN_CANCEL', 'Đang xử lý', 'Đang yêu cầu huỷ, chưa chốt'),
  ('Shopee', 'CANCELLED', 'Huỷ', 'Đã huỷ'),
  ('Shopee', 'TO_RETURN', 'Hoàn trả', 'Đang trả hàng/hoàn tiền'),
  ('Shopee', 'COMPLETED', 'Đã giao', 'Hoàn thành'),
  ('TikTok Shop', 'UNPAID', 'Đang xử lý', 'Chưa thanh toán'),
  ('TikTok Shop', 'ON_HOLD', 'Đang xử lý', 'Tạm giữ'),
  ('TikTok Shop', 'AWAITING_SHIPMENT', 'Đang xử lý', 'Chờ giao cho vận chuyển'),
  ('TikTok Shop', 'PARTIALLY_SHIPPING', 'Đang xử lý', 'Giao một phần'),
  ('TikTok Shop', 'AWAITING_COLLECTION', 'Đang xử lý', 'Chờ lấy hàng'),
  ('TikTok Shop', 'IN_TRANSIT', 'Đang xử lý', 'Đang vận chuyển'),
  ('TikTok Shop', 'DELIVERED', 'Đã giao', 'Đã giao tới người mua'),
  ('TikTok Shop', 'COMPLETED', 'Đã giao', 'Hoàn thành'),
  ('TikTok Shop', 'CANCELLED', 'Huỷ', 'Đã huỷ');

alter table public.kd_trang_thai_san_map enable row level security;
alter table public.kd_trang_thai_san_map force row level security;
create policy kd_trang_thai_san_map_chi_may_chu on public.kd_trang_thai_san_map for select to authenticated using (false);

create trigger nk_kd_trang_thai_san_map after insert or update or delete on public.kd_trang_thai_san_map
  for each row execute function private.ghi_nhat_ky();
