-- 0078: Nội quy & chính sách: nội quy lao động, quy chế thưởng phạt, mẫu hợp đồng. Mọi người đã duyệt xem và tải;
-- chỉ Quản trị và Kỹ thuật tải lên, xoá. File nằm trong kho riêng 'tai-lieu-omyn' (bucket private), tải bằng link ký hết hạn.

create table public.noi_quy_tai_lieu (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (loai in ('noi_quy', 'thuong_phat', 'hop_dong_mau', 'khac')),
  ten text not null check (length(btrim(ten)) between 1 and 200),
  ghi_chu text check (ghi_chu is null or length(ghi_chu) <= 500),
  duong_dan text not null unique check (duong_dan ~ '^noi-quy/[0-9a-f-]{36}\.[a-z0-9]{2,5}$'),
  ten_tep text not null check (length(btrim(ten_tep)) > 0 and length(ten_tep) <= 200),
  kich_thuoc bigint not null check (kich_thuoc > 0 and kich_thuoc <= 26214400),
  nguoi_tai uuid,
  ten_nguoi_tai text not null default '',
  tao_luc timestamptz not null default now()
);
create index noi_quy_tai_lieu_loai_idx on public.noi_quy_tai_lieu (loai, tao_luc desc);

alter table public.noi_quy_tai_lieu enable row level security;
alter table public.noi_quy_tai_lieu force row level security;

-- Không mở cho trình duyệt: chỉ máy chủ (vai trò dịch vụ) đọc ghi, như các bảng HR khác.
drop policy if exists noi_quy_tai_lieu_chi_may_chu on public.noi_quy_tai_lieu;
create policy noi_quy_tai_lieu_chi_may_chu on public.noi_quy_tai_lieu for select to authenticated using (false);
