-- 0004 — NỀN PHÂN QUYỀN Ở TẦNG DATABASE (G1, plan Phụ lục B + H.1–H.7, H.16–H.24).
--
-- Trước migration này: 9 bảng bật RLS nhưng KHÔNG có policy (chỉ service role dùng được) và
-- anon/authenticated có TOÀN QUYỀN trên bảng (mặc định của Supabase) — RLS là chốt duy nhất.
-- Sau migration này: quyền mặc định = rỗng; mọi quyền cấp tường minh bằng (1) quyền cột,
-- (2) policy dựa trên bảng vai trò/quyền, (3) hàm phạm vi trong schema `private`.
--
-- Chưa đổi: nhãn 'Đã nghỉ' (plan định đổi 'Nghỉ việc' nhưng mã đang chạy còn dùng nhãn cũ; đổi cùng lúc
-- với mã ở migration sau). Ứng dụng vẫn đọc bằng service role cho tới khi chuyển từng trang sang
-- client theo người dùng (G1b) — migration này không làm đổi hành vi ứng dụng đang chạy.

create schema if not exists private;
create schema if not exists api;

-- ───────────────────────────── 1. Đóng mặc định ─────────────────────────────
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
grant usage on schema api to authenticated, service_role;
alter default privileges in schema api revoke execute on functions from public, anon, authenticated;

-- ───────────────────────────── 2. Mở rộng nhan_vien ─────────────────────────────
alter table public.nhan_vien
  add column if not exists quan_ly_id uuid references public.nhan_vien (id) on delete set null,
  add column if not exists quan_ly_phu_id uuid references public.nhan_vien (id) on delete set null,
  add column if not exists tai_khoan_hoat_dong boolean not null default true;
alter table public.nhan_vien
  add constraint nhan_vien_khong_tu_quan_ly check (quan_ly_id is distinct from id and quan_ly_phu_id is distinct from id);
create index if not exists nhan_vien_quan_ly_idx on public.nhan_vien (quan_ly_id);
create index if not exists nhan_vien_user_idx on public.nhan_vien (user_id);

-- ───────────────────────────── 3. Vai trò, quyền, trần quyền, gán vai trò ─────────────────────────────
-- Thứ tự phạm vi: m (của mình) < c (mình + cấp dưới trực tiếp) < n (cả nhánh) < a (toàn công ty).
create function private.hang_pham_vi(p text) returns int
language sql immutable parallel safe set search_path = '' as
$$ select case p when 'm' then 1 when 'c' then 2 when 'n' then 3 when 'a' then 5 end $$;

create table public.vai_tro (
  ma text primary key,
  ten text not null,
  nhay_cam boolean not null default true,   -- mặc định NHẠY CẢM (H.16): chịu aal2, đổi cần hai người
  suy_ra boolean not null default false     -- suy ra từ sơ đồ, không gán tay (trưởng bộ phận)
);

create table public.gioi_han_cung (
  vai_tro text not null references public.vai_tro (ma),
  module text not null,
  hanh_dong text not null check (hanh_dong in ('xem','tao','sua','xoa','duyet','xuat')),
  pham_vi_toi_da text not null check (pham_vi_toi_da in ('m','c','n','a')),
  primary key (vai_tro, module, hanh_dong)
);

create table public.quyen_vai_tro (
  vai_tro text not null references public.vai_tro (ma),
  module text not null,
  hanh_dong text not null check (hanh_dong in ('xem','tao','sua','xoa','duyet','xuat')),
  pham_vi text not null check (pham_vi in ('m','c','n','a')),
  primary key (vai_tro, module, hanh_dong)
);

