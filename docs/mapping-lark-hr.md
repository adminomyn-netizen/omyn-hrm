# Mapping: app HR Lark Base thật → Omyn HRM

Nguồn: app Lark Base "APP - Ban Nhân lực & Phát triển" (app_token `S2m8bj933aP3YPsKmuNjxSL6pdf`),
tra bằng `lark-cli2 base +app-get/+table-list --as user` (12/10/2026). 17 trang hiển thị, dữ liệu
thật nằm trong 4 base con. **Base thứ 4 (`V70gblwgkaq7M1sXk4ojD6QMpmc`) CHƯA xin được quyền đọc**
(lỗi API thật `91403 you don't have permission`, không phải lỗi giả) — 3 trang chưa map được
base nguồn: "Nhân viên đến hạn HĐLĐ", "Sinh nhật nhân viên", "Lịch nghỉ phép". Cần sếp cấp quyền
base này rồi tra lại, KHÔNG bịa cấu trúc.

Migration mở rộng: `supabase/migrations/0002_mo_rong_theo_nghiep_vu_thuc.sql` (không sửa đè
`0001_khung_ban_dau.sql`).

## Cụm 1 — Tuyển dụng (base `JypXbgmiUawsARsQEfej3PLYpNb`, 14 bảng) → module `tuyen-dung`

| Bảng Lark (dòng) | Bảng Supabase |
|---|---|
| 1.1 Quản lý mục tiêu tuyển dụng (90) | `muc_tieu_tuyen_dung` |
| 1.2 Ngân sách-chi phí tuyển dụng (8) | `ngan_sach_tuyen_dung` |
| 1.3 Quản lý kênh tuyển dụng (60) | `kenh_tuyen_dung` |
| 1.4 Hiệu suất kênh tuyển dụng (12) | `hieu_suat_kenh_tuyen_dung` |
| 2.1 Mô tả công việc (1 — quá ít) | gộp vào cột `mo_ta_cv` trên `tin_tuyen_dung` (0001), không tạo bảng riêng |
| 2.2 Yêu cầu tuyển dụng (27) | `yeu_cau_tuyen_dung` |
| 3.1 Hồ sơ ứng viên (350) | mở rộng `ung_vien` (0001) bằng ALTER |
| 3.2 Lịch phỏng vấn (99) | `lich_phong_van` |
| 3.4 Offer (62) | `offer_tuyen_dung` (gộp luôn "1.1 Dữ liệu Offer từ Tuyển dụng" 41 dòng của cụm 2 — cùng dữ liệu nhìn từ 2 phía) |
| 4.1/4.2 Đề xuất tuyển dụng (21) / ngân sách (11) | `de_xuat_phe_duyet` (bảng chung, cột `loai_de_xuat`) |
| 4.3 Đề xuất offer tuyển dụng (0 — rỗng) | BỎ, chưa có dữ liệu |
| 5.1/5.2 Lookup tháng năm / tuyển dụng | không tạo bảng — là bảng tra cứu nội bộ Lark, Postgres dùng `date`/FK thay thế |

## Cụm 2 — Onboarding & thử việc (base `N83ebZyzAaWGWPsJQPQjp66Kpob`, 13 bảng) → module `tuyen-dung` + `danh-gia`

| Bảng Lark (dòng) | Xử lý |
|---|---|
| 1.2 Theo dõi ONB (5) | `theo_doi_onboarding` |
| 2.1-2.3 Đánh giá sau 30/60 ngày — mentor/HR (0/0/0) | BỎ, rỗng hoàn toàn |
| 2.4 Nhân sự đánh giá sau thử việc (0) | BỎ, rỗng |
| 2.5-2.7 Test Bộ 1/2/3 (2/1/0) | BỎ TẠM — quá ít dữ liệu, chưa đủ để thiết kế bảng; thêm sau khi có bộ câu hỏi thật |
| 3.1 Quản lý nhân sự, 3.2 Theo dõi ký HĐ CNV | TRÙNG với cụm 3, không tạo lại |
| 3.3-3.4 Lookup | không tạo bảng, như cụm 1 |

