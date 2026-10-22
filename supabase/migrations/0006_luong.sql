-- 0006 — LƯƠNG (G4 bản đầu, plan Phụ lục D): tham số, thỏa thuận lương theo người, kỳ lương có trạng thái, bảng lương chi tiết.
-- Bảng lương cũ (luong_co_ban/phu_cap/thuc_linh phát sinh) đang rỗng nên dựng lại theo thiết kế mới.
-- Mọi bảng đều RLS + FORCE; ghi qua máy chủ (service role) — người dùng đăng nhập chỉ ĐỌC theo quyền, và lương chỉ đọc ở aal2.

-- ───────── 1. Tham số tính lương ─────────
create table public.tham_so_luong (
  khoa text primary key,
  nhan text not null,
  gia_tri numeric(18, 4) not null,
  don_vi text not null check (don_vi in ('dong', 'phan_tram', 'ngay', 'so')),
  nguon text,
  xac_nhan_boi uuid references auth.users (id),
  xac_nhan_luc timestamptz,
  cap_nhat_luc timestamptz not null default now()
);

insert into public.tham_so_luong (khoa, nhan, gia_tri, don_vi, nguon) values
  ('cong_chuan_van_phong', 'Công chuẩn khối văn phòng', 24, 'ngay', 'Quy chế lương Điều 3'),
  ('tien_an_ngay', 'Tiền ăn mỗi ngày đi làm', 25000, 'dong', 'Quy chế Điều 7'),
  ('mien_thue_tien_an', 'Tiền ăn miễn thuế tối đa mỗi tháng', 730000, 'dong', 'Cơ cấu lương tab 4'),
  ('thu_viec_ty_le', 'Tỷ lệ lương thử việc', 85, 'phan_tram', 'Quy chế Điều 4.4; BLLĐ Điều 26'),
  ('ot_thuong', 'Hệ số làm thêm ngày thường', 150, 'phan_tram', 'BLLĐ 2019 Điều 98'),
  ('ot_nghi_tuan', 'Hệ số làm thêm ngày nghỉ tuần', 200, 'phan_tram', 'BLLĐ 2019 Điều 98'),
  ('ot_le', 'Hệ số làm thêm ngày lễ', 300, 'phan_tram', 'BLLĐ 2019 Điều 98'),
  ('bhxh_nld', 'BHXH người lao động đóng', 8, 'phan_tram', 'Quy chế Điều 14'),
  ('bhyt_nld', 'BHYT người lao động đóng', 1.5, 'phan_tram', 'Quy chế Điều 14'),
  ('bhtn_nld', 'BHTN người lao động đóng', 1, 'phan_tram', 'Quy chế Điều 14'),
  ('bhxh_cty', 'BHXH công ty đóng', 17.5, 'phan_tram', 'Quy chế Điều 14'),
  ('bhyt_cty', 'BHYT công ty đóng', 3, 'phan_tram', 'Quy chế Điều 14'),
  ('bhtn_cty', 'BHTN công ty đóng', 1, 'phan_tram', 'Quy chế Điều 14'),
  ('kpcd_cty', 'Kinh phí công đoàn (công ty chi)', 2, 'phan_tram', 'Quy chế Điều 14 — Kế toán xác nhận có áp dụng'),
  ('tran_dong_bhxh_bhyt', 'Trần lương đóng BHXH, BHYT (20 × lương cơ sở)', 50600000, 'dong', 'Chưa xác nhận lương cơ sở 2.530.000 đ từ 01/07/2026'),
  ('tran_dong_bhtn', 'Trần lương đóng BHTN (20 × lương tối thiểu vùng I)', 106200000, 'dong', 'NĐ 293/2025/NĐ-CP, vùng I 5.310.000 đ'),
  ('giam_tru_ban_than', 'Giảm trừ gia cảnh bản thân mỗi tháng', 15500000, 'dong', 'NQ 110/2025/UBTVQH15'),
  ('giam_tru_phu_thuoc', 'Giảm trừ mỗi người phụ thuộc mỗi tháng', 6200000, 'dong', 'NQ 110/2025/UBTVQH15'),
  ('thue_bac_1_den', 'Thuế bậc 1: thu nhập tính thuế tới', 10000000, 'dong', 'Luật Thuế TNCN sửa đổi (xác nhận số hiệu và ngày hiệu lực)'),
  ('thue_bac_2_den', 'Thuế bậc 2: tới', 30000000, 'dong', 'như trên'),
  ('thue_bac_3_den', 'Thuế bậc 3: tới', 60000000, 'dong', 'như trên'),
  ('thue_bac_4_den', 'Thuế bậc 4: tới', 100000000, 'dong', 'như trên'),
  ('thue_ty_le_1', 'Thuế suất bậc 1', 5, 'phan_tram', 'như trên'),
  ('thue_ty_le_2', 'Thuế suất bậc 2', 10, 'phan_tram', 'như trên'),
  ('thue_ty_le_3', 'Thuế suất bậc 3', 20, 'phan_tram', 'như trên'),
  ('thue_ty_le_4', 'Thuế suất bậc 4', 30, 'phan_tram', 'như trên'),
  ('thue_ty_le_5', 'Thuế suất bậc 5 (trên bậc 4)', 35, 'phan_tram', 'như trên'),
  ('khau_tru_vang_lai_ty_le', 'Khấu trừ thuế người thử việc/hợp đồng ngắn', 10, 'phan_tram', 'Quy chế Điều 15.4'),
  ('khau_tru_vang_lai_nguong', 'Ngưỡng khấu trừ mỗi lần chi', 2000000, 'dong', 'Quy chế Điều 15.4');

