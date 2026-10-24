# OMYN HRM — Hệ thống thiết kế (design.md)

Tài liệu này là **nguồn chuẩn duy nhất** cho giao diện OMYN HRM. Ai thêm trang, thành phần hay sửa giao diện đều đọc và làm theo đây. Mọi con số dưới đây lấy từ mã thật (`src/app/globals.css`, `src/components/**`); nếu mã và tài liệu lệch nhau thì sửa cho khớp, không để hai bên khác nhau.

- Bản thiết kế gốc (Claude Design): https://claude.ai/artifact/2GmrJHfvPPQWEXRtHAa1pn (riêng tư) và 7 ảnh xuất ở `hrm-omyn/thiet-ke-moi/` (mở `xem-truoc-tat-ca.html`).
- Chủ dự án chốt hướng này ngày 22/10/2026: tông **lục đậm + teal** (đổi 24/10/2026 theo phần mềm chấm công mẫu; trước đó là vàng champagne + espresso, không dùng xanh), có **chế độ tối**.

---

## 1. Nguyên tắc

1. **Sang nhưng gọn.** Nền sáng lạnh, mực lục đậm, một dải teal làm điểm nhấn. Mỗi trang có **một** điểm nhấn chính (hộp lục đậm ánh teal, hoặc nút teal).
2. **Thân thiện với người không rành công nghệ.** Chữ tiếng Việt tự nhiên, câu ngắn, xưng "bạn", nói rõ việc cần làm kế tiếp. Trạng thái rỗng và lỗi luôn chỉ cách xử lý.
3. **Bấm là ăn.** Mọi thao tác phải có phản hồi trong ~100 ms: khung chờ hiện ngay, thao tác đổi trên màn hình trước rồi mới đồng bộ máy chủ (mục 10).
4. **Dữ liệu dày thì xếp thành bảng/hàng, không xếp thành lưới thẻ giống nhau.** Thẻ chỉ dùng khi nó là một *vật thể kéo được* (ứng viên) hoặc một *điểm nhấn* (hộp chấm công).
5. **Mọi thứ đều dùng được trên điện thoại 390 px, không cuộn ngang trang.**
6. **Không "AI hoá"** (mục 12): không tím–lam–hồng, không emoji làm biểu tượng, không bóng nặng, không bo tròn đồng loạt.

---

## 2. Thương hiệu và giọng điệu

- Logo: chữ **OMYN** (Cormorant Garamond 600, giãn chữ 0,2 em) + hạt vàng nhỏ. Tệp: `public/brand/*.svg` (dựng bằng `scripts/dung-logo.mjs`). Trên nền tối dùng `logo-tren-nen-toi.svg` (chữ ngà, hạt vàng sáng). Logo giữ **phẳng** (không gradient trong logo).
- Giọng: điềm tĩnh, rõ ràng, không hô hào. Không dùng dấu chấm than, "Chào mừng bạn đến với…", "Oops", "Đã xảy ra lỗi" trần trụi, "Vui lòng" lặp lại, chữ in hoa cả câu.
- Định dạng: ngày `02/11/2026`, giờ 24h `08:30`, tiền `13.500.000 đ` (rút gọn ở chỉ số: `13,5 triệu`). Giờ luôn theo **giờ Hồ Chí Minh** (máy chủ chạy UTC nên tính tường minh `Asia/Ho_Chi_Minh`).
- Lời chào trang Tổng quan đổi theo giờ: sáng (<11h), trưa (<14h), chiều (<18h), tối.

---

## 3. Màu

Định nghĩa trong `src/app/globals.css` (`:root` cho sáng, `.dark` cho tối). **Luôn dùng token (lớp `bg-giay`, `text-muc-2`, `border-vien`…), không gõ mã màu thô** trong thành phần, trừ ô hero tối và biểu đồ SVG dùng mã vàng/ngà cố định (mục 3.3).