-- Trần quyền bất biến (H.1/H.16): dòng quyền không có trần, hoặc vượt trần, bị từ chối.
create function private.kiem_tran_quyen() returns trigger
language plpgsql set search_path = '' as $$
declare tran text;
begin
  select g.pham_vi_toi_da into tran from public.gioi_han_cung g
   where g.vai_tro = new.vai_tro and g.module = new.module and g.hanh_dong = new.hanh_dong;
  if tran is null then
    raise exception 'Vai trò % không có trần quyền cho %.% — mặc định từ chối', new.vai_tro, new.module, new.hanh_dong
      using errcode = '42501';
  end if;
  if private.hang_pham_vi(new.pham_vi) > private.hang_pham_vi(tran) then
    raise exception 'Quyền %.% của vai trò % vượt trần (% > %)', new.module, new.hanh_dong, new.vai_tro, new.pham_vi, tran
      using errcode = '42501';
  end if;
  return new;
end $$;
create trigger quyen_vai_tro_tran before insert or update on public.quyen_vai_tro
  for each row execute function private.kiem_tran_quyen();

create table public.gan_vai_tro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vai_tro text not null references public.vai_tro (ma),
  hieu_luc_tu date not null default current_date,
  hieu_luc_den date,
  nguoi_gan uuid references auth.users (id),
  created_at timestamptz not null default now(),
  check (hieu_luc_den is null or hieu_luc_den >= hieu_luc_tu)
);
create index gan_vai_tro_user_idx on public.gan_vai_tro (user_id);

-- Vai trò suy ra (truong_bo_phan) và nền (nhan_vien) không gán tay.
create function private.kiem_gan_vai_tro() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.vai_tro v where v.ma = new.vai_tro and v.suy_ra)
     or new.vai_tro = 'nhan_vien' then
    raise exception 'Vai trò % là vai trò nền/suy ra, không gán tay', new.vai_tro using errcode = '42501';
  end if;
  return new;
end $$;
create trigger gan_vai_tro_kiem before insert or update on public.gan_vai_tro
  for each row execute function private.kiem_gan_vai_tro();

-- ───────────────────────────── 4. Nhật ký thao tác (chỉ thêm, không sửa/xoá) ─────────────────────────────
create table public.nhat_ky (
  id bigint generated always as identity primary key,
  thoi_diem timestamptz not null default now(),
  nguoi_thuc_hien uuid,
  bang text not null,
  hanh_dong text not null,
  ban_ghi text,
  truoc jsonb,
  sau jsonb
);
create index nhat_ky_thoi_diem_idx on public.nhat_ky (thoi_diem desc);

create function private.ghi_nhat_ky() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t jsonb; s jsonb; nguoi uuid;
begin
  nguoi := coalesce(nullif(current_setting('private.nguoi_thuc_hien', true), '')::uuid,
                    nullif(auth.jwt() ->> 'sub', '')::uuid);
  if tg_table_name = 'bang_luong' then
    -- không đưa số tiền vào nhật ký (nhật ký nhiều người đọc hơn bảng lương)
    t := case when tg_op <> 'INSERT' then jsonb_build_object('id', old.id) end;
    s := case when tg_op <> 'DELETE' then jsonb_build_object('id', new.id) end;
  else
    t := case when tg_op <> 'INSERT' then to_jsonb(old) end;
    s := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  end if;
  insert into public.nhat_ky (nguoi_thuc_hien, bang, hanh_dong, ban_ghi, truoc, sau)
  values (nguoi, tg_table_name, tg_op, coalesce(s ->> 'id', t ->> 'id'), t, s);
  return coalesce(new, old);
end $$;

create trigger nk_nhan_vien after insert or update or delete on public.nhan_vien
  for each row execute function private.ghi_nhat_ky();
create trigger nk_don_tu after insert or update or delete on public.don_tu
  for each row execute function private.ghi_nhat_ky();
create trigger nk_bang_luong after insert or update or delete on public.bang_luong
  for each row execute function private.ghi_nhat_ky();
create trigger nk_gan_vai_tro after insert or update or delete on public.gan_vai_tro
  for each row execute function private.ghi_nhat_ky();