-- ───────── 2. Thỏa thuận lương theo người ─────────
create table public.luong_thoa_thuan (
  nhan_vien_id uuid primary key references public.nhan_vien (id) on delete cascade,
  luong_thoa_thuan bigint not null check (luong_thoa_thuan >= 0),   -- gộp: lương chức danh + KPI khoán
  ty_le_kpi int not null default 10 check (ty_le_kpi between 0 and 50), -- % KPI nền trong lương thỏa thuận (BĐH = 0)
  phu_cap bigint not null default 0 check (phu_cap >= 0),
  phu_cap_mien_thue boolean not null default true,                  -- vd điện thoại khoán
  an_ca boolean not null default true,                              -- hưởng tiền ăn (Streamer bán thời gian: không)
  dong_bh boolean not null default true,
  so_nguoi_phu_thuoc int not null default 0 check (so_nguoi_phu_thuoc >= 0),
  kieu_cong text not null default 'van_phong' check (kieu_cong in ('van_phong', 'van_hanh')),
  ghi_chu text,
  cap_nhat_luc timestamptz not null default now()
);

-- ───────── 3. Kỳ lương có trạng thái (chỉ đi tiến) ─────────
alter table public.ky_luong
  add column thang int check (thang between 1 and 12),
  add column nam int check (nam between 2024 and 2100),
  add column trang_thai text not null default 'mo' check (trang_thai in ('mo', 'da_lap', 'da_kiem', 'da_duyet', 'da_chi')),
  add column ghi_chu text,
  add column chuyen_luc timestamptz;
alter table public.ky_luong add constraint ky_luong_nam_thang unique (nam, thang);

-- ───────── 4. Bảng lương chi tiết (chụp lại đầu vào để kỳ đã chốt không đổi khi thỏa thuận đổi) ─────────
drop table public.bang_luong;
create table public.bang_luong (
  id uuid primary key default gen_random_uuid(),
  ky_luong_id uuid not null references public.ky_luong (id) on delete cascade,
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  -- CỘT CŨ giữ tạm để bản ứng dụng cũ (đang chạy) vẫn đọc được bảng này khi chuyển giai đoạn; sẽ bỏ ở migration sau.
  luong_co_ban bigint not null default 0,
  -- đầu vào
  luong_thoa_thuan bigint not null default 0,
  ty_le_kpi int not null default 10,
  thu_viec boolean not null default false,
  kieu_cong text not null default 'van_phong',
  cong_chuan numeric(4, 1) not null default 24,
  cong_huong numeric(4, 1) not null default 0,
  ngay_lam numeric(4, 1) not null default 0,
  ty_le_ht_kpi int not null default 100 check (ty_le_ht_kpi between 0 and 200),
  phu_cap bigint not null default 0,
  phu_cap_mien_thue boolean not null default true,
  an_ca boolean not null default true,
  dong_bh boolean not null default true,
  so_nguoi_phu_thuoc int not null default 0,
  gio_ot_thuong numeric(5, 1) not null default 0,
  gio_ot_nghi_tuan numeric(5, 1) not null default 0,
  gio_ot_le numeric(5, 1) not null default 0,
  hoa_hong bigint not null default 0,
  thuong_khac bigint not null default 0,
  khau_tru_khac bigint not null default 0,
  ghi_chu text,
  -- kết quả (tính bằng src/lib/luong/tinh-luong.ts)
  luong_chuc_danh bigint not null default 0,
  luong_kpi bigint not null default 0,
  phu_cap_thuc bigint not null default 0,
  tien_an bigint not null default 0,
  tien_ot bigint not null default 0,
  tong_thu_nhap bigint not null default 0,
  bh_xh bigint not null default 0,
  bh_yt bigint not null default 0,
  bh_tn bigint not null default 0,
  giam_tru bigint not null default 0,
  thu_nhap_tinh_thue bigint not null default 0,
  thue_tncn bigint not null default 0,
  thuc_linh bigint not null default 0,
  bh_cty bigint not null default 0,
  tinh_luc timestamptz,
  unique (ky_luong_id, nhan_vien_id)
);
create index bang_luong_ky_idx on public.bang_luong (ky_luong_id);

