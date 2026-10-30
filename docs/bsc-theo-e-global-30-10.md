# BSC & mục tiêu cá nhân cho Omyn — rút từ mã nguồn e-global-ops (chị Lâm giao 30/10)

Nguồn: `e-global-ops-system-develop.zip` (Laravel 11 + React/Inertia, tài liệu chỉ đọc; không chạy, không chép code). Phần BSC nằm ở bảng `strategy_*` + `employee_kpis`, spec `docs/specs/SP-01-strategic-planning` và `SP-02-strategy-kpi-employee-split`.

## Mô hình (đã quyết bên e-global, áp lại nguyên tinh thần)
- Khung dùng chung nhiều năm: góc nhìn (4 góc BSC) → mục tiêu → mũi tên nhân quả giữa mục tiêu. Chỉ SỐ LIỆU theo năm: chỉ số (KPI) → 12 tháng kế hoạch/thực tế.
- Trọng số tương đối (trung bình có trọng số tự chuẩn hoá, không chặn lưu; nhóm ≠ 100% chỉ cảnh báo). Cách gộp: Cộng dồn / Trung bình / Cuối kỳ.
- Mục tiêu cá nhân: giao chỉ số cho từng người, mỗi người có kế hoạch/thực tế theo tháng riêng.
- Kế hoạch hành động gắn chỉ số: người thực hiện, người giao, người giám sát, ưu tiên P0-P3, ngày bắt đầu/kết thúc, tiến độ 0-100; xem Danh sách/Kanban/Gantt. Tiến độ KHÔNG cộng ngược vào số thực tế.
- Khoá tháng: tháng đã khoá thì không sửa số liệu.

## Đã làm (migration 0019, nhánh omyn-kpi)
Bảng: `bsc_goc_nhin` (có sẵn 4 góc nhìn), `bsc_muc_tieu`, `bsc_lien_ket`, `bsc_chi_so`, `bsc_chi_so_thang`, `bsc_chi_so_nguoi`, `bsc_nguoi_thang`, `bsc_ke_hoach_hanh_dong`, `bsc_khoa_thang`. FORCE RLS, test PGlite.

## Việc tiếp (lát BSC giao diện)
1. `/bsc` bản đồ chiến lược theo 4 góc nhìn + điểm % đạt từng mục tiêu (hàm thuần có test như `kpi.ts`).
2. `/bsc/so-lieu` nhập kế hoạch/thực tế theo tháng; khoá tháng.
3. `/bsc/cua-toi` mục tiêu cá nhân + kế hoạch hành động của tôi (nhân viên), lead thấy cấp dưới.
4. Nối "Hiệu quả làm việc BSC" (Lark 5.1) = điểm BSC cá nhân theo tháng.
Phần quảng cáo FB/TikTok, đơn hàng, sản phẩm, khách, kế hoạch tài chính của e-global KHÔNG thuộc phiên HRM này (chị nói để Coder làm).