create trigger nk_quyen_vai_tro after insert or update or delete on public.quyen_vai_tro
  for each row execute function private.ghi_nhat_ky();

-- ───────────────────────────── 5. Hàm phạm vi (schema private, KHÔNG lộ ra API) ─────────────────────────────
-- Nhân viên đang hoạt động của người gọi (null nếu chưa gắn hồ sơ / đã nghỉ / bị ngưng tài khoản).
create function private.nv_hien_tai() returns uuid
language sql stable security definer set search_path = '' as $$
  select n.id from public.nhan_vien n
   where n.user_id = (select auth.uid())
     and n.tai_khoan_hoat_dong and n.trang_thai <> 'Đã nghỉ'
$$;

-- Vai trò còn hiệu lực của người gọi. Vai trò nhạy cảm chỉ tính khi phiên đạt aal2 (H.2).
-- Người không có hồ sơ hoạt động chỉ có thể có vai trò gán thẳng cho tài khoản (vd quản trị kỹ thuật).
create function private.vai_tro_hieu_luc() returns setof text
language sql stable security definer set search_path = '' as $$
  with ai as (select (select auth.uid()) as uid, (select private.nv_hien_tai()) as nv),
  nguon as (
    select g.vai_tro from public.gan_vai_tro g, ai
     where g.user_id = ai.uid and g.hieu_luc_tu <= current_date
       and (g.hieu_luc_den is null or g.hieu_luc_den >= current_date)
    union
    select 'nhan_vien' from ai where ai.nv is not null
    union
    select 'truong_bo_phan' from ai
     where ai.nv is not null and exists (
       select 1 from public.nhan_vien c
        where c.quan_ly_id = ai.nv and c.tai_khoan_hoat_dong and c.trang_thai <> 'Đã nghỉ')
  )
  select v.ma from nguon n join public.vai_tro v on v.ma = n.vai_tro
   where not v.nhay_cam or (select auth.jwt() ->> 'aal') = 'aal2'
$$;

-- Người gọi có quyền (module, hành động) ở BẤT KỲ phạm vi nào? (dùng cho bảng không gắn với một nhân viên)
create function private.co_quyen(p_module text, p_hanh_dong text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.quyen_vai_tro q
     where q.module = p_module and q.hanh_dong = p_hanh_dong
       and q.vai_tro in (select private.vai_tro_hieu_luc()))
$$;

