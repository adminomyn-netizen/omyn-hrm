-- 0015 — Cổng cấu trúc: mọi bảng public phải FORCE RLS và có policy. Bốn bảng của 0014 chỉ ứng dụng (khoá service, bỏ qua RLS) đọc/ghi,
-- nên policy ở đây chặn hẳn tài khoản đăng nhập: không ai đọc được khoá VAPID hay đăng ký thiết bị của người khác bằng khoá công khai.
do $$
declare t text;
begin
  foreach t in array array['dang_ky_thong_bao', 'cau_hinh_bi_mat', 'nhac_da_gui', 'tong_hop_hieu_suat'] loop
    execute format('drop policy if exists %I on public.%I', t || '_chi_may_chu', t);
    execute format('create policy %I on public.%I for select to authenticated using (false)', t || '_chi_may_chu', t);
  end loop;
end $$;