### 3.1 Bảng token (đổi 24/10/2026: lục đậm + teal theo phần mềm chấm công mẫu — thay bảng vàng–espresso cũ)

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--giay` | `#F4F7F7` | `#0A1716` | nền trang |
| `--giay-sang` | `#FFFFFF` | `#102321` | bề mặt: ô nhập, popup, thanh đầu trang |
| `--giay-tram` | `#E8F0F0` | `#17302D` | vùng lõm, hover hàng, cột kanban |
| `--muc` | `#12302D` | `#E3F2EF` | chữ chính |
| `--muc-2` | `#3F5653` | `#B5CDC9` | chữ phụ |
| `--muc-3` | `#566B68` | `#8FADA8` | chữ gợi ý, nhãn nhỏ |
| `--vien` | `#D7E3E1` | `#1F3A36` | đường kẻ mảnh (trang trí) |
| `--vien-dam` | `#7A908D` | `#5F8B84` | viền ô nhập, nút phụ (≥ 3:1) |
| `--nhan` | `#0F766E` | `#4CC2B1` | liên kết, focus, biểu tượng nhấn |
| `--nhan-dam` | `#0B5A54` | `#7FDCCF` | chữ teal trên nền nhạt/nhãn |
| `--nhan-nhat` | `#D6F2E8` | `#123B36` | nền nhãn "tốt", avatar, mục chọn |
| `--loi` / `--loi-nen` | `#B42318` / `#FDECEA` | `#F5A097` / `#3B1C19` | lỗi, từ chối |
| `--canh-bao` / `--canh-bao-nen` | `#A8520C` / `#FEF1DE` | `#F0B36A` / `#3A2A14` | chờ duyệt, cảnh báo |
| `--chu-tren-vang` | `#FFFFFF` | `#FFFFFF` | chữ trên nút/ô nền teal (**luôn trắng**, cả chế độ tối) |
| `--menu` | `#00453D` | `#03211D` | nền menu trái (**luôn lục đậm**) |
| `--menu-chu`, `--menu-chu-phu`, `--menu-sang`, `--menu-nhan` | `#CFE5E1`, `#93BAB3`, `#FFFFFF`, `#FBBF24` | (giữ) | chữ/biểu tượng trên menu (nhấn hổ phách) |
| `--menu-chon`, `--menu-hover`, `--menu-vien` | trắng 13% / 7% / 12% | (giữ) | nền mục chọn, hover, đường kẻ menu |

Tên token cũ (`vang`, `espresso`, `nut-vang`…) được giữ để không phải sửa từng thành phần: nay `vang` = màu nhấn teal. Thang `slate` của Tailwind được đổi sang xám lục (`--color-slate-*`); trong `.dark` thang này đảo chiều.

### 3.2 Gradient (dải teal / lục đậm)

| Token | Giá trị | Dùng |
|---|---|---|
| `--gradient-vang` | `135deg #0E8074 → #0F766E → #0B5F58` | nút chính, avatar, ngày/tháng đang chọn, thanh tiến độ, huy hiệu số đếm |
| `--gradient-vang-hover` | sáng hơn ~6% | nút chính khi rê chuột |
| `--gradient-toi` + `.nen-toi` | `155deg #0B5A50 → #00453D → #002B26` + quầng teal góc phải trên | hộp hero (chấm công hôm nay), panel đăng nhập |
| `--gradient-nen` + `.nen-trang` | trắng → xám lục nhạt (dọc) | nền trang, thanh bên đăng nhập |
| `.chu-vang` | chữ gradient mint | dòng nhấn trên nền tối |

**Cấm** gradient có sắc tím/xanh lam/hồng (script `kiem-tra-thiet-ke` chặn); lục–teal là tông chính.

### 3.3 Mã cố định được phép
Biểu đồ SVG và hộp hero tối dùng mã cố định vì luôn nằm trên nền lục đậm: mint `#7FE3D2`, teal `#14938A`; chữ `#E3F2EF`, phụ `#B5CDC9`, `#8FB5AE`.

### 3.4 Tương phản
`npm run doi-chieu` kiểm các cặp chữ/nền ở **cả hai chế độ** (≥ 4,5 : 1, viền ô nhập ≥ 3 : 1). Cặp bị trượt làm `npm run kiem-tra` đỏ. Quy tắc nhớ: chữ vàng trên nền be/nhãn dùng `--nhan-dam`, không dùng `--nhan`; chữ trên nền vàng dùng `--chu-tren-vang`.

---

## 4. Chữ

- **Hiển thị: cùng họ Be Vietnam Pro** (600, khoảng chữ −0,015 em, KHÔNG nghiêng) — tiêu đề trang, lời chào, tiêu đề popup, câu trạng thái rỗng, nhãn tháng trên lịch. Đã bỏ serif Cormorant và mọi chữ nghiêng (22/10, chủ app: trông "AI"). Chỉ logo OMYN còn dùng chữ Cormorant (đã chuyển thành đường, không tải font).
- **Nội dung: Be Vietnam Pro** (400/500/600) — mọi chữ còn lại. Có tập con `vietnamese`. Số trong bảng/chỉ số dùng `tabular-nums`.
- Tải qua `next/font/google` (tự host, `display: swap`) trong `src/app/layout.tsx`; biến `--font-serif`, `--font-sans`.

Thang cỡ chữ:

