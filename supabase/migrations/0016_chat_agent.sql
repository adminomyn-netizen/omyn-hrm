-- 0016 — Chat nổi với Tula (trợ lý AI) ở góc dưới mọi trang. Cùng mô hình với AMIA OS.
--  · Người dùng gõ → một dòng chat_tin trạng thái 'cho'; máy chạy Tula nhận, trả lời, ghi dòng của agent.
--  · Quyền kiểm trong ứng dụng cho TỪNG lời gọi công cụ qua mã thông hành sinh lúc gửi tin (mô hình không tự khai người hỏi là ai).
--  · Chỉ vai trò Kỹ thuật được gửi loại 'sua' (nhờ sửa ứng dụng) và 'duyet' (đưa bản sửa vào ứng dụng): khoá cả ở cơ sở dữ liệu theo vai trò chụp lúc gửi.
--  · chat_nhip: nhịp tim của máy chạy Tula, để khung chat báo "đang offline" thay vì quay mãi.
create table public.chat_cuoc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  tao_luc timestamptz not null default now()
);
create table public.chat_tin (
  id uuid primary key default gen_random_uuid(),
  cuoc_id uuid not null references public.chat_cuoc (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vai text not null check (vai in ('nguoi', 'agent')),
  loai text not null default 'hoi' check (loai in ('hoi', 'sua', 'duyet')),
  vai_tro_chup text,
  noi_dung text not null check (length(btrim(noi_dung)) > 0 and length(noi_dung) <= 6000),
  trang_thai text not null default 'xong' check (trang_thai in ('cho', 'dang_xu_ly', 'xong', 'loi')),
  hoi_tin_id uuid references public.chat_tin (id) on delete set null,
  tep_duong_dan text,
  tep_ten text,
  thong_hanh text,
  han_thong_hanh timestamptz,
  nhanh_sua text,
  da_duyet_luc timestamptz,
  tao_luc timestamptz not null default now(),
  xong_luc timestamptz,
  constraint chat_tin_sua_chi_ky_thuat check (loai = 'hoi' or vai = 'agent' or vai_tro_chup = 'ky_thuat')
);
create index chat_tin_cuoc_idx on public.chat_tin (cuoc_id, tao_luc desc);
create index chat_tin_cho_idx on public.chat_tin (trang_thai, tao_luc) where trang_thai in ('cho', 'dang_xu_ly');
create index chat_tin_thong_hanh_idx on public.chat_tin (thong_hanh) where thong_hanh is not null;
create table public.chat_nhip (id int primary key check (id = 1), luc timestamptz not null default now());
insert into public.chat_nhip (id, luc) values (1, 'epoch');

-- Cổng cấu trúc (0015): mọi bảng FORCE RLS và có policy chặn tài khoản đăng nhập; chỉ máy chủ (khoá service) đọc/ghi.
do $$
declare t text;
begin
  foreach t in array array['chat_cuoc', 'chat_tin', 'chat_nhip'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('chat-agent', 'chat-agent', false, 20971520)
    on conflict (id) do update set public = false, file_size_limit = 20971520;
  end if;
end $$;
