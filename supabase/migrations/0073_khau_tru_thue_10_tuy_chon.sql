-- 0073 — Khấu trừ thuế 10% là TUỲ CHỌN từng người (chị Phượng 10/11/2026: "em để lại cho chị khấu trừ 10%, nhân sự điều chỉnh được").
-- Mặc định TẮT: người thử việc vẫn tính thuế lũy tiến như 05/11. Nhân sự bật ô trong Thỏa thuận lương cho người nào cần khấu trừ 10% (thử việc / chưa ký HĐ).
insert into public.tham_so_luong (khoa, nhan, gia_tri, don_vi, nguon, xac_nhan_boi, xac_nhan_luc) values
  ('khau_tru_vang_lai_ty_le', 'Khấu trừ thuế 10% (người được bật ở Thỏa thuận lương)', 10, 'phan_tram', 'Quy chế Điều 15.4', null, now()),
  ('khau_tru_vang_lai_nguong', 'Ngưỡng khấu trừ 10% mỗi kỳ lương', 2000000, 'dong', 'Quy chế Điều 15.4', null, now())
on conflict (khoa) do nothing;
alter table public.luong_thoa_thuan add column if not exists khau_tru_10 boolean not null default false;
alter table public.bang_luong add column if not exists khau_tru_10 boolean not null default false;
