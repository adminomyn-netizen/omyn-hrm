-- 0050: Đính kèm file thật vào các sổ (hồ sơ sản phẩm, công bố, hợp đồng, bao bì, nhà cung cấp, sản phẩm).
-- File nằm trong kho riêng (bucket private, chỉ máy chủ đọc ghi, tải bằng link ký hết hạn). Bảng này giữ thông tin từng tệp và gắn với dòng của sổ.

insert into storage.buckets (id, name, public, file_size_limit)
values ('tai-lieu-omyn', 'tai-lieu-omyn', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;

create table public.tep_dinh_kem (
  id uuid primary key default gen_random_uuid(),
  man text not null check (man in ('ho-so-san-pham', 'so-cong-bo', 'so-hop-dong', 'duyet-bao-bi', 'nha-cung-cap', 'san-pham')),
  dong_id uuid not null,
  loai_giay text not null default 'Khác' check (loai_giay in ('Giấy uỷ quyền (LOA)', 'CFS', 'Phiếu công bố', 'PIF', 'Hợp đồng', 'Chứng từ thanh toán', 'Giấy đăng ký doanh nghiệp (ĐKDN)', 'Artwork', 'Khác')),
  ten_tep text not null check (length(btrim(ten_tep)) > 0),
  duong_dan text not null unique,
  kich_thuoc bigint not null check (kich_thuoc >= 0 and kich_thuoc <= 26214400),
  kieu text,
  nguoi_tai text not null,
  nguon text not null default 'Trong app',
  tao_luc timestamptz not null default now()
);
create index tep_dinh_kem_dong_idx on public.tep_dinh_kem (man, dong_id, tao_luc desc);

-- Khoá cho lệnh tải file từ máy khác: chỉ lưu dấu vân tay (sha256) của khoá, không lưu khoá.
create table public.khoa_tai_len_tep (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  bam text not null unique,
  tao_luc timestamptz not null default now(),
  thu_hoi_luc timestamptz
);

do $$
declare t text;
begin
  foreach t in array array['tep_dinh_kem', 'khoa_tai_len_tep'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
