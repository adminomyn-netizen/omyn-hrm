-- 0070 — Bỏ tham số khấu trừ 10% cho thử việc (chị Lâm/chị Phượng 05/11): thuế người thử việc tính lũy tiến như mọi người, không mặc định 10%.
delete from public.tham_so_luong where khoa in ('khau_tru_vang_lai_ty_le', 'khau_tru_vang_lai_nguong');
