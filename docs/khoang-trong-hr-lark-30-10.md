# Khoảng trống HCNS Omyn so với HR Lark (rà 30/10/2026)

Chị Lâm 30/10: "bê HR bên Lark sang Omyn, đầy đủ không thiếu sót". Nguồn thiết kế: `docs/mapping-lark-hr.md` (12/10). Migration `0002_mo_rong_theo_nghiep_vu_thuc.sql` mô tả trong mapping NHƯNG KHÔNG có trong repo và chưa áp DB (README: chờ chốt nguồn nhân sự) — nay chị đã chốt, làm lại theo các lát dưới đây (số migration tiếp từ 0017).

Đã có: nhan_vien, cham_cong, don_tu (11 loại: nghỉ phép/ốm/không lương/chế độ, đi trễ, về sớm, giải trình, remote, công tác, chấm công ngoài, tạm ứng), bang_luong/ky_luong/tham_so_luong, danh_gia_hieu_suat, tin_tuyen_dung, ung_vien, yeu_cau_tuyen_dung, than_nhan, tai_lieu_nhan_vien, ngay_le, khoi, vi_tri_cham_cong.

Còn thiếu (đối chiếu mapping, 31 mục) — chia lát 15-20 phút:
1. Hồ sơ: phong_ban, hop_dong_lao_dong (+ trang "đến hạn HĐLĐ"), hop_dong_khac, nhan_vien.ngay_sinh (+ trang "Sinh nhật"), lo_trinh_thang_tien, thong_tin_gia_dinh (đối chiếu than_nhan), khao_sat_nghi_viec.
2. Đơn từ/công: quy_phep_nam (+ "Lịch nghỉ phép"), don_lam_them_gio, dieu_chinh_sai_sot_cham_cong, dang_ky_nghi_thang, don_xin_nghi_viec, de_nghi_hau_can_cong_tac, đơn "ra ngoài/làm online".
3. Lương: quan_ly_thuong_phat, thue_tncn, hieu_qua_bsc, dong_bo_luong_kinh_doanh.
4. Tuyển dụng: muc_tieu_tuyen_dung, ngan_sach_tuyen_dung, kenh_tuyen_dung + hieu_suat, lich_phong_van, offer_tuyen_dung, de_xuat_phe_duyet, theo_doi_onboarding (+ đánh giá 30/60 ngày).
5. Khảo sát/tài sản: khao_sat_enps, quan_ly_tai_san_cap_phat. Báo cáo: các view phân nhóm (tuổi/giới/thâm niên/HĐ), cơ cấu lương.
6. Phạm vi xem "BOD" (xem toàn công ty) bằng RLS, không tạo bảng song song.

Chưa tra được: base Lark `V70gblwgkaq7M1sXk4ojD6QMpmc` (3 trang: HĐLĐ đến hạn, sinh nhật, lịch nghỉ phép) — tính từ cột đã có.
Áp migration Omyn: Management API (token Keychain `supabase-msc-token`, không in). Mỗi lát: migration + trang + quyền + test RLS (khung PGlite), rồi gộp qua PR.
