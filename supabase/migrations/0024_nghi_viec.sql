-- 0024: Nhân sự nhóm 3 (nghỉ việc, bàn giao): hồ sơ nghỉ việc + checklist bàn giao/chốt công-lương-BHXH + phỏng vấn thôi việc.
-- Chưa chốt đủ thì không đóng hồ sơ (kiểm ở máy chủ). Ép row level security như 0017+.

create table public.nghi_viec (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  phieu_id uuid references public.pd_phieu (id) on delete set null,
  loai text not null default 'Đúng hạn' check (loai in ('Đúng hạn', 'Trước hạn')),
  ngay_nop date not null default current_date,
  ngay_lam_viec_cuoi date not null,
  ly_do text,
  trang_thai text not null default 'Đang bàn giao' check (trang_thai in ('Đang bàn giao', 'Đã đóng', 'Huỷ')),
  pv_trang_thai text not null default 'Chưa phỏng vấn' check (pv_trang_thai in ('Chưa phỏng vấn', 'Đã phỏng vấn', 'Từ chối phỏng vấn')),
  pv_ngay date,
  pv_nguoi_id uuid references public.nhan_vien (id) on delete set null,
  pv_ly_do_that text,
  pv_ghi_chu text,
  pv_co_the_quay_lai boolean,
  dong_luc timestamptz,
  dong_boi_ten text,
  tao_luc timestamptz not null default now(),
  check (ngay_lam_viec_cuoi >= ngay_nop - 365)
);
-- Mỗi người chỉ có một hồ sơ nghỉ việc đang mở.
create unique index nghi_viec_mot_ho_so_mo on public.nghi_viec (nhan_vien_id) where trang_thai = 'Đang bàn giao';
create unique index nghi_viec_phieu_uniq on public.nghi_viec (phieu_id) where phieu_id is not null;
create index nghi_viec_trang_thai_idx on public.nghi_viec (trang_thai, ngay_lam_viec_cuoi);

create table public.nghi_viec_muc (
  id uuid primary key default gen_random_uuid(),
  nghi_viec_id uuid not null references public.nghi_viec (id) on delete cascade,
  nhom text not null,
  ten text not null check (length(btrim(ten)) > 0),
  bat_buoc boolean not null default true,
  thu_tu int not null default 0,
  nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null,
  xong boolean not null default false,
  xong_luc timestamptz,
  xong_boi_ten text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index nghi_viec_muc_nv_idx on public.nghi_viec_muc (nghi_viec_id, thu_tu);

do $$
declare t text;
begin
  foreach t in array array['nghi_viec', 'nghi_viec_muc'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