## Cụm 3 — Nhân sự tổng hợp (base `V0pVbwdzsaS6VisuvNwjSkWhpIg`, 52 bảng) — lớn nhất, chia theo tiền tố

**1.x Hồ sơ & lộ trình → module `nhan-su`**
- Quản lý nhân sự (100), Thông tin gia đình (26), Hợp đồng khác (7), Khảo sát nghỉ việc (11)
  → ALTER `nhan_vien` + bảng mới `thong_tin_gia_dinh_nhan_su`, `hop_dong_khac`, `khao_sat_nghi_viec`
- Lộ trình thăng tiến (92) → `lo_trinh_thang_tien`
- Lương, phúc lợi (98) → cột trên `nhan_vien`/`bang_luong`, không tách bảng riêng (trùng dữ liệu 4.x)
- Theo dõi ký hợp đồng CNV (59) → `hop_dong_lao_dong`

**2.x Chấm công → module `cham-cong`**
- Employee_Info (112), Department_Info (19) → `phong_ban` + ALTER `nhan_vien`
- Attendance_Results (7.988), Attendance_Records (12.460) → dữ liệu thô chấm công máy, QUÁ LỚN
  để tạo bảng mô phỏng ngay; `cham_cong` (0001) đã có cấu trúc ngày/giờ vào-ra đủ dùng cho demo.
  Khi nối Supabase thật thì import thẳng 2 bảng này qua ETL, không gõ tay.

**3.x Đơn từ → module `don-tu`**
- `don_tu` (0001) giới hạn 4 loại — ALTER rộng thêm: 'Làm online', 'Làm thêm giờ', 'Ra ngoài',
  'Nghỉ việc' để chứa: Phiếu xin phép online (12+16 BOD), Đăng ký ra ngoài (22)
- Quỹ phép năm (98) → `quy_phep_nam` (số phép còn lại theo năm, khác với từng đơn `don_tu`)
- Xác nhận làm thêm giờ (371, bảng chính) + Phiếu xin phép làm thêm giờ (1, quá ít) → gộp một
  bảng `don_lam_them_gio` có `trang_thai` đi từ xin → xác nhận
- Điều chỉnh sai sót chấm công (248) → `dieu_chinh_sai_sot_cham_cong`
- Tổng hợp công theo ngày (82) → view sau, không tạo bảng gốc (tính từ `cham_cong`)
- Đăng ký nghỉ tháng (624, nhiều dữ liệu) → `dang_ky_nghi_thang`
- Đề nghị bố trí hậu cần công tác (65, BOD) → `de_nghi_hau_can_cong_tac`
- Xin nghỉ việc (38) → `don_xin_nghi_viec` (khác khảo sát nghỉ việc ở mục 1.x)

**4.x + 5.x Lương → module `luong`**
- Hiệu quả làm việc BSC (20) → `hieu_qua_bsc`
- Quản lý thưởng phạt (163) → `quan_ly_thuong_phat`
- Ghi nhận lương đồng bộ từ Kinh doanh (138) → `dong_bo_luong_kinh_doanh`
- Thuế TNCN lần 1 (95) → `thue_tncn`
- Ghi nhận chi tiêu quỹ (1), Ghi nhận hỗ trợ KPI (1), Báo cáo lương theo tháng (11),
  Lưu trữ bảng lương (281) → BỎ tạo bảng riêng: 2 cái đầu quá ít dữ liệu; "báo cáo theo tháng"
  sẽ là VIEW tính từ `bang_luong`; "lưu trữ" chỉ là các kỳ `ky_luong` cũ, đã có sẵn cơ chế lịch sử
  qua FK `ky_luong_id`, không cần bảng thứ hai.