| Vai trò | Cỡ / ghi chú |
|---|---|
| Tiêu đề trang (`TieuDeTrang`) | sans 600, 36 px (điện thoại) / 44 px (máy tính), dòng 1,1 |
| Lời chào Tổng quan (gọi họ tên đầy đủ) | sans 600 (không nghiêng) 40 / 52 px |
| Tiêu đề popup | sans 600 30 px |
| Chỉ số lớn | sans 30–32 px, 500 |
| Đồng hồ chấm công | sans 56 px, 500 |
| Tiêu đề khu (`MucTrang`) | sans 15 px, 600 |
| Nội dung / bảng | 14–15 px; ô nhập 15–16 px (16 px trên điện thoại để iOS không tự phóng) |
| Nhãn nhỏ viết hoa (`.nhan-muc`) | 12 px, 500, giãn 0,08 em |
| Chú thích | 12–13 px |

Tiếng Việt cần `line-height` ≥ 1,5 cho đoạn văn và ≥ 1,1 cho tiêu đề có dấu.

---

## 5. Khoảng cách, bo góc, bóng, biểu tượng, chuyển động

- **Khoảng cách** thang 4 px (4/8/12/16/24/32/48). Lề trang: 16 px (điện thoại), 48 px (máy tính). Giữa các khu lớn `space-y-10` (40 px).
- **Bo góc** (token trong `@theme`): `rounded-tag` 5 px (nhãn), `rounded-nho` 8 px (nút, ô nhập, mục menu), `rounded-the` 10 px (thẻ, danh sách thả xuống), `rounded-vua` 12 px (hộp nổi: thông báo, menu người dùng), `rounded-hop` 14 px (popup). Hộp hero tối 14 px. Avatar/chấm tròn dùng `borderRadius: 9999` inline.
- **Bóng**: mặc định không bóng, tách bằng đường kẻ 1 px `--vien`. Chỉ hộp nổi và popup có bóng: `0 24px 60px rgba(0,0,0,.30)` (popup), `0 14px 32px rgba(42,34,24,.18)` (danh sách thả xuống), `0 18px 40px rgba(42,34,24,.22)` (lịch). Nút vàng có bóng trong nhẹ (`.nut-vang`).
- **Biểu tượng**: `lucide-react`, `strokeWidth` 1,5–1,6, cỡ 16/18/19/20 px. Không để trong ô màu tròn làm trang trí. **Cấm emoji.**
- **Chuyển động**: 150 ms `ease-out` cho màu/độ rộng; tôn trọng `prefers-reduced-motion` (đã có trong `globals.css`). Không hiệu ứng nảy.

---

## 6. Bố cục

```
┌────────────┬──────────────────────────────────────────────┐
│  MENU TRÁI │  ĐẦU TRANG 56 px  [⌘K tìm] … [☾] [🔔] [avatar] │
│  248 / 72  ├──────────────────────────────────────────────┤
│  (tối)     │  NỘI DUNG  (px 48, py 32; điện thoại px 16)   │
└────────────┴──────────────────────────────────────────────┘
```

- **Khung dùng chung** `src/app/(app)/layout.tsx`: dựng *một lần*, đứng yên khi đổi trang; chỉ phần nội dung đổi (kèm `loading.tsx`).
- **Menu trái** (`Sidebar`): nền lục đậm cả khi giao diện sáng; nhóm có nhãn viết hoa nhỏ; mục đang mở nền trắng 13% + biểu tượng hổ phách; **số đếm** dải teal cạnh mục (tài khoản chờ duyệt, đơn chờ duyệt, ứng viên mới — lấy từ `/api/thong-bao`, ghi qua `lib/dem-menu.ts`). Thu gọn còn 72 px (nhớ lựa chọn trong `localStorage`); rê chuột hiện tên + mô tả. Điện thoại: ngăn kéo `MobileNav` cùng kiểu + **thanh tab dưới cùng** (xem 7.9).
- **Đầu trang** (`DauTrang`): cao 56 px. Trái: ô tìm (`⌘K`/`Ctrl+K`, `TimKiem`). Phải: nút sáng/tối, chuông thông báo, avatar + tên. Bấm avatar: **Chỉnh sửa thông tin** (đổi tên, đổi mật khẩu — cần mật khẩu hiện tại) và **Đăng xuất**. Không hiện nhãn vai trò.
- **Đầu mỗi trang** (`TieuDeTrang`): tiêu đề sans + một dòng phụ (đếm), hành động chính bên phải (nút teal + nút phụ).
- **Hàng chỉ số** (`HangChiSo`/mục chỉ số ở Tổng quan): số lớn + nhãn nhỏ, ngăn bằng đường kẻ dọc 1 px, **không thẻ**. Có thể kèm `DuongXuHuong` (đường nhỏ 84×34).
- **Khu** (`MucTrang`): tiêu đề nhỏ đậm + đường kẻ mảnh, hành động nhỏ bên phải ("Xem tất cả").
- **Lưới trong trang**: dùng `grid` 12 cột (`lg:col-span-*`); **mọi con của grid có `min-w-0`** để nội dung nowrap/bảng không đẩy tràn ngang trên điện thoại (`MucTrang` đã có sẵn).