create function private.co_vai_tro(p_vai_tro text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_vai_tro in (select private.vai_tro_hieu_luc())
$$;

-- Tập nhân viên mà người gọi được phép thao tác (module, hành động): m / c / n / a.
create function private.nv_trong_pham_vi(p_module text, p_hanh_dong text) returns setof uuid
language plpgsql stable security definer set search_path = '' as $$
declare me uuid; rong int;
begin
  me := private.nv_hien_tai();
  select max(private.hang_pham_vi(q.pham_vi)) into rong
    from public.quyen_vai_tro q
   where q.module = p_module and q.hanh_dong = p_hanh_dong
     and q.vai_tro in (select private.vai_tro_hieu_luc());
  if rong is null then return; end if;
  if rong >= 5 then
    return query select n.id from public.nhan_vien n;
  elsif me is null then
    return;
  elsif rong = 3 then
    return query
      with recursive cay as (
        select me as id
        union
        select c.id from public.nhan_vien c join cay on c.quan_ly_id = cay.id)
      select id from cay;
  elsif rong = 2 then
    return query select me union select c.id from public.nhan_vien c where c.quan_ly_id = me;
  else
    return query select me;
  end if;
end $$;

-- Có phạm vi TOÀN CÔNG TY (a) cho (module, hành động)? Dùng trước tập hợp trong policy: khi INSERT ... RETURNING,
-- tập "nv_trong_pham_vi" tính trên ảnh chụp trước câu lệnh nên không chứa dòng vừa thêm ⇒ policy SELECT sẽ từ chối.
create function private.co_pham_vi_a(p_module text, p_hanh_dong text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.quyen_vai_tro q
     where q.module = p_module and q.hanh_dong = p_hanh_dong and q.pham_vi = 'a'
       and q.vai_tro in (select private.vai_tro_hieu_luc()))
$$;

-- Chủ thể là Tổng giám đốc / Phó Tổng giám đốc? (carve-out H.18: HCNS không thấy lương Ban điều hành)
create function private.la_chu_the_ban_dieu_hanh(p_nv uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nhan_vien n
                  where n.id = p_nv and (n.chuc_danh ilike 'tổng giám đốc%' or n.chuc_danh ilike 'phó tổng giám đốc%'))
$$;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.hang_pham_vi(text), private.nv_hien_tai(), private.vai_tro_hieu_luc(),
  private.co_quyen(text, text), private.co_pham_vi_a(text, text), private.co_vai_tro(text), private.nv_trong_pham_vi(text, text),
  private.la_chu_the_ban_dieu_hanh(uuid)
  to authenticated, service_role;

-- ───────────────────────────── 6. Hạt giống vai trò + trần quyền + quyền mặc định ─────────────────────────────
insert into public.vai_tro (ma, ten, nhay_cam, suy_ra) values
  ('nhan_vien', 'Nhân viên', false, true),
  ('truong_bo_phan', 'Trưởng bộ phận', false, true),
  ('hcns', 'Hành chính nhân sự', true, false),
  ('ke_toan_luong', 'Kế toán lương', true, false),
  ('ban_dieu_hanh', 'Ban điều hành', true, false),
  ('duyet_luong', 'Duyệt lương', true, false),
  ('quan_tri_he_thong', 'Quản trị hệ thống', true, false);

-- (vai_tro, module, hanh_dong, pham_vi). Trần = mặc định: chỉ GIẢM được, không tăng được.
-- Vắng mặt trong bảng = CẤM (vd quan_tri_he_thong × bang_luong).
create temp table _quyen (vai_tro text, module text, hanh_dong text, pham_vi text) on commit drop;
insert into _quyen values
  -- danh bạ + cơ cấu: ai cũng xem toàn công ty
  ('nhan_vien','danh_ba','xem','a'), ('truong_bo_phan','danh_ba','xem','a'), ('hcns','danh_ba','xem','a'),
  ('ke_toan_luong','danh_ba','xem','a'), ('ban_dieu_hanh','danh_ba','xem','a'), ('quan_tri_he_thong','danh_ba','xem','a'),
  ('nhan_vien','co_cau','xem','a'), ('hcns','co_cau','tao','a'), ('hcns','co_cau','sua','a'),
  ('ban_dieu_hanh','co_cau','duyet','a'),
  -- hồ sơ nhân sự
  ('hcns','ho_so','xem','a'), ('hcns','ho_so','tao','a'), ('hcns','ho_so','sua','a'),
  ('ke_toan_luong','ho_so','xem','a'), ('ban_dieu_hanh','ho_so','xem','a'),
  -- chấm công (ghi chỉ qua RPC ở G2)
  ('nhan_vien','cham_cong','xem','m'), ('truong_bo_phan','cham_cong','xem','n'), ('truong_bo_phan','cham_cong','duyet','c'),
  ('hcns','cham_cong','xem','a'), ('ke_toan_luong','cham_cong','xem','a'), ('ban_dieu_hanh','cham_cong','xem','a'),
  -- đơn từ
  ('nhan_vien','don_tu','xem','m'), ('nhan_vien','don_tu','tao','m'),
  ('truong_bo_phan','don_tu','xem','n'), ('truong_bo_phan','don_tu','duyet','c'),
  ('hcns','don_tu','xem','a'), ('ke_toan_luong','don_tu','xem','a'),
  ('ban_dieu_hanh','don_tu','xem','a'), ('ban_dieu_hanh','don_tu','duyet','a'),
  -- bảng lương + phiếu lương (aal2 ép thêm trong policy)
  ('nhan_vien','bang_luong','xem','m'),
  ('hcns','bang_luong','xem','a'), ('hcns','bang_luong','tao','a'), ('hcns','bang_luong','sua','a'),
  ('ke_toan_luong','bang_luong','xem','a'), ('ke_toan_luong','bang_luong','sua','a'), ('ke_toan_luong','bang_luong','xuat','a'),
  ('ban_dieu_hanh','bang_luong','xem','a'), ('duyet_luong','bang_luong','duyet','a'),
  -- tuyển dụng
  ('truong_bo_phan','tuyen_dung','xem','n'), ('truong_bo_phan','tuyen_dung','tao','n'),
  ('hcns','tuyen_dung','xem','a'), ('hcns','tuyen_dung','tao','a'), ('hcns','tuyen_dung','sua','a'), ('hcns','tuyen_dung','xoa','a'),
  ('ban_dieu_hanh','tuyen_dung','xem','a'), ('ban_dieu_hanh','tuyen_dung','duyet','a'),
  -- đánh giá hiệu suất
  ('nhan_vien','danh_gia','xem','m'), ('truong_bo_phan','danh_gia','xem','n'),
  ('truong_bo_phan','danh_gia','tao','c'), ('truong_bo_phan','danh_gia','sua','c'),
  ('hcns','danh_gia','xem','a'), ('ban_dieu_hanh','danh_gia','xem','a'), ('ban_dieu_hanh','danh_gia','duyet','a'),
  -- phân quyền + nhật ký
  ('hcns','phan_quyen','xem','a'), ('hcns','phan_quyen','tao','a'),
  ('ban_dieu_hanh','phan_quyen','xem','a'), ('ban_dieu_hanh','phan_quyen','duyet','a'),
  ('quan_tri_he_thong','phan_quyen','xem','a'),
  ('hcns','nhat_ky','xem','a'), ('ke_toan_luong','nhat_ky','xem','a'),
  ('ban_dieu_hanh','nhat_ky','xem','a'), ('quan_tri_he_thong','nhat_ky','xem','a');

insert into public.gioi_han_cung select * from _quyen;
insert into public.quyen_vai_tro select * from _quyen;

-- ───────────────────────────── 7. RLS + FORCE + quyền cột + policy ─────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['khoi','nhan_vien','cham_cong','don_tu','ky_luong','bang_luong','tin_tuyen_dung',
                           'ung_vien','danh_gia_hieu_suat','vai_tro','gioi_han_cung','quyen_vai_tro','gan_vai_tro','nhat_ky']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- khoi
grant select on public.khoi to authenticated;
grant insert (ten, mo_ta), update (ten, mo_ta) on public.khoi to authenticated;
create policy khoi_xem on public.khoi for select to authenticated
  using ((select private.nv_hien_tai()) is not null or (select private.co_quyen('danh_ba','xem')));
create policy khoi_tao on public.khoi for insert to authenticated with check ((select private.co_quyen('co_cau','tao')));
create policy khoi_sua on public.khoi for update to authenticated
  using ((select private.co_quyen('co_cau','sua'))) with check ((select private.co_quyen('co_cau','sua')));

-- nhan_vien: danh bạ xem toàn công ty; KHÔNG cấp cột user_id; không xoá (chuyển 'Đã nghỉ')
grant select (id, ma_nhan_vien, ho_ten, chuc_danh, khoi_id, email, ngay_vao_lam, trang_thai,
              quan_ly_id, quan_ly_phu_id, tai_khoan_hoat_dong, created_at)
  on public.nhan_vien to authenticated;
grant insert (ma_nhan_vien, ho_ten, chuc_danh, khoi_id, email, ngay_vao_lam, trang_thai, quan_ly_id, quan_ly_phu_id)
  on public.nhan_vien to authenticated;
grant update (ma_nhan_vien, ho_ten, chuc_danh, khoi_id, email, ngay_vao_lam, trang_thai, quan_ly_id, quan_ly_phu_id)
  on public.nhan_vien to authenticated;
create policy nhan_vien_xem on public.nhan_vien for select to authenticated
  using (((select private.co_pham_vi_a('danh_ba','xem')) or id in (select private.nv_trong_pham_vi('danh_ba','xem'))));
create policy nhan_vien_tao on public.nhan_vien for insert to authenticated
  with check ((select private.co_quyen('ho_so','tao')));
create policy nhan_vien_sua on public.nhan_vien for update to authenticated
  using (((select private.co_pham_vi_a('ho_so','sua')) or id in (select private.nv_trong_pham_vi('ho_so','sua'))) and id is distinct from (select private.nv_hien_tai()))
  with check (((select private.co_pham_vi_a('ho_so','sua')) or id in (select private.nv_trong_pham_vi('ho_so','sua'))));

-- cham_cong: chỉ đọc (ghi qua RPC ở G2; hiện ứng dụng ghi bằng service role)
grant select on public.cham_cong to authenticated;
create policy cham_cong_xem on public.cham_cong for select to authenticated
  using (((select private.co_pham_vi_a('cham_cong','xem')) or nhan_vien_id in (select private.nv_trong_pham_vi('cham_cong','xem'))));

-- don_tu: nhân viên nộp đơn cho CHÍNH MÌNH (trạng thái do mặc định, không cấp cột); người duyệt chỉ đổi trạng thái
grant select on public.don_tu to authenticated;
grant insert (nhan_vien_id, loai, tu_ngay, den_ngay, ly_do) on public.don_tu to authenticated;
grant update (trang_thai, nguoi_duyet_id) on public.don_tu to authenticated;
create policy don_tu_xem on public.don_tu for select to authenticated
  using (((select private.co_pham_vi_a('don_tu','xem')) or nhan_vien_id in (select private.nv_trong_pham_vi('don_tu','xem'))));
create policy don_tu_tao on public.don_tu for insert to authenticated
  with check (nhan_vien_id = (select private.nv_hien_tai()) and (select private.co_quyen('don_tu','tao')));
create policy don_tu_duyet on public.don_tu for update to authenticated
  using (trang_thai = 'Chờ duyệt'
         and ((select private.co_pham_vi_a('don_tu','duyet')) or nhan_vien_id in (select private.nv_trong_pham_vi('don_tu','duyet')))
         and nhan_vien_id <> (select private.nv_hien_tai()))
  with check (trang_thai in ('Đã duyệt','Từ chối') and nguoi_duyet_id = (select private.nv_hien_tai()));

-- ky_luong + bang_luong (aal2 cho MỌI vai trò khi xem; ghi qua RPC ở G4)
grant select on public.ky_luong to authenticated;
grant select on public.bang_luong to authenticated;
create policy ky_luong_xem on public.ky_luong for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2' and (select private.co_quyen('bang_luong','xem')));
create policy bang_luong_xem on public.bang_luong for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2'
         and ((select private.co_pham_vi_a('bang_luong','xem')) or nhan_vien_id in (select private.nv_trong_pham_vi('bang_luong','xem')))
         -- HCNS không thấy lương Ban điều hành (H.18); BĐH/Kế toán thì thấy
         and (not (select private.la_chu_the_ban_dieu_hanh(nhan_vien_id))
              or nhan_vien_id = (select private.nv_hien_tai())
              or (select private.co_vai_tro('ke_toan_luong'))
              or (select private.co_vai_tro('ban_dieu_hanh'))));

