-- 0052 — Mở rộng đính kèm tệp (chị Lâm 31/10/2026): mọi sổ có ô "Link …" và hồ sơ ứng viên (CV từ máy) nhận tệp; thêm loại giấy CV, bằng cấp, tài liệu, slide, hình ảnh, bằng chứng, báo cáo.
-- Tên màn do máy chủ kiểm (màn có thật và có nhận tệp), DB chỉ giữ dạng chữ an toàn.
alter table public.tep_dinh_kem drop constraint if exists tep_dinh_kem_man_check;
alter table public.tep_dinh_kem add constraint tep_dinh_kem_man_check check (man ~ '^[a-z0-9-]{2,60}$');
alter table public.tep_dinh_kem drop constraint if exists tep_dinh_kem_loai_giay_check;
alter table public.tep_dinh_kem add constraint tep_dinh_kem_loai_giay_check check (loai_giay in (
  'Giấy uỷ quyền (LOA)', 'CFS', 'Phiếu công bố', 'PIF', 'Hợp đồng', 'Chứng từ thanh toán', 'Giấy đăng ký doanh nghiệp (ĐKDN)', 'Artwork',
  'CV', 'Bằng cấp / chứng chỉ', 'Tài liệu', 'Bài thuyết trình (slide)', 'Hình ảnh', 'Bằng chứng', 'Báo cáo', 'Khác'));
