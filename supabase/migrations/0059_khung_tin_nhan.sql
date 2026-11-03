-- 0059: KHUNG tin nhắn SMS/Zalo cho khách lẻ: mẫu tin, kịch bản, hàng đợi gửi, cấu hình cổng.
-- CỔNG GỬI TẮT: chưa chọn nhà cung cấp, chưa có gì được gửi đi. Chỉ lập hàng đợi (Chờ gửi) cho khách đã đồng ý nhận tin.
-- Số ngày và nội dung mẫu bên dưới là TẠM, chờ chị Linh/chị Lâm duyệt.

create table public.tn_mau_tin (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique check (length(btrim(ten)) > 0),
  kenh text not null default 'Zalo' check (kenh in ('SMS', 'Zalo')),
  noi_dung text not null check (length(btrim(noi_dung)) > 0),
  dang_dung boolean not null default true,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.tn_kich_ban (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique check (length(btrim(ten)) > 0),
  su_kien text not null check (su_kien in ('Sinh nhật', 'Sau khi mua', 'Nhắc mua lại', 'Điểm sắp hết hạn')),
  so_ngay int not null default 0 check (so_ngay >= 0 and so_ngay <= 365),
  mau_tin_id uuid not null references public.tn_mau_tin (id) on delete restrict,
  bat boolean not null default false,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create table public.tn_hang_doi (
  id uuid primary key default gen_random_uuid(),
  khach_le_id uuid not null references public.kd_khach_le (id) on delete cascade,
  kich_ban_id uuid references public.tn_kich_ban (id) on delete set null,
  kenh text not null check (kenh in ('SMS', 'Zalo')),
  noi_dung text not null,
  ngay_du_kien date not null,
  trang_thai text not null default 'Chờ gửi' check (trang_thai in ('Chờ gửi', 'Đã gửi', 'Lỗi', 'Bỏ qua')),
  ly_do text,
  gui_luc timestamptz,
  tao_luc timestamptz not null default now()
);
create unique index tn_hang_doi_khong_trung on public.tn_hang_doi (khach_le_id, kich_ban_id, ngay_du_kien) where kich_ban_id is not null;
create index tn_hang_doi_trang_thai_idx on public.tn_hang_doi (trang_thai, ngay_du_kien);

-- Cấu hình cổng gửi (đúng 1 dòng). Không cho bật khi chưa chọn nhà cung cấp.
create table public.tn_cau_hinh (
  id uuid primary key default gen_random_uuid(),
  cong_gui text not null default 'Chưa chọn',
  bat_gui boolean not null default false,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  constraint tn_cau_hinh_chi_bat_khi_da_chon check (bat_gui = false or cong_gui <> 'Chưa chọn')
);
create unique index tn_cau_hinh_mot_dong on public.tn_cau_hinh ((true));

do $$
declare t text;
begin
  foreach t in array array['tn_mau_tin', 'tn_kich_ban', 'tn_hang_doi', 'tn_cau_hinh'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

insert into public.tn_cau_hinh (cong_gui, bat_gui, ghi_chu) values ('Chưa chọn', false, 'Cổng gửi TẮT. Chờ chị Lâm chọn nhà cung cấp và gói, rồi mới bật.');

insert into public.tn_mau_tin (ten, kenh, noi_dung, ghi_chu) values
  ('Chúc mừng sinh nhật', 'Zalo', 'Omyn chúc {ten} sinh nhật vui vẻ. Chị/anh đang là hạng {hang} với {diem} điểm.', 'MẪU NHÁP, chờ chị duyệt nội dung'),
  ('Cảm ơn sau khi mua', 'Zalo', 'Omyn cảm ơn {ten} đã mua hàng. Chị/anh đang có {diem} điểm, hạng {hang}.', 'MẪU NHÁP, chờ chị duyệt nội dung'),
  ('Nhắc mua lại', 'Zalo', 'Omyn nhớ {ten}. Lâu rồi chưa gặp, chị/anh còn {diem} điểm để đổi giảm giá.', 'MẪU NHÁP, chờ chị duyệt nội dung'),
  ('Điểm sắp hết hạn', 'Zalo', 'Chị/anh {ten} còn {diem} điểm sắp hết hạn trong 30 ngày tới, nhớ dùng nhé.', 'MẪU NHÁP, chờ chị duyệt nội dung');

insert into public.tn_kich_ban (ten, su_kien, so_ngay, mau_tin_id, bat, ghi_chu)
select k.ten, k.su_kien, k.so_ngay, m.id, false, 'TẠM, chờ chị Linh/chị Lâm duyệt. Đang TẮT.'
from (values
  ('Sinh nhật', 'Sinh nhật', 0, 'Chúc mừng sinh nhật'),
  ('Cảm ơn sau mua', 'Sau khi mua', 1, 'Cảm ơn sau khi mua'),
  ('Nhắc mua lại', 'Nhắc mua lại', 60, 'Nhắc mua lại'),
  ('Điểm sắp hết hạn', 'Điểm sắp hết hạn', 0, 'Điểm sắp hết hạn')
) as k(ten, su_kien, so_ngay, mau) join public.tn_mau_tin m on m.ten = k.mau;
