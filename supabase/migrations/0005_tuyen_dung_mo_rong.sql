-- 0005 — Tuyển dụng: thêm trường theo sheet "Team Tuyển Dụng 2026" (ngày nhận hồ sơ, năm sinh, nguồn,
-- link CV, ngày phỏng vấn, ghi chú; tin có mô tả + hạn nộp) và chốt các bước ứng viên.
-- Chỉ THÊM cột có thể trống + quyền cột tương ứng; không đổi/mất dữ liệu có sẵn (hai bảng đang rỗng).

alter table public.tin_tuyen_dung
  add column if not exists mo_ta text,
  add column if not exists han_nop date;

alter table public.ung_vien
  add column if not exists nam_sinh int check (nam_sinh between 1940 and 2020),
  add column if not exists nguon text,
  add column if not exists link_cv text,
  add column if not exists ghi_chu text,
  add column if not exists ngay_phong_van date,
  add column if not exists ngay_nhan_ho_so date not null default current_date;

alter table public.ung_vien
  add constraint ung_vien_trang_thai_hop_le
  check (trang_thai in ('Mới nộp', 'Hẹn phỏng vấn', 'Vòng 1', 'Vòng 2', 'Đề nghị', 'Nhận việc', 'Không đạt'));

grant insert (mo_ta, han_nop), update (mo_ta, han_nop) on public.tin_tuyen_dung to authenticated;
grant insert (nam_sinh, nguon, link_cv, ghi_chu, ngay_phong_van, ngay_nhan_ho_so),
      update (nam_sinh, nguon, link_cv, ghi_chu, ngay_phong_van)
  on public.ung_vien to authenticated;