---

## 7. Thành phần

Tất cả ở `src/components/ui/` trừ khi ghi khác. Lớp CSS dùng chung ở `ui/dinh-dang.ts`.

### 7.1 Nút
- **Chính** (`NUT_CHINH` = `.nut-vang`): dải teal, chữ trắng `--chu-tren-vang`, cao 40–50 px. Mỗi màn tối đa **một** nút chính.
- **Phụ** (`NUT_PHU`): viền `--vien-dam`, nền trong, hover `--giay-tram`.
- **Chữ** (`NUT_CHU`, `NUT_CHU_NGUY`): chữ teal/đỏ gạch chân khi hover, dùng trong bảng ("Sửa", "Xoá").
- **Nguy hiểm**: nền `--loi`, chữ trắng (xoá hẳn).
- Nút gọi Server Action dùng `type="button"` + `onClick` (Next 16 ở đây huỷ action khi `<form>` nổ submit thật; ngoại lệ đã kiểm: nút chấm công và đăng nhập/đăng ký).

### 7.2 Ô nhập, `Chon`, `NgayChon`
- Ô nhập: cao 44 px, nền `--giay-sang`, viền `--vien-dam`, bo 8 px, focus viền `--nhan` + vòng `nhan/25`. Nhãn phía trên 13 px, `*` sau nhãn bắt buộc.
- **`Chon`** (dropdown): **thay mọi `<select>`**. Tích chọn, bàn phím (↑↓, Enter/Space, Esc, gõ chữ cái đầu), `aria-haspopup="listbox"`, báo "bắt buộc" bằng hộp thoại trình duyệt. Danh sách vẽ qua **portal ở `<body>`** (`noi.ts`) nên **không bị bảng/popup cắt**; tự mở lên nếu bên dưới hết chỗ.
- **`NgayChon`** (chọn ngày): **thay mọi `<input type="date">`**. Bấm "Tháng 11" hoặc "2026" để chọn nhanh tháng/năm (lưới 12 ô, đổi 12 năm/lượt), nút Hôm nay / Xoá ngày, ngày chọn là ô vàng, hôm nay có viền vàng. Hiển thị `dd/mm/yyyy`, giá trị gửi đi `YYYY-MM-DD`.
- Script quét thiết kế **chặn** `<select>` và `type="date"` mới.

### 7.3 Bảng (`Table.tsx`/bảng tự dựng)
Tiêu đề chữ hoa nhỏ `--muc-3`; hàng cao 52–64 px; kẻ ngang `--vien`; hover `--giay-tram/60`; số căn phải + `tabular-nums`; cột hành động căn phải. Bảng rộng nằm trong `overflow-x-auto`. Trạng thái rỗng: một câu sans cỡ 24 px + việc nên làm.

### 7.4 Nhãn trạng thái (`NhanTrangThai`)
Chữ 12 px/500 trên nền nhạt cùng sắc, bo 5 px, không viền. Bốn kiểu: `tot` (nhan-nhat/nhan-dam), `cho` (canh-bao), `loi` (loi), `tram` (giay-tram/muc-2).

### 7.5 Popup (`Hop`)
Rộng 576 px (hoặc `rong` 768 px), bo 14 px, tiêu đề sans 600 30 px trên nền gradient `nhan-nhat → trong suốt`, nội dung `px-7 py-6`. Đóng bằng Esc / bấm nền / nút X; giữ tiêu điểm trong hộp, trả về chỗ cũ khi đóng; khoá cuộn nền. **Thêm/sửa/xoá luôn là popup, không sang trang mới.**

### 7.6 Hộp tìm nhanh (`layout/TimKiem`)
`⌘K`/`Ctrl+K` hoặc bấm ô tìm. Quản lý tìm nhân viên, ứng viên, tin tuyển dụng (gọi `/api/tim-kiem` sau 180 ms ngừng gõ) và nhảy tới trang; nhân viên chỉ nhảy trang. ↑↓ chọn, Enter đi, Esc đóng.

