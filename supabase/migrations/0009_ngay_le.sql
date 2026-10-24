-- 0009 — NGÀY LỄ (chủ app chốt 24/10/2026): bảng chấm công tháng cần biết ngày nghỉ lễ để ghi mã L và tính công.
-- Chỉ THÊM bảng mới, không đụng dữ liệu cũ. Chỉ gieo các ngày lễ DƯƠNG LỊCH cố định; Tết Nguyên đán, Giỗ Tổ và ngày nghỉ bù do Hành chính nhân sự tự nhập theo thông báo của Nhà nước.
create table if not exists public.ngay_le (
  ngay date primary key,
  ten text not null check (length(btrim(ten)) between 1 and 80),
  tao_luc timestamptz not null default now()
);
alter table public.ngay_le enable row level security; -- chỉ ứng dụng (khoá service) đọc/ghi, có kiểm quyền ở máy chủ

insert into public.ngay_le (ngay, ten) values
  ('2026-01-01', 'Tết Dương lịch'),
  ('2026-04-30', 'Ngày Giải phóng miền Nam'),
  ('2026-05-01', 'Ngày Quốc tế Lao động'),
  ('2026-09-02', 'Quốc khánh'),
  ('2027-01-01', 'Tết Dương lịch'),
  ('2027-04-30', 'Ngày Giải phóng miền Nam'),
  ('2027-05-01', 'Ngày Quốc tế Lao động'),
  ('2027-09-02', 'Quốc khánh')
on conflict (ngay) do nothing;
