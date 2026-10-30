-- 0031 — SHOPEE cạnh Facebook + TikTok: gian hàng, đơn hàng, doanh thu + chi phí quảng cáo Shopee theo ngày; thêm đơn/doanh thu cho số liệu Facebook/TikTok để trang chung so sánh được.
-- Khoá Shopee KHÔNG nằm trong DB (biến môi trường Vercel). Chỉ máy chủ đọc/ghi (FORCE RLS). Phiên Ops: 0030+.

create table public.qc_shopee_gian_hang (
  id text primary key,                          -- shop_id
  ten text not null,
  khu_vuc text,
  dang_dong_bo boolean not null default false,
  dong_bo_luc timestamptz,
  tao_luc timestamptz not null default now()
);

create table public.qc_shopee_don_hang (
  ma_don text primary key,                      -- order_sn
  gian_hang_id text not null references public.qc_shopee_gian_hang (id) on delete cascade,
  trang_thai text,
  tao_don_luc timestamptz not null,
  ngay date not null,                           -- ngày theo giờ Việt Nam, để gộp theo ngày
  tong_tien numeric(15, 2) not null default 0,
  phi_van_chuyen numeric(15, 2) not null default 0,
  so_san_pham int not null default 0,
  du_lieu_goc jsonb
);
create index qc_shopee_don_hang_ngay_idx on public.qc_shopee_don_hang (gian_hang_id, ngay);

create table public.qc_shopee_so_lieu_ngay (    -- mỗi gian hàng mỗi ngày một dòng: doanh thu + quảng cáo
  gian_hang_id text not null references public.qc_shopee_gian_hang (id) on delete cascade,
  ngay date not null,
  so_don int not null default 0,
  don_huy int not null default 0,
  doanh_thu numeric(15, 2) not null default 0,
  chi_phi_qc numeric(15, 2) not null default 0,
  hien_thi_qc bigint not null default 0,
  nhap_qc bigint not null default 0,
  don_tu_qc int not null default 0,
  doanh_thu_tu_qc numeric(15, 2) not null default 0,
  primary key (gian_hang_id, ngay)
);
create index qc_shopee_so_lieu_ngay_idx on public.qc_shopee_so_lieu_ngay (ngay);

alter table public.qc_meta_so_lieu add column don_mua int not null default 0, add column doanh_thu numeric(15, 2) not null default 0;
alter table public.qc_tiktok_so_lieu add column doanh_thu numeric(15, 2) not null default 0;

alter table public.qc_nhat_ky_dong_bo drop constraint qc_nhat_ky_dong_bo_nen_tang_check;
alter table public.qc_nhat_ky_dong_bo add constraint qc_nhat_ky_dong_bo_nen_tang_check check (nen_tang in ('Facebook', 'TikTok', 'Shopee'));

do $$
declare t text;
begin
  foreach t in array array['qc_shopee_gian_hang', 'qc_shopee_don_hang', 'qc_shopee_so_lieu_ngay'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
