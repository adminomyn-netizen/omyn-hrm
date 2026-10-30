-- 0032 — CÔNG VIỆC: đầu việc hằng ngày / vận hành có số lượng cần làm và tiến độ (tham khảo daily_tasks + operational_tasks của e-global-ops, dựng lại gọn theo Omyn).
-- Việc lặp hằng ngày ghi tiến độ từng ngày ở cong_viec_ngay; việc một lần ghi thẳng ở da_lam_so. Chỉ máy chủ đọc/ghi (FORCE RLS). Phiên Ops: 0030+.

create table public.cong_viec (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null check (length(btrim(tieu_de)) > 0),
  mo_ta text,
  loai text not null default 'Vận hành' check (loai in ('Hằng ngày', 'Vận hành')),
  nguoi_lam_id uuid not null references public.nhan_vien (id) on delete cascade,
  nguoi_giao_id uuid references public.nhan_vien (id) on delete set null,
  han date,
  uu_tien text not null default 'Trung bình' check (uu_tien in ('Cao', 'Trung bình', 'Thấp')),
  muc_tieu_so int not null default 1 check (muc_tieu_so between 1 and 100000),  -- số lượng cần làm (một lần: cả việc; lặp hằng ngày: mỗi ngày)
  da_lam_so int not null default 0 check (da_lam_so >= 0),                      -- chỉ dùng cho việc không lặp
  don_vi text not null default '' ,
  lap_lai text not null default 'Không' check (lap_lai in ('Không', 'Hằng ngày')),
  trang_thai text not null default 'Chưa làm' check (trang_thai in ('Chưa làm', 'Đang làm', 'Hoàn thành', 'Huỷ')),
  hoan_thanh_luc timestamptz,
  tao_luc timestamptz not null default now()
);
create index cong_viec_nguoi_lam_idx on public.cong_viec (nguoi_lam_id, trang_thai);
create index cong_viec_han_idx on public.cong_viec (han) where trang_thai in ('Chưa làm', 'Đang làm');

create table public.cong_viec_ngay (
  cong_viec_id uuid not null references public.cong_viec (id) on delete cascade,
  ngay date not null,
  da_lam int not null default 0 check (da_lam >= 0),
  cap_nhat_luc timestamptz not null default now(),
  primary key (cong_viec_id, ngay)
);

do $$
declare t text;
begin
  foreach t in array array['cong_viec', 'cong_viec_ngay'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
