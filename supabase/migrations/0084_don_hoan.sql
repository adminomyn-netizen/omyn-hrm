-- 0084: ĐƠN HOÀN. Mỗi dòng ghi một lần hoàn của một đơn trong Sổ đơn lẻ: loại hoàn, lý do, mã vận đơn hoàn, tiền hoàn, TÌNH TRẠNG HÀNG HOÀN (chờ về / nhận đủ / nhận thiếu / hỏng).
-- Chỉ thêm bảng mới; không đổi đơn lẻ hay kho. Ép row level security như 0017+. Một đơn có thể hoàn nhiều lần (hoàn từng phần).

create table public.kd_don_hoan (
  id uuid primary key default gen_random_uuid(),
  don_le_id uuid not null references public.kd_don_le (id) on delete cascade,
  ngay_hoan date not null,
  loai text not null default 'Trả hàng và hoàn tiền' check (loai in ('Trả hàng và hoàn tiền', 'Chỉ hoàn tiền', 'Giao không thành công')),
  ly_do text,
  ma_van_don_hoan text,
  so_tien_hoan bigint check (so_tien_hoan is null or so_tien_hoan >= 0),
  tinh_trang_hang text not null default 'Chờ hàng về' check (tinh_trang_hang in ('Chờ hàng về', 'Đã nhận đủ', 'Nhận thiếu', 'Hỏng, không bán lại', 'Không cần trả hàng')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index kd_don_hoan_don_idx on public.kd_don_hoan (don_le_id);
create index kd_don_hoan_tt_idx on public.kd_don_hoan (tinh_trang_hang, ngay_hoan desc);

alter table public.kd_don_hoan enable row level security;
alter table public.kd_don_hoan force row level security;
create policy kd_don_hoan_chi_may_chu on public.kd_don_hoan for select to authenticated using (false);

create trigger nk_kd_don_hoan after insert or update or delete on public.kd_don_hoan
  for each row execute function private.ghi_nhat_ky();