### 7.7 Chuông thông báo (`layout/DauTrang`)
Thông báo **thật** suy ra từ dữ liệu (không có bảng riêng): quản lý thấy tài khoản chờ duyệt, đơn chờ duyệt, ứng viên mới 7 ngày, tin sắp/đã hết hạn nộp; nhân viên thấy kết quả duyệt đơn và nhắc chưa chấm công. Tải *sau khi trang hiện* (`/api/thong-bao`), làm mới khi quay lại tab và mỗi 90 giây. "Đã đọc" nhớ theo trình duyệt.

### 7.8 Thanh tab dưới cùng cho điện thoại (`layout/ThanhTabDuoi`)
Hiện dưới 1024 px, cố định ở đáy, cao 62 px + vùng an toàn của máy; tab đang mở có gạch vàng mảnh trên đầu, chữ `--nhan-dam`; số đếm là huy hiệu vàng nhỏ. Nội dung trang chừa đáy `5,5 rem` để không bị che.
- **Nhân viên:** Hôm nay (chấm công) · Đơn từ · Thông báo (mở chuông, kèm số chưa đọc) · Tôi (mở menu avatar: sửa thông tin, đăng xuất).
- **Quản lý:** Tổng quan · Nhân sự · Tuyển dụng · Đơn từ · Menu (mở ngăn kéo đủ mọi mục).
Các tab "Thông báo/Tôi/Menu" bắn sự kiện cửa sổ (`omyn-mo-thong-bao`, `omyn-mo-tai-khoan`, `omyn-mo-menu`) để mở đúng hộp ở đầu trang; số đếm lấy từ `lib/dem-menu.ts`.

### 7.9 Khác
- `ThanhTyLe`: nhãn + số, thanh mảnh 6 px dải vàng.
- `VongChamCong`: vòng tiến độ SVG nét dải vàng (`dashboard/`).
- `DuongXuHuong`: đường xu hướng nhỏ.
- `Logo`/`LogoMark`: tự đổi bản sáng/tối bằng `dark:`.
- Lịch chấm công (react-big-calendar) khoác lại bằng token ở cuối `globals.css`, tải trễ (`LichChamCongTre`).

---

## 8. Màn hình mẫu

| Màn | Cấu trúc |
|---|---|
| **Đăng nhập / Đăng ký** | Trái (≥1024 px): mảng `nen-toi` có hoa văn 4 vòng tròn mảnh, câu sans 52 px có dòng `chu-vang`. Phải: tiêu đề sans 44 px, ô có biểu tượng vàng (`OTaiKhoan`), mật khẩu có nút hiện/ẩn, nút vàng 50 px. Điện thoại: chỉ cột phải. |
| **Tổng quan** | Lời chào theo giờ → hộp hero tối (vòng chấm công 5/7 + số đúng giờ/đi muộn/chưa chấm + biểu đồ cột nửa giờ) bên trái, "Việc cần bạn" bên phải → hàng 4 chỉ số kèm đường xu hướng → "Nhân sự theo khối" và "Đang tuyển" (thanh tiến độ 6 bước). Có khu "Tài khoản chờ duyệt" lên đầu khi có. |
| **Hồ sơ nhân sự** | `TieuDeTrang` + tab lọc có đếm + ô tìm → bảng có avatar chữ cái → popup thêm/sửa/xoá. Mở sẵn popup bằng `?them=1`, điền sẵn tìm bằng `?q=`. |
| **Tuyển dụng** | Chọn tin (nút dạng viên) → phễu mảnh → **bảng 7 cột theo bước, kéo thẻ sang cột khác để đổi bước** (lạc quan), bấm thẻ để sửa/xoá (điện thoại: bấm thẻ rồi chọn bước). `?tin=` chọn tin, `?dang=1` mở popup đăng tuyển. |
| **Chấm công (nhân viên)** | Đồng hồ lớn giữa trang, nút tròn teal 184 px có hai vòng mảnh (đổi sang xám ngà khi đã vào, "Đã xong hôm nay" khi đã ra), giờ vào/ra, dải 7 ngày của tuần. |
| **Chấm công (quản lý)** | Đồng hồ + hàng chỉ số + lịch tháng + bảng hôm nay. |
| **Đơn từ** | Tab "Chờ duyệt / Tất cả" (quản lý) hoặc "Nộp đơn mới" (nhân viên, popup). Duyệt/Từ chối đổi ngay trên dòng. |
| **Lương, Đánh giá, Báo cáo, Kỹ thuật, Cài đặt** | `TieuDeTrang` + `HangChiSo` + `MucTrang` + bảng/danh sách. Nút chưa làm xong để `disabled` có chú thích ("Sắp có"), không làm nút giả. |

---

## 9. Chế độ tối

