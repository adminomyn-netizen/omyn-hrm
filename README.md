# Omyn HRM

Hệ thống quản trị nhân sự nội bộ cho Omyn (Công ty Cổ phần OMYN Cosmetics). Next.js + Supabase,
deploy trên Vercel.

## Trạng thái hiện tại (12/10/2026)

- Khung giao diện đã dựng đủ 9 module, chạy bằng **dữ liệu mẫu** trong `src/lib/demo-data.ts`
  (chưa nối Supabase thật — chị chốt dùng dữ liệu giả để xem giao diện trước).
- Branding đang dùng **màu tạm + chữ "OMYN"** thay logo (folder "4.1 Bộ nhận diện thương hiệu"
  trên Drive đang trống). Khi có file logo thật, đổi ở `src/app/globals.css` (biến `--omyn-*`)
  và `src/components/layout/Sidebar.tsx`.
- Schema Supabase khung ban đầu ở `supabase/migrations/0001_khung_ban_dau.sql` (9 bảng tối giản)
  **đã được mở rộng** ở `supabase/migrations/0002_mo_rong_theo_nghiep_vu_thuc.sql` để bám sát
  cấu trúc app HR thật trên Lark Base của sếp Lâm (37 bảng, 4 base con) — đối chiếu chi tiết từng
  bảng ở `docs/mapping-lark-hr.md`. Cả 2 migration **CHƯA chạy** lên project thật (chờ token đăng
  nhập Supabase CLI) — `supabase/seed.sql` hiện chỉ khớp schema `0001`, cần viết thêm seed cho
  các bảng mới ở `0002` trước khi demo dữ liệu đầy đủ.
- **Còn 3 trang trong app HR Lark chưa tra được cấu trúc** ("Nhân viên đến hạn HĐLĐ", "Sinh nhật
  nhân viên", "Lịch nghỉ phép") vì base chứa chúng (`V70gblwgkaq7M1sXk4ojD6QMpmc`) trả lỗi thật
  `91403 you don't have permission` — cần sếp cấp quyền đọc base này rồi tra lại, không bịa.

## Các module và lý do lược so với app mẫu

App mẫu (hrm267.vercel.app) là HRM cho một nhà máy sản xuất. Omyn là công ty mỹ phẩm, chia theo
3 khối: Marketing / Kinh doanh / Vận hành-Kho-Tài chính. Đã lược:

- **Bỏ**: chấm công GPS + ca sản xuất 3 ca (Omyn không vận hành nhà máy).
- **Bỏ tạm**: đào tạo nội bộ (LMS) — thêm sau nếu cần.
- **Giữ nguyên/rút gọn**: hồ sơ nhân sự, chấm công giờ hành chính, đơn từ & phê duyệt, bảng
  lương & tạm ứng, tuyển dụng, đánh giá hiệu suất/KPI, báo cáo & biểu mẫu HCNS (căn cứ Bộ luật
  Lao động 2019 — Omyn là công ty cổ phần thật, cần báo cáo thật), phân quyền.

## Chạy thử ở máy

```bash
npm install
npm run dev
```

## Việc còn lại trước khi dùng thật

1. Đăng nhập Vercel CLI (`vercel login`) và Supabase CLI (`supabase login --token <token>`).
2. Tạo project Supabase thật, `supabase link`, `supabase db push` để chạy CẢ HAI migration
   (`0001` rồi `0002`).
3. Viết thêm seed cho các bảng mới ở `0002` (hiện `supabase/seed.sql` chỉ khớp `0001`).
4. Nối `src/lib/supabase/*` vào các trang (thay cho `demo-data.ts`) — làm theo từng cụm nghiệp vụ
   trong `docs/mapping-lark-hr.md`, không cần làm hết 1 lần.
5. Thêm trang đăng nhập + phân quyền theo vai trò thật, rồi viết RLS policy cho các bảng mới
   (đang chỉ bật RLS không có policy).
6. Xin sếp cấp quyền đọc base Lark `V70gblwgkaq7M1sXk4ojD6QMpmc` để tra cấu trúc 3 trang còn
   thiếu (HĐLĐ đến hạn / sinh nhật / lịch nghỉ phép), rồi bổ sung bảng tương ứng.
7. Dựng các VIEW báo cáo (phân nhóm độ tuổi/giới tính/thâm niên/hợp đồng, dashboard theo chức vụ,
   cơ cấu lương, báo cáo lương theo tháng) khi đã có dữ liệu thật để tính — xem cuối
   `docs/mapping-lark-hr.md`.
8. Thay bộ nhận diện thương hiệu thật khi có.