-- tin_tuyen_dung + ung_vien
grant select on public.tin_tuyen_dung, public.ung_vien to authenticated;
grant insert (vi_tri, khoi_id, so_luong_can, trang_thai), update (vi_tri, khoi_id, so_luong_can, trang_thai)
  on public.tin_tuyen_dung to authenticated;
grant delete on public.tin_tuyen_dung to authenticated;
grant insert (tin_tuyen_dung_id, ho_ten, email, dien_thoai, trang_thai),
      update (ho_ten, email, dien_thoai, trang_thai) on public.ung_vien to authenticated;
grant delete on public.ung_vien to authenticated;
create policy tin_xem on public.tin_tuyen_dung for select to authenticated using ((select private.co_quyen('tuyen_dung','xem')));
create policy tin_tao on public.tin_tuyen_dung for insert to authenticated with check ((select private.co_quyen('tuyen_dung','tao')));
create policy tin_sua on public.tin_tuyen_dung for update to authenticated
  using ((select private.co_quyen('tuyen_dung','sua'))) with check ((select private.co_quyen('tuyen_dung','sua')));
create policy tin_xoa on public.tin_tuyen_dung for delete to authenticated using ((select private.co_quyen('tuyen_dung','xoa')));
create policy uv_xem on public.ung_vien for select to authenticated using ((select private.co_quyen('tuyen_dung','xem')));
create policy uv_tao on public.ung_vien for insert to authenticated with check ((select private.co_quyen('tuyen_dung','tao')));
create policy uv_sua on public.ung_vien for update to authenticated
  using ((select private.co_quyen('tuyen_dung','sua'))) with check ((select private.co_quyen('tuyen_dung','sua')));
