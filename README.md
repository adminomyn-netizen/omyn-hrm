# Omyn HRM

Hệ thống quản trị nhân sự nội bộ cho Omyn (Công ty Cổ phần OMYN Cosmetics). Next.js + Supabase,
deploy trên Vercel.

## Trạng thái hiện tại (12/10/2026)

- Khung giao diện đã dựng đủ 9 module, chạy bằng **dữ liệu mẫu** trong `src/lib/demo-data.ts`
  (chưa nối Supabase thật — chị chốt dùng dữ liệu giả để xem giao diện trước).
- Branding đang dùng **màu tạm + chữ "OMYN"** thay logo (folder "4.1 Bộ nhận diện thương hiệu"
  trên Drive đang trống). Khi có file logo thật, đổi ở `src/app/globals.css` (biến `--omyn-*`)
  và `src/components/layout/Sidebar.tsx`.
- Schema Supabase đã soạn sẵn ở `supabase/migrations/0001_khung_ban_dau.sql` và
  `supabase/seed.sql`, chưa chạy lên project thật (chờ token đăng nhập Supabase CLI).

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
2. Tạo project Supabase thật, `supabase link`, `supabase db push` để chạy migration.
3. Nối `src/lib/supabase/*` vào các trang (thay cho `demo-data.ts`).
4. Thêm trang đăng nhập + phân quyền theo vai trò thật.
5. Thay bộ nhận diện thương hiệu thật khi có.