- Bật bằng class `.dark` trên `<html>`; nút ở đầu trang; lựa chọn lưu `localStorage["omyn-hrm-che-do"]` (`"toi"`); script nhỏ trong `<head>` bật class **trước khi vẽ** nên không nháy sáng→tối. Mặc định **sáng**.
- Chỉ đổi giá trị token (mục 3.1). Thành phần không viết riêng cho tối, trừ chỗ cần hai bản ảnh (logo) dùng `dark:hidden` / `hidden dark:block`.
- Menu trái và hộp hero luôn tối ở cả hai chế độ (menu tối hơn một chút ở chế độ tối).

---

## 10. Tốc độ và phản hồi tức thì

Chủ dự án yêu cầu "bấm là ăn liền, không khựng". Cách làm (đừng phá):

1. **Khung đứng yên**: menu + đầu trang nằm trong `(app)/layout.tsx`, không dựng lại khi đổi trang.
2. **Khung chờ tức thì**: `(app)/loading.tsx` hiện ngay khi bấm (`data-dang-tai`), cùng bố cục trang thật.
3. **Một lần hỏi Auth mỗi yêu cầu**: `layNguoiDungHienTai` bọc `React.cache`; middleware kiểm chữ ký JWT cục bộ (`getClaims`), chỉ hỏi Auth khi token cho thấy "chưa duyệt". Quyền thật vẫn kiểm ở từng trang/hành động.
4. **Thông báo/số đếm tải sau** khi trang đã hiện.
5. **Thao tác lạc quan**: duyệt đơn, đổi bước ứng viên (kéo thả), chấm công vào/ra đổi trên màn hình ngay; lỗi thì tự hoàn lại và hiện thông báo.
6. **Thành phần nặng tải trễ** (lịch chấm công).
7. Số đo trên bản chạy thật (22/10/2026): TTFB ~37 ms; bấm menu đổi URL + khung chờ 10–22 ms; nội dung 370–470 ms.

---

## 11. Truy cập (a11y)

- Dùng đúng phần tử: `<button>`, `<a href>`, `<input>` + `<label htmlFor>`; không `onClick` trên `div/span`.
- Nút chỉ có biểu tượng có `aria-label`; biểu tượng trang trí `aria-hidden`.
- Popup `role="dialog" aria-modal`, danh sách thả xuống `role="listbox"`/`option`, hộp tìm `role="combobox"`; focus trap + trả focus; Esc đóng.
- Màu không là cách duy nhất truyền thông tin (nhãn trạng thái luôn có chữ).
- Mục tiêu bấm ≥ 40 px (nút chấm công 184 px).

---

## 12. Tránh "AI hoá" — và máy canh giúp

Cấm: gradient tím/lam/hồng, thẻ bo tròn lớn đồng loạt (`rounded-2xl|3xl|full`), bóng nặng (`shadow-lg|xl|2xl`), mờ kính (`backdrop-blur`), bố cục 3 thẻ giống nhau, emoji làm biểu tượng, chữ mẫu ("Lorem ipsum", "John Doe"), phông Inter/Roboto/Arial/Poppins, `<select>`/`type="date"` mặc định.

`npm run kiem-tra` chạy **eslint + tsc + vitest + quét thiết kế + đối chiếu tương phản**; build đỏ nếu vi phạm. Ngoại lệ (nếu thật sự cần) ghi ở `.kiem-tra-thiet-ke-cho-phep.json` kèm lý do, theo từng tệp và từng luật. Hiện: 0 ngoại lệ.

---

## 13. Thêm trang / thành phần mới — danh sách kiểm

1. Trang nội bộ đặt trong `src/app/(app)/<ten>/page.tsx`; mục menu thêm ở `src/lib/nav.tsx` (có `icon`, `moTa`, `chiVaiTro`).
2. Mở đầu trang bằng `yeuCauVaiTro([...])` hoặc `layNguoiDungDaDuyet()` **trước** khi đọc dữ liệu.
3. Bố cục: `TieuDeTrang` → `HangChiSo` (nếu có số) → `MucTrang` + bảng/danh sách. Không thẻ giống nhau xếp hàng.
4. Mọi biểu mẫu: popup `Hop`; ô chọn dùng `Chon`; ngày dùng `NgayChon`; nút `type="button"`.
5. Mọi con của `grid` có `min-w-0`; bảng rộng nằm trong `overflow-x-auto`.
6. Thao tác hay dùng: làm lạc quan + hoàn lại khi lỗi.
7. Chỉ dùng token màu; kiểm cả chế độ tối.
8. Chạy `npm run kiem-tra`, rồi mở trên điện thoại 390 px kiểm không cuộn ngang.
9. Cập nhật tài liệu này nếu thêm thành phần/quy ước mới.

---

## 14. Lịch sử

