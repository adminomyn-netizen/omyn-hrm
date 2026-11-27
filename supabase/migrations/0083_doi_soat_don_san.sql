-- 0083: ĐỐI SOÁT TIỀN SÀN THEO TỪNG ĐƠN. Mỗi lần nhập file quyết toán của sàn là một PHIÊN; mỗi đơn trong file là một DÒNG: tiền khách trả, phí sàn tách loại, thực nhận,
-- so với đơn trong Sổ đơn lẻ (khớp / lệch giá trị / lệch trạng thái / thiếu trong Omyn). Bảng đối soát THÁNG cũ (kd_doi_soat_san) giữ nguyên.
-- Chỉ thêm bảng mới. Ép row level security như 0017+. Mỗi gian hàng mỗi mã đơn chỉ đối soát một lần (nhập lại cùng file không trùng).

create table public.kd_doi_soat_phien (
  id uuid primary key default gen_random_uuid(),
  gian_hang_id uuid not null references public.kd_gian_hang (id) on delete cascade,
  tu_ngay date not null,
  den_ngay date not null,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (den_ngay >= tu_ngay)
);
create index kd_doi_soat_phien_gh_idx on public.kd_doi_soat_phien (gian_hang_id, tu_ngay desc);

create table public.kd_doi_soat_dong (
  id uuid primary key default gen_random_uuid(),
  phien_id uuid not null references public.kd_doi_soat_phien (id) on delete cascade,
  gian_hang_id uuid not null references public.kd_gian_hang (id) on delete cascade,
  ma_don text not null check (length(btrim(ma_don)) > 0),
  ngay_nhan_tien date,
  khach_tra bigint,
  phi_hoa_hong bigint not null default 0,
  phi_giao_dich bigint not null default 0,
  phi_van_chuyen bigint not null default 0,
  phi_dich_vu bigint not null default 0,
  phi_affiliate bigint not null default 0,
  thue bigint not null default 0,
  phi_khac bigint not null default 0,
  hoan_tien bigint not null default 0,
  thuc_nhan bigint not null,
  don_le_id uuid references public.kd_don_le (id) on delete set null,
  gia_tri_don bigint,
  ket_qua text not null check (ket_qua in ('Khớp', 'Lệch giá trị', 'Lệch trạng thái', 'Thiếu trong Omyn')),
  nguyen_nhan text,
  da_xu_ly boolean not null default false,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create unique index kd_doi_soat_dong_uq on public.kd_doi_soat_dong (gian_hang_id, ma_don);
create index kd_doi_soat_dong_phien_idx on public.kd_doi_soat_dong (phien_id, ket_qua);

do $$
declare t text;
begin
  foreach t in array array['kd_doi_soat_phien', 'kd_doi_soat_dong'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

create trigger nk_kd_doi_soat_phien after insert or update or delete on public.kd_doi_soat_phien
  for each row execute function private.ghi_nhat_ky();
create trigger nk_kd_doi_soat_dong after insert or update or delete on public.kd_doi_soat_dong
  for each row execute function private.ghi_nhat_ky();