create policy uv_xoa on public.ung_vien for delete to authenticated using ((select private.co_quyen('tuyen_dung','xoa')));

-- danh_gia_hieu_suat: người đánh giá ≠ người được đánh giá
grant select on public.danh_gia_hieu_suat to authenticated;
grant insert (nhan_vien_id, ky, diem, xep_loai, nguoi_danh_gia_id), update (ky, diem, xep_loai)
  on public.danh_gia_hieu_suat to authenticated;
create policy dg_xem on public.danh_gia_hieu_suat for select to authenticated
  using (((select private.co_pham_vi_a('danh_gia','xem')) or nhan_vien_id in (select private.nv_trong_pham_vi('danh_gia','xem'))));
create policy dg_tao on public.danh_gia_hieu_suat for insert to authenticated
  with check (((select private.co_pham_vi_a('danh_gia','tao')) or nhan_vien_id in (select private.nv_trong_pham_vi('danh_gia','tao')))
              and nhan_vien_id <> (select private.nv_hien_tai())
              and nguoi_danh_gia_id = (select private.nv_hien_tai()));
create policy dg_sua on public.danh_gia_hieu_suat for update to authenticated
  using (((select private.co_pham_vi_a('danh_gia','sua')) or nhan_vien_id in (select private.nv_trong_pham_vi('danh_gia','sua'))) and nhan_vien_id <> (select private.nv_hien_tai()))
  with check (((select private.co_pham_vi_a('danh_gia','sua')) or nhan_vien_id in (select private.nv_trong_pham_vi('danh_gia','sua'))));

-- bảng phân quyền: người có quyền chỉ ĐỌC; ghi vai trò/quyền đi qua RPC/migration (không cấp ghi cho ứng dụng ở bản này)
grant select on public.vai_tro, public.gioi_han_cung, public.quyen_vai_tro, public.gan_vai_tro to authenticated;
create policy vai_tro_xem on public.vai_tro for select to authenticated using ((select private.co_quyen('phan_quyen','xem')));
create policy gh_xem on public.gioi_han_cung for select to authenticated using ((select private.co_quyen('phan_quyen','xem')));
create policy qvt_xem on public.quyen_vai_tro for select to authenticated using ((select private.co_quyen('phan_quyen','xem')));
create policy gvt_xem on public.gan_vai_tro for select to authenticated
  using ((select private.co_quyen('phan_quyen','xem')) or user_id = (select auth.uid()));

-- nhật ký
grant select on public.nhat_ky to authenticated;
create policy nk_xem on public.nhat_ky for select to authenticated using ((select private.co_quyen('nhat_ky','xem')));
