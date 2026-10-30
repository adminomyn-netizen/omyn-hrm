-- 0030 — Quảng cáo Facebook (Meta) + TikTok: khung lưu số liệu kéo về mỗi ngày (tham khảo e-global-ops, dựng lại theo Omyn).
-- Khoá API KHÔNG nằm trong DB (biến môi trường Vercel). Mã đối tượng của sàn là khoá chính (text) để kéo lại bao nhiêu lần cũng không trùng.
-- Chỉ máy chủ đọc/ghi (FORCE RLS như 0016-0019). Số phiên Ops dùng 0030+, phiên HR dùng 0020-0029.

create table public.qc_meta_tai_khoan (
  id text primary key,                      -- mã tài khoản quảng cáo Meta
  ten text not null,
  tien_te text not null default 'VND',
  dang_dong_bo boolean not null default false,
  dong_bo_luc timestamptz,
  tao_luc timestamptz not null default now()
);
create table public.qc_meta_chien_dich (
  id text primary key,
  tai_khoan_id text not null references public.qc_meta_tai_khoan (id) on delete cascade,
  ten text not null,
  muc_tieu text,
  trang_thai text,
  trang_thai_hieu_luc text,
  ngan_sach_ngay numeric(15, 2),
  ngan_sach_tron_doi numeric(15, 2),
  bat_dau timestamptz,
  ket_thuc timestamptz,
  du_lieu_goc jsonb,
  tao_luc timestamptz not null default now()
);
create index qc_meta_chien_dich_tk_idx on public.qc_meta_chien_dich (tai_khoan_id);
create table public.qc_meta_nhom (
  id text primary key,
  chien_dich_id text not null references public.qc_meta_chien_dich (id) on delete cascade,
  ten text not null,
  trang_thai text,
  trang_thai_hieu_luc text,
  ngan_sach_ngay numeric(15, 2),
  du_lieu_goc jsonb,
  tao_luc timestamptz not null default now()
);
create index qc_meta_nhom_cd_idx on public.qc_meta_nhom (chien_dich_id);
create table public.qc_meta_quang_cao (
  id text primary key,
  nhom_id text not null references public.qc_meta_nhom (id) on delete cascade,
  chien_dich_id text not null references public.qc_meta_chien_dich (id) on delete cascade,
  ten text not null,
  trang_thai text,
  trang_thai_hieu_luc text,
  ma_noi_dung text,
  du_lieu_goc jsonb,
  tao_luc timestamptz not null default now()
);
create index qc_meta_quang_cao_nhom_idx on public.qc_meta_quang_cao (nhom_id);
create table public.qc_meta_so_lieu (
  quang_cao_id text not null references public.qc_meta_quang_cao (id) on delete cascade,
  ngay date not null,
  chi_tieu numeric(15, 2) not null default 0,       -- tiền đã chi
  hien_thi bigint not null default 0,
  nhap bigint not null default 0,
  tiep_can bigint not null default 0,
  hanh_dong jsonb,                                   -- {"purchase": 3, "link_click": 120, ...} theo từng loại hành động
  primary key (quang_cao_id, ngay)
);
create index qc_meta_so_lieu_ngay_idx on public.qc_meta_so_lieu (ngay);

create table public.qc_tiktok_tai_khoan (
  id text primary key,                      -- advertiser_id
  ten text not null,
  tien_te text,
  mui_gio text,
  dang_dong_bo boolean not null default false,
  dong_bo_luc timestamptz,
  tao_luc timestamptz not null default now()
);
create table public.qc_tiktok_chien_dich (
  id text primary key,
  tai_khoan_id text not null references public.qc_tiktok_tai_khoan (id) on delete cascade,
  ten text not null,
  muc_tieu text,
  trang_thai text,
  ngan_sach numeric(15, 2),
  du_lieu_goc jsonb,
  tao_luc timestamptz not null default now()
);
create index qc_tiktok_chien_dich_tk_idx on public.qc_tiktok_chien_dich (tai_khoan_id);
create table public.qc_tiktok_nhom (
  id text primary key,
  chien_dich_id text not null references public.qc_tiktok_chien_dich (id) on delete cascade,
  ten text not null,
  trang_thai text,
  ngan_sach numeric(15, 2),
  du_lieu_goc jsonb,
  tao_luc timestamptz not null default now()
);
create index qc_tiktok_nhom_cd_idx on public.qc_tiktok_nhom (chien_dich_id);
create table public.qc_tiktok_quang_cao (
  id text primary key,
  nhom_id text not null references public.qc_tiktok_nhom (id) on delete cascade,
  chien_dich_id text not null references public.qc_tiktok_chien_dich (id) on delete cascade,
  ten text not null,
  trang_thai text,
  du_lieu_goc jsonb,
  tao_luc timestamptz not null default now()
);
create index qc_tiktok_quang_cao_nhom_idx on public.qc_tiktok_quang_cao (nhom_id);
create table public.qc_tiktok_so_lieu (
  quang_cao_id text not null references public.qc_tiktok_quang_cao (id) on delete cascade,
  ngay date not null,
  chi_tieu numeric(15, 2) not null default 0,
  hien_thi bigint not null default 0,
  nhap bigint not null default 0,
  tiep_can bigint not null default 0,
  chuyen_doi numeric(15, 2) not null default 0,
  ket_qua numeric(15, 2) not null default 0,
  primary key (quang_cao_id, ngay)
);
create index qc_tiktok_so_lieu_ngay_idx on public.qc_tiktok_so_lieu (ngay);

create table public.qc_nhat_ky_dong_bo (                -- mỗi lần kéo số: để biết lần cuối thành công khi nào và vì sao lỗi
  id uuid primary key default gen_random_uuid(),
  nen_tang text not null check (nen_tang in ('Facebook', 'TikTok')),
  bat_dau timestamptz not null default now(),
  ket_thuc timestamptz,
  trang_thai text not null default 'Đang chạy' check (trang_thai in ('Đang chạy', 'Thành công', 'Lỗi', 'Bỏ qua')),
  so_dong int not null default 0,
  ghi_chu text
);
create index qc_nhat_ky_dong_bo_idx on public.qc_nhat_ky_dong_bo (nen_tang, bat_dau desc);

do $$
declare t text;
begin
  foreach t in array array['qc_meta_tai_khoan','qc_meta_chien_dich','qc_meta_nhom','qc_meta_quang_cao','qc_meta_so_lieu','qc_tiktok_tai_khoan','qc_tiktok_chien_dich','qc_tiktok_nhom','qc_tiktok_quang_cao','qc_tiktok_so_lieu','qc_nhat_ky_dong_bo'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

-- Lịch kéo số mỗi đêm (19:40 UTC = 02:40 giờ Việt Nam) dùng chung mã bí mật cron_nhac_token với lịch nhắc việc (0014). Chỉ chạy trên Supabase thật.
do $mig$
begin
  if not exists (select 1 from pg_available_extensions where name in ('supabase_vault', 'pg_cron', 'pg_net') having count(*) = 3) then
    raise notice 'Bỏ qua lịch kéo số quảng cáo: máy này không có supabase_vault, pg_cron, pg_net.';
    return;
  end if;
  perform cron.schedule('keo-so-quang-cao', '40 19 * * *', $cron$
    select net.http_get(
      url := 'https://omyn-hrm.vercel.app/api/cron/quang-cao',
      headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_nhac_token')),
      timeout_milliseconds := 55000
    )
  $cron$);
end
$mig$;
