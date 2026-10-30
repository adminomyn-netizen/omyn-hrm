-- 0039: Mở quyền các màn nghiệp vụ (Marketing, Kinh doanh, Sản phẩm & Giá, Pháp lý, Tài chính & Kho, Chiến lược) cho từng khối.
-- Mỗi dòng: một mảng + một khối được 'xem' hoặc 'nhap'. Quản trị/Kỹ thuật luôn đủ quyền, không cần dòng nào. Ép row level security như 0017+.

create table public.quyen_man_nghiep_vu (
  id uuid primary key default gen_random_uuid(),
  mang text not null check (mang in ('marketing', 'kinh-doanh', 'san-pham', 'phap-ly', 'tai-chinh-kho', 'chien-luoc')),
  khoi_id uuid not null references public.khoi (id) on delete cascade,
  quyen text not null check (quyen in ('xem', 'nhap')),
  cap_nhat_luc timestamptz not null default now(),
  unique (mang, khoi_id)
);
alter table public.quyen_man_nghiep_vu enable row level security;
alter table public.quyen_man_nghiep_vu force row level security;
create policy quyen_man_nghiep_vu_khong_ai on public.quyen_man_nghiep_vu for select using (false);

-- Mở sẵn theo cách khối đang làm việc (người quản trị chỉnh lại ở màn "Phân quyền màn nghiệp vụ").
insert into public.quyen_man_nghiep_vu (mang, khoi_id, quyen)
select v.mang, k.id, v.quyen
from (values
  ('Marketing & Ecom', 'marketing', 'nhap'),
  ('Marketing & Ecom', 'kinh-doanh', 'nhap'),
  ('Marketing & Ecom', 'san-pham', 'xem'),
  ('Marketing & Ecom', 'phap-ly', 'xem'),
  ('Marketing & Ecom', 'chien-luoc', 'xem'),
  ('Kinh doanh', 'kinh-doanh', 'nhap'),
  ('Kinh doanh', 'marketing', 'xem'),
  ('Kinh doanh', 'san-pham', 'xem'),
  ('Tài chính - Kế toán', 'tai-chinh-kho', 'nhap'),
  ('Tài chính - Kế toán', 'kinh-doanh', 'xem'),
  ('Tài chính - Kế toán', 'san-pham', 'xem'),
  ('Tài chính - Kế toán', 'phap-ly', 'xem')
) as v(khoi, mang, quyen)
join public.khoi k on k.ten = v.khoi;
