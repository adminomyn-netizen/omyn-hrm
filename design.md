# OMYN HRM — Hệ thống thiết kế (design.md)

Tài liệu này là **nguồn chuẩn duy nhất** cho giao diện OMYN HRM. Ai thêm trang, thành phần hay sửa giao diện đều đọc và làm theo đây. Mọi con số dưới đây lấy từ mã thật (`src/app/globals.css`, `src/components/**`); nếu mã và tài liệu lệch nhau thì sửa cho khớp, không để hai bên khác nhau.

- Bản thiết kế gốc (Claude Design): https://claude.ai/artifact/2GmrJHfvPPQWEXRtHAa1pn (riêng tư) và 7 ảnh xuất ở `hrm-omyn/thiet-ke-moi/` (mở `xem-truoc-tat-ca.html`).
- Chủ dự án chốt hướng này ngày 22/10/2026: tông **vàng champagne + nâu espresso**, có **gradient vàng**, **không dùng xanh**, có **chế độ tối**.

---

## 1. Nguyên tắc

1. **Sang nhưng gọn.** Giấy ngà, mực nâu, một dải vàng ánh kim làm điểm nhấn. Mỗi trang có **một** điểm nhấn chính (hộp tối ánh vàng, hoặc nút vàng).
2. **Thân thiện với người không rành công nghệ.** Chữ tiếng Việt tự nhiên, câu ngắn, xưng "bạn", nói rõ việc cần làm kế tiếp. Trạng thái rỗng và lỗi luôn chỉ cách xử lý.
3. **Bấm là ăn.** Mọi thao tác phải có phản hồi trong ~100 ms: khung chờ hiện ngay, thao tác đổi trên màn hình trước rồi mới đồng bộ máy chủ (mục 10).
4. **Dữ liệu dày thì xếp thành bảng/hàng, không xếp thành lưới thẻ giống nhau.** Thẻ chỉ dùng khi nó là một *vật thể kéo được* (ứng viên) hoặc một *điểm nhấn* (hộp chấm công).
5. **Mọi thứ đều dùng được trên điện thoại 390 px, không cuộn ngang trang.**
6. **Không "AI hoá"** (mục 12): không tím–xanh, không emoji làm biểu tượng, không bóng nặng, không bo tròn đồng loạt.

---

## 2. Thương hiệu và giọng điệu

- Logo: chữ **OMYN** (Cormorant Garamond 600, giãn chữ 0,2 em) + hạt vàng nhỏ. Tệp: `public/brand/*.svg` (dựng bằng `scripts/dung-logo.mjs`). Trên nền tối dùng `logo-tren-nen-toi.svg` (chữ ngà, hạt vàng sáng). Logo giữ **phẳng** (không gradient trong logo).
- Giọng: điềm tĩnh, rõ ràng, không hô hào. Không dùng dấu chấm than, "Chào mừng bạn đến với…", "Oops", "Đã xảy ra lỗi" trần trụi, "Vui lòng" lặp lại, chữ in hoa cả câu.
- Định dạng: ngày `02/11/2026`, giờ 24h `08:30`, tiền `13.500.000 đ` (rút gọn ở chỉ số: `13,5 triệu`). Giờ luôn theo **giờ Hồ Chí Minh** (máy chủ chạy UTC nên tính tường minh `Asia/Ho_Chi_Minh`).
- Lời chào trang Tổng quan đổi theo giờ: sáng (<11h), trưa (<14h), chiều (<18h), tối.

---

## 3. Màu

Định nghĩa trong `src/app/globals.css` (`:root` cho sáng, `.dark` cho tối). **Luôn dùng token (lớp `bg-giay`, `text-muc-2`, `border-vien`…), không gõ mã màu thô** trong thành phần, trừ ô hero tối và biểu đồ SVG dùng mã vàng/ngà cố định (mục 3.3).

### 3.1 Bảng token

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--giay` | `#FBF7EE` | `#17120C` | nền trang |
| `--giay-sang` | `#FFFDF8` | `#1F1A12` | bề mặt: ô nhập, popup, thanh đầu trang |
| `--giay-tram` | `#F3EBD9` | `#2A2318` | vùng lõm, hover hàng, cột kanban |
| `--muc` | `#2A2218` | `#F3EAD8` | chữ chính |
| `--muc-2` | `#5D5142` | `#CDBFA3` | chữ phụ |
| `--muc-3` | `#75684F` | `#A89A7C` | chữ gợi ý, nhãn nhỏ |
| `--vien` | `#E8DEC8` | `#3A3123` | đường kẻ mảnh (trang trí) |
| `--vien-dam` | `#8D7F60` | `#7C6F56` | viền ô nhập, nút phụ (≥ 3:1) |
| `--nhan` | `#8F6C20` | `#D9B45C` | liên kết, focus, biểu tượng nhấn |
| `--nhan-dam` | `#6E5119` | `#E8CF8A` | chữ vàng trên nền be/nhãn |
| `--nhan-nhat` | `#F5EBCF` | `#3A2F17` | nền nhãn "tốt", avatar, mục chọn |
| `--loi` / `--loi-nen` | `#9E3426` / `#F4E3DF` | `#F0A091` / `#3B1F1A` | lỗi, từ chối |
| `--canh-bao` / `--canh-bao-nen` | `#A0522D` / `#F6E6DC` | `#E8A77A` / `#3A2618` | chờ duyệt, cảnh báo |
| `--chu-tren-vang` | `#2A2218` | `#2A2218` | chữ trên nút/ô nền vàng (**luôn nâu đậm**, cả chế độ tối) |
| `--menu` | `#1C160E` | `#100C07` | nền menu trái (**luôn tối**) |
| `--menu-chu`, `--menu-chu-phu`, `--menu-sang`, `--menu-nhan` | `#CDBFA3`, `#A89A7C`, `#F6EBD0`, `#E2BE66` | (giữ) | chữ/biểu tượng trên menu |
| `--menu-chon`, `--menu-hover`, `--menu-vien` | ngà 9% / 6% / 10% | (giữ) | nền mục chọn, hover, đường kẻ menu |

