-- 0010 — Bổ sung bảo mật cho bảng ngay_le (cổng cấu trúc: mọi bảng public phải FORCE RLS và có policy).
-- Ngày lễ không nhạy cảm: mọi người đã đăng nhập được ĐỌC; ghi qua máy chủ (khoá service) sau khi kiểm quyền Quản trị/Kỹ thuật.
alter table public.ngay_le force row level security;
grant select on public.ngay_le to authenticated;
create policy ngay_le_xem on public.ngay_le for select to authenticated using (true);