- 22/10/2026 — Thêm thanh tab dưới cùng cho điện thoại; xoá toàn bộ dữ liệu mẫu (chỉ còn 5 khối theo sơ đồ OMYN, 2 tài khoản đăng nhập, vai trò/quyền).
- 24/10/2026 — Đổi bảng màu sang lục đậm + teal (mục 3); các dòng "vàng/espresso" còn lại ở mục 7–9 hiểu là màu nhấn teal/lục đậm tương ứng (tên token giữ nguyên).
- 22/10/2026 — Chốt hệ thiết kế vàng champagne + espresso, gradient vàng, chế độ tối; áp toàn bộ trang theo bản thiết kế Claude Design (menu tối, ô tìm ⌘K, hộp hero, bảng kéo thả tuyển dụng, đăng nhập mới); `Chon`/`NgayChon` qua portal.


## 9. Bổ sung 22/10/2026 — khối, lương, đồng hồ, lịch chấm công
- **Lời chào + đồng hồ HCM** (`LoiChaoDongHo`): giờ thật theo Asia/Ho_Chi_Minh, nhảy từng giây. Mốc chào: 05–11 giờ sáng, 11–13 giờ trưa, 13–18 giờ chiều, còn lại buổi tối.
- **Khối** (`/khoi`, `DanhSachKhoi`): thêm/sửa/xoá bằng popup; không xoá được khi khối còn nhân viên hoặc tin tuyển dụng.
- **Lương** (`/luong`, chỉ Quản trị; nhân viên chỉ thấy phiếu của mình đã duyệt/đã chi): 3 tab Bảng lương · Thỏa thuận lương · Tham số. Kỳ đi Mở → Đã lập → Đã kiểm → Đã duyệt → Đã chi; từ Đã kiểm trở đi khoá sửa. Duyệt kỳ chỉ được khi mọi tham số pháp lý đã được Quản trị xác nhận. Thành phần: `BangLuongKy`, `ChiTietDongLuong` (xem kết quả tức thì), `ThoaThuanLuong`, `ThamSoLuong`, `PhieuLuongCuaToi`, ô nhập `OTien`, công tắc `Gat`.
- **Công tính lương theo ca đã định**, không theo giờ bấm: lịch hiển thị giờ bấm thực tế, nhưng công = số ngày đi làm (ca hành chính 08:00–17:00); đi muộn chỉ là nhãn trạng thái. Giờ tăng ca nhập tay ở dòng lương.
- **Lịch chấm công** (`BoLocThoiGian`): chọn thẳng tháng/năm bằng ô chọn, nút tháng trước/sau, "Tháng này", hoặc tab "Tuỳ chỉnh khoảng ngày" (tối đa 93 ngày, hiện bảng Ngày · Nhân viên · Bộ phận · Giờ vào · Giờ ra · Trạng thái). Ô sự kiện trên lịch: dòng 1 "Tên - Bộ phận", dòng 2 "08:20 – 17:35"; quá chỗ thì "+N người nữa".
- **Đăng ký chọn phòng ban** (22/10, chốt lại): form chỉ có ô Phòng ban (danh sách khối), không có ô vị trí và không có ghi chú phụ. Lựa chọn chỉ là YÊU CẦU (`app_metadata.yeu_cau_khoi_id`), không cấp quyền. Bảng chờ duyệt hiện "Phòng ban: …", ô hồ sơ mặc định "Tạo hồ sơ mới theo đăng ký"; phòng ban **Hành chính nhân sự** có quyền Quản trị nên ô vai trò mặc định là Quản trị (người duyệt vẫn bấm xác nhận).
- **Quyền Quản trị đặt cứng theo vị trí** (23/10/2026): khối Hành chính nhân sự và chức vụ Tổng giám đốc, Phó tổng giám đốc, Giám đốc, Phó giám đốc tự có quyền Quản trị; không còn trang Cài đặt và phân quyền. Duyệt tài khoản chỉ Kỹ thuật làm (ô vai trò: Theo vị trí hoặc Kỹ thuật). Chỉ Kỹ thuật được đưa hồ sơ vào các vị trí này.
- **Menu avatar** (bấm ảnh đại diện): họ và tên đầy đủ, vị trí (chức danh · phòng ban · vai trò Quản trị/Kỹ thuật nếu có), email.

- **Kỹ thuật = quyền cao nhất** (22/10): làm mọi thứ và xem mọi số liệu, kể cả Lương (kỳ, thỏa thuận, tham số, xác nhận tham số). Không thể hạ tài khoản Kỹ thuật/Quản trị cuối cùng.