Thang `slate` của Tailwind được **đổi sang be ấm** (`--color-slate-*`) để không còn ánh xanh lạnh; trong `.dark` thang này đảo chiều.

### 3.2 Gradient (chỉ dải vàng/espresso)

| Token | Giá trị | Dùng |
|---|---|---|
| `--gradient-vang` | `135deg #F0D896 → #D4AE5A → #B8923A` | nút chính, avatar, ngày/tháng đang chọn, thanh tiến độ, huy hiệu số đếm |
| `--gradient-vang-hover` | sáng hơn ~6% | nút chính khi rê chuột |
| `--gradient-toi` + `.nen-toi` | `155deg #3A2E1F → #2A2218 → #17120C` + quầng vàng góc phải trên | hộp hero (chấm công hôm nay), panel đăng nhập |
| `--gradient-nen` + `.nen-trang` | ngà sáng → be nhạt (dọc) | nền trang, thanh bên đăng nhập |
| `.chu-vang` | chữ gradient vàng ánh kim | dòng nhấn trên nền tối |

**Cấm** mọi gradient có sắc tím/xanh lam/xanh lục (script `kiem-tra-thiet-ke` chặn).

### 3.3 Mã cố định được phép
Biểu đồ SVG và hộp hero tối dùng mã cố định vì luôn nằm trên nền espresso: vàng `#F0D896`, `#B8923A`; ngà `#F3EAD8`; chữ phụ `#CDBFA3`, `#A89A7C`.

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
- **Menu trái** (`Sidebar`): nền espresso cả khi giao diện sáng; nhóm có nhãn viết hoa nhỏ; mục đang mở nền ngà 9% + biểu tượng vàng; **số đếm** dải vàng cạnh mục (tài khoản chờ duyệt, đơn chờ duyệt, ứng viên mới — lấy từ `/api/thong-bao`, ghi qua `lib/dem-menu.ts`). Thu gọn còn 72 px (nhớ lựa chọn trong `localStorage`); rê chuột hiện tên + mô tả. Điện thoại: ngăn kéo `MobileNav` cùng kiểu + **thanh tab dưới cùng** (xem 7.9).
- **Đầu trang** (`DauTrang`): cao 56 px. Trái: ô tìm (`⌘K`/`Ctrl+K`, `TimKiem`). Phải: nút sáng/tối, chuông thông báo, avatar + tên. Bấm avatar: **Chỉnh sửa thông tin** (đổi tên, đổi mật khẩu — cần mật khẩu hiện tại) và **Đăng xuất**. Không hiện nhãn vai trò.
- **Đầu mỗi trang** (`TieuDeTrang`): tiêu đề sans + một dòng phụ (đếm), hành động chính bên phải (nút vàng + nút phụ).
- **Hàng chỉ số** (`HangChiSo`/mục chỉ số ở Tổng quan): số lớn + nhãn nhỏ, ngăn bằng đường kẻ dọc 1 px, **không thẻ**. Có thể kèm `DuongXuHuong` (đường nhỏ 84×34).
- **Khu** (`MucTrang`): tiêu đề nhỏ đậm + đường kẻ mảnh, hành động nhỏ bên phải ("Xem tất cả").
- **Lưới trong trang**: dùng `grid` 12 cột (`lg:col-span-*`); **mọi con của grid có `min-w-0`** để nội dung nowrap/bảng không đẩy tràn ngang trên điện thoại (`MucTrang` đã có sẵn).

---

## 7. Thành phần

Tất cả ở `src/components/ui/` trừ khi ghi khác. Lớp CSS dùng chung ở `ui/dinh-dang.ts`.

### 7.1 Nút
- **Chính** (`NUT_CHINH` = `.nut-vang`): dải vàng, chữ `--chu-tren-vang`, cao 40–50 px. Mỗi màn tối đa **một** nút chính.
- **Phụ** (`NUT_PHU`): viền `--vien-dam`, nền trong, hover `--giay-tram`.
- **Chữ** (`NUT_CHU`, `NUT_CHU_NGUY`): chữ vàng/đỏ gạch chân khi hover, dùng trong bảng ("Sửa", "Xoá").
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
| **Chấm công (nhân viên)** | Đồng hồ lớn giữa trang, nút tròn vàng 184 px có hai vòng mảnh (đổi sang xám ngà khi đã vào, "Đã xong hôm nay" khi đã ra), giờ vào/ra, dải 7 ngày của tuần. |
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

