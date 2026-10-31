-- 0049: Sổ hợp đồng chia cụm theo đối tác, lô hàng, loại giấy (chị Lâm). Chỉ THÊM 3 cột, không đổi dữ liệu cũ.
alter table public.pl_so_hop_dong add column doi_tac_nhom text;
alter table public.pl_so_hop_dong add column lo_hang text;
alter table public.pl_so_hop_dong add column loai_giay text
  check (loai_giay is null or loai_giay in ('Giấy uỷ quyền (LOA)', 'CFS', 'Hợp đồng sản xuất', 'Chứng từ thanh toán', 'Giấy đăng ký doanh nghiệp (ĐKDN)', 'Hợp đồng khác', 'Giấy tờ khác'));