**7.x Khảo sát & tài sản → module `danh-gia`**
- Khảo sát eNPS (5) → `khao_sat_enps`
- Quản lý tài sản công ty cấp (10) → `quan_ly_tai_san_cap_phat`
- Khảo sát tín nhiệm (0), Form đánh giá tái ký HĐ (0) → BỎ, rỗng

**9.x Lookup** → không tạo bảng (dùng FK/date trực tiếp)

**10.x bản BOD riêng** (Employee/Department/Attendance_BOD, xin phép online/hậu cần/nghỉ việc BOD)
→ KHÔNG tạo bảng song song. Đây là cùng nghiệp vụ với bản thường, chỉ khác PHẠM VI XEM (dành cho
cấp lãnh đạo). Xử lý bằng RLS policy "xem toàn công ty" khi đã chốt vai trò thật — việc còn lại
trong README mục "Việc còn lại trước khi dùng thật".

**Các bảng "Phân nhóm" (độ tuổi/giới tính/thâm niên/hợp đồng) + "Bảng thống kê dashboard"
(+ theo chức vụ) + "Cơ cấu lương"** → đây là BÁO CÁO TỔNG HỢP, không phải nguồn — sẽ dựng thành
SQL VIEW ở một migration sau, khi đã có dữ liệu thật để tính (`group by` trên `nhan_vien`/
`bang_luong`), không tạo bảng gốc ngay bây giờ. Map vào module `bao-cao`.

**Phiếu đề xuất điều chỉnh nhân sự (0 dòng)** → BỎ, rỗng hoàn toàn.

## Cụm 4 — base chưa có quyền (`V70gblwgkaq7M1sXk4ojD6QMpmc`)

Không tạo bảng nào cho "Nhân viên đến hạn HĐLĐ", "Sinh nhật nhân viên", "Lịch nghỉ phép" — đợi
sếp cấp quyền đọc base này rồi tra lại cấu trúc thật. Việc tạm thời: 2 thứ đầu có thể TÍNH ra được
từ cột đã có (`nhan_vien.ngay_vao_lam`/sinh nhật nếu thêm cột `ngay_sinh`, `hop_dong_lao_dong.den_ngay`)
— sẽ làm view khi có đủ cột, không cần đợi base đó.

## Tổng kết số bảng

- Giữ nguyên 9 bảng khung ở `0001` (không sửa).
- Thêm 1 migration `0002` với **18 bảng/ALTER mới**: `phong_ban`, ALTER `nhan_vien`, ALTER
  `ung_vien`, ALTER `don_tu`, `hop_dong_lao_dong`, `hop_dong_khac`, `thong_tin_gia_dinh_nhan_su`,
  `lo_trinh_thang_tien`, `khao_sat_nghi_viec`, `quy_phep_nam`, `don_lam_them_gio`,
  `dieu_chinh_sai_sot_cham_cong`, `dang_ky_nghi_thang`, `de_nghi_hau_can_cong_tac`,
  `don_xin_nghi_viec`, `hieu_qua_bsc`, `quan_ly_thuong_phat`, `dong_bo_luong_kinh_doanh`,
  `thue_tncn`, `khao_sat_enps`, `quan_ly_tai_san_cap_phat`, `muc_tieu_tuyen_dung`,
  `ngan_sach_tuyen_dung`, `kenh_tuyen_dung`, `hieu_suat_kenh_tuyen_dung`, `yeu_cau_tuyen_dung`,
  `lich_phong_van`, `offer_tuyen_dung`, `de_xuat_phe_duyet`, `theo_doi_onboarding`.
- Bỏ qua có chủ đích (rỗng hoặc quá ít dữ liệu, ghi rõ lý do ở trên): ~12 bảng Lark.
- Chưa làm được: 3 trang thuộc base chưa có quyền; các VIEW báo cáo (để sau khi có dữ liệu thật
  để tính).