- **Chức vụ chọn dropdown** (22/10): biểu mẫu nhân viên dùng ô chọn Chức vụ (Tổng giám đốc, Phó tổng giám đốc, Giám đốc, Phó giám đốc, Trưởng bộ phận, Leader, Chuyên viên, Nhân viên, Thực tập sinh); giá trị cũ ngoài danh sách vẫn giữ làm một lựa chọn. Danh sách ở `src/lib/chuc-vu.ts`.

- **Lãnh đạo = như Hành chính nhân sự** (22/10): hồ sơ có chức vụ Tổng giám đốc, Phó tổng giám đốc, Giám đốc, Phó giám đốc, hoặc phòng ban Hành chính nhân sự, thì ô vai trò khi duyệt tài khoản gợi ý Quản trị (người duyệt vẫn bấm xác nhận; hệ thống KHÔNG tự nâng quyền khi lưu chức vụ). Hàm `nenLaQuanTri` ở `src/lib/chuc-danh.ts`.

- **Khối có cột Vị trí** (22/10): thay cột Mô tả; vị trí khai báo ở khối + chức vụ của nhân viên đang làm trong khối tự được gộp vào. Ô Chức vụ trong biểu mẫu nhân viên tự hiện vị trí của khối đang chọn trước, rồi các cấp chuẩn.
- **Chỉ tài khoản Kỹ thuật** xem được mục Kỹ thuật và mục "Toàn cảnh số liệu" ở Tổng quan; Quản trị và Nhân viên không thấy menu, gõ thẳng đường dẫn thì bị đưa về Chấm công.

- **Tổng quan ai cũng thấy, nội dung theo tài khoản** (22/10): Nhân viên thấy việc của chính mình (chấm công hôm nay, công tháng, đơn của tôi, hồ sơ, phiếu lương mới nhất); Quản trị thấy số liệu công ty; Kỹ thuật thấy thêm danh sách tài khoản chờ duyệt. Duyệt/từ chối tài khoản CHỈ Kỹ thuật (thông báo và đếm cũng chỉ Kỹ thuật). Đăng nhập xong ai cũng vào Tổng quan.

## 10. Bổ sung 24/10/2026 — bảng công tháng, ngày lễ, hướng dẫn
- **Bảng công tháng** (`/bang-cong`, chỉ Quản trị và Kỹ thuật, menu "Hằng ngày"): mỗi nhân viên một dòng, mỗi ngày một ô mã công **X** đủ công · **N** nửa ngày · **CT** công tác · **P** phép năm · **L** nghỉ lễ · **O** nghỉ ốm · **KP** không lương · **CĐ** nghỉ chế độ · **V** vắng không đơn; cột tổng từng mã và **Công hưởng** (dính phải khi cuộn). Màu ô chỉ phụ trợ (X/CT teal nhạt, N/P hổ phách nhạt, L/O/KP/CĐ đỏ nhạt, V viền đỏ); chữ mã là dấu hiệu chính.
- **Một hàm tính công duy nhất** `congMotNgay` (`src/lib/cong.ts`, có test): bảng công và `lapBangLuong` cùng dùng nên không lệch nhau. Thứ tự: Chủ nhật/chưa vào làm → nghỉ lễ → nghỉ chế độ → nghỉ cả ngày → nghỉ nửa ngày → công tác → remote/ngoài công ty → có chấm công → vắng. Hôm nay chưa chấm công thì chưa tính vắng. Miễn chấm công (Tổng giám đốc, Giám đốc) mặc định X các ngày làm việc đã qua.
- **Quy ước có lương (cần chủ dự án xác nhận)**: có lương = X, CT, L, P; N = 0,5 làm + 0,5 phép năm nếu nghỉ phép; không lương = O, KP, CĐ, V (ốm và chế độ do BHXH chi trả nếu đủ điều kiện).
- **Ngày lễ** (bảng `ngay_le`, nút "Ngày lễ" ở Bảng công tháng): gieo sẵn ngày lễ dương lịch cố định 2026–2027; Tết Nguyên đán, Giỗ Tổ, ngày nghỉ bù do HCNS nhập. Hộp thoại đặt biểu mẫu thêm LÊN TRÊN danh sách để focus mặc định không rơi vào nút Xoá.
- **Hướng dẫn** (`/huong-dan`, mọi vai trò): nội dung theo vai trò (nhân viên · Quản trị/HCNS · Kỹ thuật), viết cho người không rành kỹ thuật, theo thứ tự việc hằng ngày → cuối tháng → lương.
- **`Hop`**: hiệu ứng focus chỉ chạy khi hộp mở/đóng (giữ `dong` trong ref). Trước đó mỗi lần ô nhập có state đổi là focus bị kéo đi, phím cách có thể bấm nhầm nút khác.
