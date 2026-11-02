-- 0058: điểm và hạng khách lẻ theo THAM SỐ TẠM (anh Nam chốt 02/11, chờ chị Linh/chị Lâm duyệt). Mọi số nằm trong bảng, sửa ở màn quản trị, không cứng trong mã.
-- Bảng khách/điểm/hạng đang trống khi đổi cấu trúc.

-- Hạng: theo tổng mua tích luỹ trong cửa sổ (mặc định 12 tháng), có hệ số nhân điểm tính theo % (100 = giữ nguyên, 120 = nhân 1,2).
alter table public.kd_hang_khach drop column diem_toi_thieu;
alter table public.kd_hang_khach
  add column mua_toi_thieu bigint not null default 0 check (mua_toi_thieu >= 0),
  add column he_so_tich_pt int not null default 100 check (he_so_tich_pt > 0),
  add constraint kd_hang_khach_mua_toi_thieu_key unique (mua_toi_thieu);

-- Sổ điểm: Mua (ghi số tiền, điểm tự tính theo hạng lúc mua), Tặng (cộng tay), Dùng (trừ điểm, ưu tiên lô điểm cũ nhất còn hạn).
alter table public.kd_diem_khach drop constraint kd_diem_khach_loai_check;
alter table public.kd_diem_khach drop constraint kd_diem_khach_so_diem_check;
alter table public.kd_diem_khach alter column so_diem set default 0;
alter table public.kd_diem_khach
  add column so_tien bigint check (so_tien is null or so_tien > 0),
  add constraint kd_diem_khach_loai_check check (loai in ('Mua', 'Tặng', 'Dùng')),
  add constraint kd_diem_khach_so_diem_check check (so_diem >= 0),
  add constraint kd_diem_khach_hop_le check (
    (loai = 'Mua' and so_tien is not null) or (loai in ('Tặng', 'Dùng') and so_diem > 0)
  );

-- Tham số chung (đúng 1 dòng).
create table public.kd_diem_cau_hinh (
  id uuid primary key default gen_random_uuid(),
  dong_moi_diem int not null default 10000 check (dong_moi_diem > 0),
  dong_giam_moi_diem int not null default 100 check (dong_giam_moi_diem >= 0),
  het_han_thang int not null default 12 check (het_han_thang > 0),
  cua_so_hang_thang int not null default 12 check (cua_so_hang_thang > 0),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create unique index kd_diem_cau_hinh_mot_dong on public.kd_diem_cau_hinh ((true));
alter table public.kd_diem_cau_hinh enable row level security;
alter table public.kd_diem_cau_hinh force row level security;
create policy kd_diem_cau_hinh_chi_may_chu on public.kd_diem_cau_hinh for select to authenticated using (false);

insert into public.kd_diem_cau_hinh (dong_moi_diem, dong_giam_moi_diem, het_han_thang, cua_so_hang_thang, ghi_chu)
values (10000, 100, 12, 12, 'TẠM, chờ chị Linh/chị Lâm duyệt (anh Nam chốt 02/11): 10.000đ = 1 điểm; 1 điểm đổi 100đ giảm giá; điểm hết hạn sau 12 tháng; hạng tính theo tổng mua 12 tháng.');
insert into public.kd_hang_khach (ten, mua_toi_thieu, he_so_tich_pt, ghi_chu) values
  ('Thành viên', 0, 100, 'TẠM, chờ chị Linh/chị Lâm duyệt'),
  ('Bạc', 3000000, 120, 'TẠM, chờ chị Linh/chị Lâm duyệt'),
  ('Vàng', 10000000, 150, 'TẠM, chờ chị Linh/chị Lâm duyệt'),
  ('Kim cương', 30000000, 200, 'TẠM, chờ chị Linh/chị Lâm duyệt');
