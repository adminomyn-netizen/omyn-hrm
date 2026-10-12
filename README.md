# Omyn HRM

Hệ thống quản trị nhân sự nội bộ cho Omyn (Công ty Cổ phần OMYN Cosmetics). Next.js + Supabase,
deploy trên Vercel.

## Trạng thái hiện tại (12/10/2026)

- Đã deploy thật lên Vercel (region Singapore), nối Supabase thật (region Singapore) — **không
  còn dữ liệu mẫu tĩnh**, mọi trang đọc qua `src/lib/data.ts` (service role) từ DB thật đã seed.
  Đăng nhập 2 vai trò thật qua Supabase Auth (admin / kỹ thuật), có RSC đã verify qua trình duyệt
  thật cho cả hai tài khoản, local và production.
- Trang Chấm công có **đồng hồ realtime theo giờ Hồ Chí Minh** (`DongHoHCM.tsx`, client-only,
  tránh lệch giờ UTC của server Vercel) và **lưới lịch quản lý chấm công theo tháng** dựng bằng
  `react-big-calendar` (`LichChamCong.tsx`), điều hướng tháng trước/sau qua URL
  (`/cham-cong?nam=&thang=`) để luôn lấy dữ liệu mới từ server.
- Đã thiết kế logo đặt chỗ: biểu trưng giọt serum cách điệu (`src/components/brand/Logo.tsx`,
  favicon ở `src/app/icon.svg`) — **đây là logo do AI thiết kế tạm, chưa phải bộ nhận diện
  chính thức của Omyn** (folder "4.1 Bộ nhận diện thương hiệu" trên Drive vẫn đang trống). Khi có
  file logo thật, đổi tại `src/components/brand/Logo.tsx` + `src/app/icon.svg`, màu thương hiệu
  ở biến `--omyn-*` trong `src/app/globals.css`.
- Schema Supabase khung ban đầu ở `supabase/migrations/0001_khung_ban_dau.sql` (9 bảng, **đã
  chạy lên DB thật + đã seed**) được mở rộng ở
  `supabase/migrations/0002_mo_rong_theo_nghiep_vu_thuc.sql` để bám sát cấu trúc app HR thật trên
  Lark Base của sếp Lâm (37 bảng, 4 base con) — đối chiếu chi tiết từng bảng ở
  `docs/mapping-lark-hr.md`. Migration `0002` **soạn xong nhưng CHƯA chạy lên DB thật** — đang
  chờ sếp xác nhận nguồn nhân sự thật (hồ sơ Drive hay import từ Lark Base) trước khi đổ dữ liệu
  thật của người, và `supabase/seed.sql` hiện chỉ khớp schema `0001`.
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

1. ~~Đăng nhập Vercel CLI, Supabase CLI, GitHub CLI~~ — xong, auto-deploy khi push `main`.
2. ~~Chạy migration `0001` + seed lên DB thật~~ — xong. Migration `0002` soạn xong, **chờ sếp
   chốt nguồn nhân sự thật** rồi mới `supabase db push` + viết seed cho các bảng mới.
3. Wire 2 nút Duyệt/Từ chối ở `/don-tu` vào server action thật (hiện là nút tĩnh, chưa nối DB).
4. Thêm kiểm tra quyền truy cập phía server cho `/cai-dat` (hiện chỉ ẩn khỏi menu, chưa chặn
   thật nếu gõ thẳng URL).
5. Viết RLS policy cho mọi bảng (đang chỉ bật RLS, chưa có policy — mọi trang đọc qua service
   role nên tạm ổn, nhưng cần thiết khi mở client-side truy vấn trực tiếp sau này).
6. Xin sếp cấp quyền đọc base Lark `V70gblwgkaq7M1sXk4ojD6QMpmc` để tra cấu trúc 3 trang còn
   thiếu (HĐLĐ đến hạn / sinh nhật / lịch nghỉ phép), rồi bổ sung bảng tương ứng.
7. Dựng các VIEW báo cáo (phân nhóm độ tuổi/giới tính/thâm niên/hợp đồng, dashboard theo chức vụ,
   cơ cấu lương, báo cáo lương theo tháng) khi đã có dữ liệu thật để tính — xem cuối
   `docs/mapping-lark-hr.md`.
8. Thay logo đặt chỗ bằng bộ nhận diện thương hiệu chính thức khi sếp gửi file thật.