-- ───────── 5. Bảo mật: RLS + FORCE, chỉ ĐỌC cho người đăng nhập theo quyền (aal2), ghi qua máy chủ ─────────
alter table public.tham_so_luong enable row level security;
alter table public.tham_so_luong force row level security;
alter table public.luong_thoa_thuan enable row level security;
alter table public.luong_thoa_thuan force row level security;
alter table public.bang_luong enable row level security;
alter table public.bang_luong force row level security;

grant select on public.tham_so_luong, public.luong_thoa_thuan, public.bang_luong to authenticated;

create policy tham_so_xem on public.tham_so_luong for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2' and (select private.co_quyen('bang_luong', 'xem')));

create policy thoa_thuan_xem on public.luong_thoa_thuan for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2'
         and ((select private.co_pham_vi_a('bang_luong', 'xem')) or nhan_vien_id in (select private.nv_trong_pham_vi('bang_luong', 'xem')))
         and (not (select private.la_chu_the_ban_dieu_hanh(nhan_vien_id))
              or nhan_vien_id = (select private.nv_hien_tai())
              or (select private.co_vai_tro('ke_toan_luong'))
              or (select private.co_vai_tro('ban_dieu_hanh'))));

create policy bang_luong_xem on public.bang_luong for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2'
         and ((select private.co_pham_vi_a('bang_luong', 'xem')) or nhan_vien_id in (select private.nv_trong_pham_vi('bang_luong', 'xem')))
         and (not (select private.la_chu_the_ban_dieu_hanh(nhan_vien_id))
              or nhan_vien_id = (select private.nv_hien_tai())
              or (select private.co_vai_tro('ke_toan_luong'))
              or (select private.co_vai_tro('ban_dieu_hanh'))));

-- nhật ký: bảng lương (không ghi số tiền) và thỏa thuận lương (không ghi số tiền)
create trigger nk_bang_luong after insert or update or delete on public.bang_luong
  for each row execute function private.ghi_nhat_ky();
create or replace function private.ghi_nhat_ky() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t jsonb; s jsonb; nguoi uuid;
begin
  nguoi := coalesce(nullif(current_setting('private.nguoi_thuc_hien', true), '')::uuid,
                    nullif(auth.jwt() ->> 'sub', '')::uuid);
  if tg_table_name in ('bang_luong', 'luong_thoa_thuan') then
    -- không đưa số tiền vào nhật ký (nhật ký nhiều người đọc hơn bảng lương)
    t := case when tg_op <> 'INSERT' then jsonb_build_object('id', coalesce(to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'nhan_vien_id')) end;
    s := case when tg_op <> 'DELETE' then jsonb_build_object('id', coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'nhan_vien_id')) end;
  else
    t := case when tg_op <> 'INSERT' then to_jsonb(old) end;
    s := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  end if;
  insert into public.nhat_ky (nguoi_thuc_hien, bang, hanh_dong, ban_ghi, truoc, sau)
  values (nguoi, tg_table_name, tg_op, coalesce(s ->> 'id', t ->> 'id'), t, s);
  return coalesce(new, old);
end $$;
create trigger nk_luong_thoa_thuan after insert or update or delete on public.luong_thoa_thuan
  for each row execute function private.ghi_nhat_ky();
