-- 0081: Cơ chế KPI có thể áp RIÊNG cho từng nhân sự (chị Phượng 25/11): mỗi người một bộ nhóm công việc và tỷ trọng, rõ là của ai.
-- Cột nhan_vien_id để trống = áp cho mọi người cùng chức danh (như 0080). Có nhan_vien_id = chỉ áp cho người đó và được ưu tiên hơn cơ chế chung.
-- Chỉ thêm cột và đổi chỉ mục duy nhất; dữ liệu cũ giữ nguyên.

alter table public.kpi_co_che_vi_tri
  add column nhan_vien_id uuid references public.nhan_vien (id) on delete cascade;

drop index if exists public.kpi_co_che_vi_tri_ten_uq;
create unique index kpi_co_che_vi_tri_ten_uq on public.kpi_co_che_vi_tri (lower(btrim(ten))) where hoat_dong and nhan_vien_id is null;
create unique index kpi_co_che_vi_tri_nv_uq on public.kpi_co_che_vi_tri (nhan_vien_id) where hoat_dong and nhan_vien_id is not null;