Cấm: gradient tím/xanh, thẻ bo tròn lớn đồng loạt (`rounded-2xl|3xl|full`), bóng nặng (`shadow-lg|xl|2xl`), mờ kính (`backdrop-blur`), bố cục 3 thẻ giống nhau, emoji làm biểu tượng, chữ mẫu ("Lorem ipsum", "John Doe"), phông Inter/Roboto/Arial/Poppins, `<select>`/`type="date"` mặc định.

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
- 22/10/2026 — Chốt hệ thiết kế vàng champagne + espresso, gradient vàng, chế độ tối; áp toàn bộ trang theo bản thiết kế Claude Design (menu tối, ô tìm ⌘K, hộp hero, bảng kéo thả tuyển dụng, đăng nhập mới); `Chon`/`NgayChon` qua portal.


## 9. Bổ sung 22/10/2026 — khối, lương, đồng hồ, lịch chấm công
- **Lời chào + đồng hồ HCM** (`LoiChaoDongHo`): giờ thật theo Asia/Ho_Chi_Minh, nhảy từng giây. Mốc chào: 05–11 giờ sáng, 11–13 giờ trưa, 13–18 giờ chiều, còn lại buổi tối.
- **Khối** (`/khoi`, `DanhSachKhoi`): thêm/sửa/xoá bằng popup; không xoá được khi khối còn nhân viên hoặc tin tuyển dụng.
- **Lương** (`/luong`, chỉ Quản trị; nhân viên chỉ thấy phiếu của mình đã duyệt/đã chi): 3 tab Bảng lương · Thỏa thuận lương · Tham số. Kỳ đi Mở → Đã lập → Đã kiểm → Đã duyệt → Đã chi; từ Đã kiểm trở đi khoá sửa. Duyệt kỳ chỉ được khi mọi tham số pháp lý đã được Quản trị xác nhận. Thành phần: `BangLuongKy`, `ChiTietDongLuong` (xem kết quả tức thì), `ThoaThuanLuong`, `ThamSoLuong`, `PhieuLuongCuaToi`, ô nhập `OTien`, công tắc `Gat`.
- **Công tính lương theo ca đã định**, không theo giờ bấm: lịch hiển thị giờ bấm thực tế, nhưng công = số ngày đi làm (ca hành chính 08:30–17:30); đi muộn chỉ là nhãn trạng thái. Giờ tăng ca nhập tay ở dòng lương.
- **Lịch chấm công** (`BoLocThoiGian`): chọn thẳng tháng/năm bằng ô chọn, nút tháng trước/sau, "Tháng này", hoặc tab "Tuỳ chỉnh khoảng ngày" (tối đa 93 ngày, hiện bảng Ngày · Nhân viên · Bộ phận · Giờ vào · Giờ ra · Trạng thái). Ô sự kiện trên lịch: dòng 1 "Tên - Bộ phận", dòng 2 "08:20 – 17:35"; quá chỗ thì "+N người nữa".
- **Đăng ký chọn phòng ban** (22/10, chốt lại): form chỉ có ô Phòng ban (danh sách khối), không có ô vị trí và không có ghi chú phụ. Lựa chọn chỉ là YÊU CẦU (`app_metadata.yeu_cau_khoi_id`), không cấp quyền. Bảng chờ duyệt hiện "Phòng ban: …", ô hồ sơ mặc định "Tạo hồ sơ mới theo đăng ký"; phòng ban **Hành chính nhân sự** có quyền Quản trị nên ô vai trò mặc định là Quản trị (người duyệt vẫn bấm xác nhận).
- **Phân quyền tài khoản do Kỹ thuật làm** (và Quản trị): duyệt tài khoản gán được mọi vai trò; trang Cài đặt và phân quyền cho đổi vai trò từng tài khoản (không tự đổi mình, không hạ Quản trị cuối cùng).
- **Menu avatar** (bấm ảnh đại diện): họ và tên đầy đủ, vị trí (chức danh · phòng ban · vai trò Quản trị/Kỹ thuật nếu có), email.

- **Kỹ thuật = quyền cao nhất** (22/10): làm mọi thứ và xem mọi số liệu, kể cả Lương (kỳ, thỏa thuận, tham số, xác nhận tham số). Không thể hạ tài khoản Kỹ thuật/Quản trị cuối cùng.

- **Chức vụ chọn dropdown** (22/10): biểu mẫu nhân viên dùng ô chọn Chức vụ (Tổng giám đốc, Phó tổng giám đốc, Giám đốc, Phó giám đốc, Trưởng bộ phận, Leader, Chuyên viên, Nhân viên, Thực tập sinh); giá trị cũ ngoài danh sách vẫn giữ làm một lựa chọn. Danh sách ở `src/lib/chuc-vu.ts`.
