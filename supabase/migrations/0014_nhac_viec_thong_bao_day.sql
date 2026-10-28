-- 0014 — THÔNG BÁO ĐẨY, NHẮC CHẤM CÔNG, TỔNG HỢP HIỆU SUẤT
--  · dang_ky_thong_bao: thiết bị đã bật thông báo (Web Push) của từng tài khoản.
--  · cau_hinh_bi_mat: khoá VAPID để gửi thông báo đẩy (chỉ ứng dụng đọc, bằng khoá service). Khoá được tạo bằng tập lệnh riêng, KHÔNG nằm trong migration.
--  · nhac_da_gui: mỗi người, mỗi ngày, mỗi "khung nhắc" chỉ gửi một lần (cron lặp 5 phút/lần không gửi trùng).
--  · tong_hop_hieu_suat: bản tổng hợp tuần / tháng / năm đã tính, mỗi kỳ một dòng (chuông và thông báo đẩy dùng lại).
--  · pg_cron + pg_net gọi /api/cron/nhac mỗi 5 phút từ 07:00 đến 23:00 giờ Việt Nam. Vercel gói thường không chạy cron theo phút nên lịch đặt ở Supabase;
--    mã bí mật của lịch nằm trong Vault (cron_nhac_token), trang chỉ nhận khi mã khớp (hàm kiem_token_cron).

create table if not exists public.dang_ky_thong_bao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  thiet_bi text,
  tao_luc timestamptz not null default now(),
  gui_cuoi_luc timestamptz
);
create index if not exists dang_ky_thong_bao_user_idx on public.dang_ky_thong_bao (user_id);

create table if not exists public.cau_hinh_bi_mat (
  khoa text primary key,
  gia_tri text not null
);

create table if not exists public.nhac_da_gui (
  user_id uuid not null references auth.users (id) on delete cascade,
  ngay date not null,
  khung text not null,
  gui_luc timestamptz not null default now(),
  primary key (user_id, ngay, khung)
);

create table if not exists public.tong_hop_hieu_suat (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (loai in ('tuan', 'thang', 'nam')),
  ky text not null,
  tieu_de text not null,
  noi_dung text not null,
  chi_tiet jsonb not null default '{}'::jsonb,
  tao_luc timestamptz not null default now(),
  unique (loai, ky)
);

do $$
declare t text;
begin
  foreach t in array array['dang_ky_thong_bao', 'cau_hinh_bi_mat', 'nhac_da_gui', 'tong_hop_hieu_suat'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- Phần lịch và mã bí mật chỉ chạy trên Supabase thật (có Vault, pg_cron, pg_net); cơ sở dữ liệu thử cục bộ không có thì bỏ qua.
do $mig$
begin
  if not exists (select 1 from pg_available_extensions where name in ('supabase_vault', 'pg_cron', 'pg_net') having count(*) = 3) then
    raise notice 'Bỏ qua lịch nhắc: máy này không có supabase_vault, pg_cron, pg_net.';
    return;
  end if;
  create extension if not exists supabase_vault;
  create extension if not exists pg_net;
  create extension if not exists pg_cron;

  if not exists (select 1 from vault.secrets where name = 'cron_nhac_token') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'cron_nhac_token', 'Mã bí mật để lịch Supabase gọi /api/cron/nhac');
  end if;

  execute $f$
    create or replace function public.kiem_token_cron(p text) returns boolean language sql security definer set search_path = '' as $b$
      select exists (select 1 from vault.decrypted_secrets where name = 'cron_nhac_token' and decrypted_secret = p)
    $b$ $f$;
  revoke all on function public.kiem_token_cron(text) from public, anon, authenticated;
  grant execute on function public.kiem_token_cron(text) to service_role;

  -- 00:00–16:55 UTC = 07:00–23:55 giờ Việt Nam, mỗi 5 phút.
  perform cron.schedule('nhac-viec', '*/5 0-16 * * *', $cron$
    select net.http_get(
      url := 'https://omyn-hrm.vercel.app/api/cron/nhac',
      headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_nhac_token')),
      timeout_milliseconds := 25000
    )
  $cron$);
end
$mig$;
