-- 0054: Đánh dấu đơn sỉ đã tạo phiếu xuất kho và ghi công nợ (chống tạo hai lần).
alter table public.kd_don_si add column if not exists da_xuat_kho_luc timestamptz;
