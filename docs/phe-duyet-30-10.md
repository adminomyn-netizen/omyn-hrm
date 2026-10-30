# Bộ phê duyệt Omyn (chuyển từ Lark, 30/10/2026)

- 19 phiếu khai báo trong `src/lib/phe-duyet-mau.ts` (ô nhập, kiểu ô, bắt buộc, lựa chọn, ô hiện theo điều kiện). Mã phiếu tự sinh `NHÓM-AAMM-0001` (HR, FIN, MKT, ADM…), nhóm sửa trong Cài đặt → "Nhóm mã phiếu".
- Luồng duyệt nhiều bước cấu hình trong màn "Setup luồng phiếu" (menu Quản trị, chỉ Kỹ thuật; AND/OR/CC, điều kiện theo ô của phiếu). Khung mặc định: Quản lý trực tiếp → Giám đốc; chưa có ai duyệt thì chuyển Kỹ thuật, không tự duyệt.
- Danh mục chọn (đơn vị, bộ phận, khoản chi…) sửa trong "Danh mục lựa chọn của phiếu"; danh mục trống thì nhập chữ tự do.
- Chuông + đẩy điện thoại báo người duyệt/người nộp; lịch sử từng bước; tệp đính kèm lên kho riêng tư `phe-duyet-tep` (≤25 MB/tệp), tải qua đường ký 60 giây.

## Chỗ em suy ra thay Lark (chị Lâm xem lại)
Lark chỉ cho tên ô, không cho điều kiện hiện và người duyệt. Các ô có `suyRa` trong file mẫu: Phiếu thu tiền (Tài khoản quỹ), Làm thêm giờ (thông tin khách, Ghi chú), Điều chỉnh nhân sự (4 ô Phòng ban/Chức vụ), Điều chỉnh chấm công (sửa giờ, minh chứng), các ô gộp của Lark (nghỉ, làm online, công tác) tách thành ô riêng. Danh sách "Loại nghỉ" là gợi ý (phép năm/không lương/ốm/việc riêng).
Số bước Lark (68, 38, 23…) gồm nhiều nhánh theo đơn vị/phòng; app lưu chuỗi AND/OR/CC gốc để đối chiếu khi nhập ma trận người duyệt.

## Setup luồng phiếu (chỉ Kỹ thuật)
Chọn loại phiếu rồi chỉnh 5 tab: Luồng duyệt (bước, AND/OR/CC, người duyệt/nhận bản sao, nhánh theo ô), Ô nhập (bắt buộc, ẩn/hiện, điều kiện hiện), Thông báo (người nhận thêm theo sự kiện nộp/duyệt xong/từ chối/cần bổ sung/huỷ), Nhóm mã + tạm ngưng, Lịch sử (ai sửa gì, lúc nào). Thay đổi áp dụng cho phiếu nộp từ sau; phiếu đã nộp giữ luồng đã chụp lúc nộp.
