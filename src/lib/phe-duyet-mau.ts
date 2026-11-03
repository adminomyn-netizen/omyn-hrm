/** 19 phiếu phê duyệt bê nguyên từ Lark của chị Lâm (đọc 30/10/2026): ô nhập, kiểu ô, ô bắt buộc, lựa chọn, ô hiện theo điều kiện.
 * Lark không cho đọc người duyệt và điều kiện rẽ nhánh → luồng duyệt cấu hình trong app (pd_luong_duyet), ô `suyRa` ghi chỗ em phải đoán thay Lark. */
import type { MauPhieu, Truong } from "./phe-duyet";

type Mo = Partial<Omit<Truong, "ma" | "ten" | "kieu">>;
const o = (kieu: Truong["kieu"], ma: string, ten: string, mo: Mo = {}): Truong => ({ ma, ten, kieu, batBuoc: true, ...mo });
const chu = (ma: string, ten: string, mo?: Mo) => o("chu", ma, ten, mo);
const nhieu = (ma: string, ten: string, mo?: Mo) => o("nhieu", ma, ten, mo);
const ngay = (ma: string, ten: string, mo?: Mo) => o("ngay", ma, ten, mo);
const ngayGio = (ma: string, ten: string, mo?: Mo) => o("ngay_gio", ma, ten, mo);
const tien = (ma: string, ten: string, mo?: Mo) => o("tien", ma, ten, mo);
const chon = (ma: string, ten: string, luaChon: readonly string[], mo?: Mo) => o("chon", ma, ten, { luaChon, ...mo });
const dm = (ma: string, ten: string, danhMuc: string, mo?: Mo) => o("dm", ma, ten, { danhMuc, ...mo });
const nv = (ma: string, ten: string, mo?: Mo) => o("nv", ma, ten, mo);
const tep = (ma: string, ten: string, mo?: Mo) => o("tep", ma, ten, mo);

const BANG_CHU = (tien: string) => chu("so_tien_bang_chu", "Số tiền bằng chữ", { bangChuTu: tien, goiY: "Tự điền từ số tiền" });
const NGUOI_NHAN_BAN_GIAO = nv("nguoi_nhan", "Người nhận bàn giao", { nhieu: true });

export const MAU_PHIEU: readonly MauPhieu[] = [
  {
    ma: "ban-giao-cong-viec", ten: "Bàn giao công việc", nhomMacDinh: "HR",
    moTa: "Bàn giao công việc khi nghỉ việc hoặc chuyển vị trí.",
    lark: { ma: "3F83B8D8-30BF-40FC-8588-B1BEB78363D9", buoc: "10 bước: AND×8, (1 bước điều kiện), AND" },
    truong: [ngay("ngay_ban_giao", "Ngày bàn giao"), NGUOI_NHAN_BAN_GIAO, nhieu("noi_dung", "Nội dung bàn giao"), tep("tai_lieu", "Tài liệu bàn giao")],
  },
  {
    ma: "ban-giao-nghia-vu-tai-chinh", ten: "Bàn giao nghĩa vụ tài chính", nhomMacDinh: "FIN",
    moTa: "Bàn giao các khoản công nợ, tạm ứng, nghĩa vụ tài chính khi nghỉ việc.",
    lark: { ma: "C4E48A97-E807-4649-941F-3A096D7EFBE5", buoc: "6 bước: AND×6" },
    truong: [ngay("ngay_ban_giao", "Ngày bàn giao"), NGUOI_NHAN_BAN_GIAO, nhieu("noi_dung", "Nội dung bàn giao"), tep("tai_lieu", "Tài liệu bàn giao")],
  },
  {
    ma: "ban-giao-tai-san", ten: "Bàn giao tài sản", nhomMacDinh: "HR",
    moTa: "Bàn giao tài sản, thiết bị đang giữ.",
    lark: { ma: "20E1E916-DDC4-4F04-B0CF-0EC0438F8583", buoc: "10 bước: AND×8, (1 bước điều kiện), AND" },
    truong: [ngay("ngay_ban_giao", "Ngày bàn giao"), NGUOI_NHAN_BAN_GIAO, nhieu("muc_dich", "Mục đích bàn giao"), tep("tai_lieu", "Tài liệu bàn giao")],
  },
  {
    ma: "ke-hoach-ngan-sach", ten: "Kế hoạch ngân sách", nhomMacDinh: "FIN",
    moTa: "Duyệt kế hoạch ngân sách theo kỳ, đơn vị và bộ phận.",
    lark: { ma: "9ECB6A81-6311-433C-B504-68A71A9DD6C0", buoc: "5 bước: AND×5" },
    truong: [
      chu("ma_ke_hoach", "Mã kế hoạch"), chu("ky_lap", "Kỳ lập ngân sách", { goiY: "Tháng 11/2026" }), nv("nguoi_lap", "Người lập kế hoạch"),
      dm("don_vi", "Đơn vị làm việc", "Đơn vị làm việc"), dm("bo_phan", "Bộ phận", "Bộ phận"),
      chu("link_du_toan", "Link dự toán ngân sách"), tien("tong_du_toan", "Tổng dự toán ngân sách"), BANG_CHU("tong_du_toan"),
      chu("so_voi_thang_truoc", "So với dự toán tháng trước"), chu("ly_do_tang_giam", "Lý do tăng/giảm"), chu("ghi_chu", "Ghi chú"),
    ],
  },
  {
    ma: "dang-ky-vang-mat", ten: "Đăng ký vắng mặt", nhomMacDinh: "HR",
    moTa: "Đăng ký nghỉ/vắng mặt kèm ủy nhiệm công việc (MSC_BNLPT).",
    lark: { ma: "85393DB4-891C-4633-9B8C-890AFE3A1FB4", buoc: "68 bước: AND×42, CC×9, AND, 16 bước điều kiện, AND" },
    truong: [
      dm("don_vi", "Đơn vị làm việc", "Đơn vị làm việc"), dm("nhom_lam_viec", "Nhóm làm việc", "Nhóm làm việc"),
      dm("loai_nghi", "Loại nghỉ", "Loại nghỉ", { suyRa: "Ô “Leave widgets” của Lark gồm loại nghỉ, thời gian, lý do; em tách thành 4 ô. Sửa danh sách loại nghỉ trong Danh mục." }),
      ngayGio("nghi_tu", "Nghỉ từ"), ngayGio("nghi_den", "Nghỉ đến", { khongTruoc: "nghi_tu" }), nhieu("ly_do", "Lý do vắng mặt"),
      nhieu("uy_nhiem_cong_viec", "Ủy nhiệm công việc trong thời gian vắng mặt"), nv("nguoi_uy_nhiem", "Người ủy nhiệm công tác"),
      nhieu("thong_tin_lien_he", "Thông tin liên hệ khi vắng mặt"),
    ],
  },
  {
    ma: "tiep-nhan-yeu-cau-hanh-chinh", ten: "Tiếp nhận yêu cầu xử lý hành chính", nhomMacDinh: "ADM",
    moTa: "Ghi nhận một yêu cầu hành chính và người xử lý.",
    lark: { ma: "5A61DA44-A896-40C1-8888-E31D7FC4593D", buoc: "4 bước: AND, AND, OR, AND" },
    truong: [ngay("ngay_phat_sinh", "Ngày phát sinh"), chu("noi_dung", "Nội dung yêu cầu"), nv("nguoi_xu_ly", "Người xử lý")],
  },
  {
    ma: "phieu-thu-tien", ten: "Phiếu thu tiền", nhomMacDinh: "FIN",
    moTa: "Ghi nhận khoản thu tiền giữa thu ngân, két tiền và tài khoản.",
    lark: { ma: "09D7377D-E6EE-42FB-915B-6F82708BA08F", buoc: "4 bước: AND×4" },
    truong: [
      nv("nguoi_nop", "Người nộp tiền"), nv("nguoi_thu", "Người thu tiền"), tien("so_tien", "Số tiền"), nhieu("noi_dung", "Nội dung"),
      chon("nguon_di", "Nguồn tiền đi", ["Thu ngân", "Két tiền mặt", "Khác"]), chon("nguon_den", "Nguồn tiền đến", ["Két tiền mặt", "Tài khoản ngân hàng", "Khác"]),
      dm("tai_khoan_quy", "Tài khoản quỹ", "Tài khoản quỹ", { hien: { truong: "nguon_den", la: ["Két tiền mặt", "Tài khoản ngân hàng"] }, suyRa: "Lark chỉ ghi “có điều kiện hiện”; em đặt: hiện khi nguồn tiền đến là Két tiền mặt hoặc Tài khoản ngân hàng." }),
    ],
  },
  {
    ma: "xac-nhan-lam-them-gio", ten: "Phiếu xác nhận làm thêm giờ", nhomMacDinh: "HR",
    moTa: "Xác nhận làm thêm giờ/tăng ca, kèm thông tin khách nếu phục vụ khách.",
    lark: { ma: "AFD92B28-7B81-4120-9386-7C26ABE597B6", buoc: "10 bước: AND×4, CC×3, AND, (1 bước điều kiện), AND" },
    truong: [
      chon("noi_lam_viec", "Nơi làm việc", ["Omyn"]), chon("nhan_vien", "Nhân viên", ["Văn phòng", "Khác"]),
      chu("ma_khach_hang", "Mã khách hàng", { hien: { truong: "nhan_vien", la: ["Khác"] }, suyRa: "Lark: có điều kiện hiện. Em đặt hiện khi Nhân viên = Khác (làm việc với khách)." }),
      chu("ten_khach_hang", "Tên khách hàng", { hien: { truong: "nhan_vien", la: ["Khác"] } }),
      chu("ten_dich_vu", "Tên dịch vụ", { hien: { truong: "nhan_vien", la: ["Khác"] } }),
      nhieu("ly_do", "Lý do tăng ca"), ngayGio("tu", "Thời gian bắt đầu"), ngayGio("den", "Thời gian kết thúc", { khongTruoc: "tu" }),
      nhieu("ghi_chu", "Ghi chú", { hien: { truong: "khung_gio", la: ["Ngoài giờ hành chính"] }, suyRa: "Lark: có điều kiện hiện. Em đặt hiện khi khung giờ là Ngoài giờ hành chính." }),
      chon("khung_gio", "Khung giờ làm việc", ["Giờ hành chính", "Ngoài giờ hành chính"]),
    ],
  },
  {
    ma: "dang-ky-truc-page", ten: "Phiếu đăng ký trực page", nhomMacDinh: "MKT",
    moTa: "Đăng ký các ngày trực page theo chi nhánh.",
    lark: { ma: "2F4ED200-A815-458B-AE5F-4B9FFCBC41EB", buoc: "4 bước: AND×4" },
    truong: [
      ngay("ngay", "Ngày"), chon("chi_nhanh", "Chi nhánh", ["Omyn"]),
      o("bang", "chi_tiet", "Chi tiết", { con: [ngay("ngay_dang_ky", "Ngày đăng ký")] }),
    ],
  },
  {
    ma: "de-xuat-khen-thuong-ky-luat", ten: "Phiếu đề xuất khen thưởng/kỷ luật", nhomMacDinh: "HR",
    moTa: "Đề xuất khen thưởng hoặc kỷ luật một nhân sự.",
    lark: { ma: "47169E2C-C05D-45A8-BF22-277F183B42D0", buoc: "4 bước: OR, OR, AND, AND" },
    truong: [
      chon("loai", "Loại đề xuất", ["Khen thưởng", "Kỷ luật"]), nhieu("noi_dung", "Nội dung"),
      nv("nhan_su_khen_thuong", "Nhân sự khen thưởng"),
      tep("de_xuat_khen_thuong", "Đề xuất khen thưởng", { hien: { truong: "loai", la: ["Khen thưởng"] } }),
      nv("nhan_vien_vi_pham", "Nhân viên vi phạm", { hien: { truong: "loai", la: ["Kỷ luật"] } }),
      tep("ban_ghi_nhan_su_viec", "Bản ghi nhận sự việc", { hien: { truong: "loai", la: ["Kỷ luật"] } }),
    ],
  },
  {
    ma: "de-xuat-dieu-chinh-nhan-su", ten: "Phiếu đề xuất điều chỉnh nhân sự", nhomMacDinh: "HR",
    moTa: "Đề xuất điều chỉnh lương, luân chuyển hoặc thăng chức.",
    lark: { ma: "41EDC8D1-A1DF-4EFD-A575-84514E594418", buoc: "5 bước: AND, AND, AND, OR, AND" },
    truong: [
      nv("nhan_su", "Nhân sự điều chỉnh"), chon("loai", "Loại điều chỉnh", ["Điều chỉnh lương", "Luân chuyển", "Thăng chức"]),
      tien("luong_cu", "Lương cũ", { hien: { truong: "loai", la: ["Điều chỉnh lương"] } }), tien("luong_moi", "Lương mới", { hien: { truong: "loai", la: ["Điều chỉnh lương"] } }),
      dm("phong_ban_hien_tai", "Phòng ban hiện tại", "Phòng ban", { hien: { truong: "loai", la: ["Luân chuyển", "Thăng chức"] }, suyRa: "Lark có 4 ô Phòng ban/Chức vụ (2 cặp) cùng “có điều kiện hiện”; em hiểu là cặp hiện tại + cặp mới." }),
      dm("chuc_vu_hien_tai", "Chức vụ hiện tại", "Chức vụ", { hien: { truong: "loai", la: ["Luân chuyển", "Thăng chức"] } }),
      dm("phong_ban_moi", "Phòng ban mới", "Phòng ban", { hien: { truong: "loai", la: ["Luân chuyển"] } }),
      dm("chuc_vu_moi", "Chức vụ mới", "Chức vụ", { hien: { truong: "loai", la: ["Luân chuyển", "Thăng chức"] } }),
      nhieu("noi_dung", "Nội dung đề xuất"), ngay("thoi_gian_ap_dung", "Thời gian áp dụng"),
    ],
  },
  {
    ma: "xin-nghi-viec", ten: "Xin nghỉ việc", nhomMacDinh: "HR",
    moTa: "Đơn xin nghỉ việc, kèm biên bản bàn giao.",
    lark: { ma: "9BD9F2E2-6D57-4ED4-9AB4-5D9C2CF548DE", buoc: "23 bước: AND×11, CC×6, AND, OR×3, (1 bước điều kiện), AND" },
    truong: [
      ngay("thoi_gian_lam_don", "Thời gian làm đơn"), ngay("ngay_lam_viec_cuoi", "Ngày làm việc cuối cùng", { khongTruoc: "thoi_gian_lam_don" }),
      chon("loai_nghi_viec", "Loại nghỉ việc", ["Đúng hạn", "Trước hạn"]),
      chon("ly_do", "Lý do nghỉ việc", ["Lương, thưởng không phù hợp", "Không có cơ hội thăng tiến", "Công việc không đúng định hướng", "Muốn thay đổi môi trường làm việc", "Áp lực công việc quá cao", "Khối lượng công việc không hợp lý", "Không phù hợp với văn hóa công ty", "Mâu thuẫn với quản lý hoặc đồng nghiệp", "Không được ghi nhận, đánh giá công bằng"]),
      nhieu("ly_do_khac", "Lý do nghỉ việc (khác)", { batBuoc: false }), nhieu("ghi_chu", "Ghi chú thêm", { batBuoc: false }),
      tep("bien_ban_ban_giao", "Đính kèm biên bản bàn giao"),
      tep("quyet_dinh_cham_dut_hdld", "Quyết định chấm dứt hợp đồng lao động (áp dụng với nhân viên chính thức)", { batBuoc: false }),
    ],
  },
  {
    ma: "xin-phep-lam-online", ten: "Xin phép làm online", nhomMacDinh: "HR",
    moTa: "Xin làm việc online nửa ngày hoặc cả ngày.",
    lark: { ma: "210F98F8-CB56-495C-8DD6-FFAACB74A7FD", buoc: "10 bước: AND×3, CC×3, AND, 2 bước điều kiện, AND" },
    truong: [
      chon("loai", "Thời lượng", ["Nửa ngày", "Cả ngày"], { suyRa: "Ô “Out-of-office” của Lark có đơn vị nửa ngày/cả ngày; em tách thành thời lượng + từ/đến + lý do." }),
      ngayGio("tu", "Từ"), ngayGio("den", "Đến", { khongTruoc: "tu" }), nhieu("ly_do", "Lý do làm online", { batBuoc: false }),
    ],
  },
  {
    ma: "dieu-chinh-sai-sot-cham-cong", ten: "Điều chỉnh sai sót chấm công", nhomMacDinh: "HR",
    moTa: "Xin sửa giờ check in/check out bị sai hoặc quên.",
    lark: { ma: "66BF54B2-B9B8-4541-912B-7EFAD5E2D31E", buoc: "10 bước: AND×7, 2 bước điều kiện, AND" },
    truong: [
      chon("loai_cham_cong", "Loại chấm công", ["Thời gian check in", "Thời gian check out"]),
      chon("loai_loi", "Loại lỗi", ["Đi muộn", "Quên chấm công", "Lý do công việc", "Lý do khác"]),
      ngay("ngay_sua", "Ngày cần sửa", { hien: { truong: "loai_loi", la: ["Quên chấm công", "Lý do công việc", "Lý do khác"] }, suyRa: "Ô “Clock-in/out Correction” của Lark: ngày + giờ đúng; em tách thành 2 ô, hiện khi lỗi không phải Đi muộn." }),
      ngayGio("gio_dung", "Thời gian đúng", { hien: { truong: "loai_loi", la: ["Quên chấm công", "Lý do công việc", "Lý do khác"] } }),
      tep("minh_chung", "Minh chứng", { hien: { truong: "loai_loi", la: ["Lý do công việc", "Lý do khác"] }, suyRa: "Lark: có điều kiện hiện. Em đặt hiện khi lỗi là Lý do công việc hoặc Lý do khác." }),
    ],
  },
  {
    ma: "de-nghi-hoan-ung", ten: "Đề nghị hoàn ứng", nhomMacDinh: "FIN",
    moTa: "Quyết toán khoản đã tạm ứng: hoàn tiền thừa hoặc xin thanh toán bổ sung phần thiếu.",
    lark: { ma: "E1EE9017-06E9-4F3D-A398-3E0D45B859FA", buoc: "38 bước: AND/OR xen kẽ, CC×3, AND, 5 bước điều kiện, AND" },
    truong: [
      ngay("ngay_hoan_ung", "Ngày hoàn ứng"), dm("don_vi", "Đơn vị làm việc", "Đơn vị làm việc"), dm("bo_phan", "Bộ phận", "Bộ phận"),
      o("phieu", "phieu_tam_ung", "Phiếu tạm ứng", { loaiPhieuNoi: ["de-nghi-tam-ung"] }),
      tien("da_tam_ung", "Số tiền đã tạm ứng"), tien("thuc_te_chi", "Số tiền thực tế chi trả"), tien("thua_can_hoan", "Số tiền thừa cần hoàn ứng"),
      nhieu("noi_dung", "Nội dung đề xuất"), tep("minh_chung_chi", "Minh chứng thực tế chi trả"),
      chon("can_thanh_toan_them", "Cần thanh toán thêm", ["Có", "Không"]),
      tien("so_tien_thieu", "Số tiền thiếu cần thanh toán bổ sung"),
      chu("ten_chu_tk", "Tên chủ tài khoản", { hien: { truong: "can_thanh_toan_them", la: ["Có"] } }),
      chu("tai_khoan", "Tài khoản", { hien: { truong: "can_thanh_toan_them", la: ["Có"] } }),
      chu("ngan_hang", "Ngân hàng", { hien: { truong: "can_thanh_toan_them", la: ["Có"] } }),
      BANG_CHU("so_tien_thieu"), tep("ho_so", "Hồ sơ đính kèm"), chu("link_dinh_kem", "Link đính kèm"),
    ],
  },
  {
    ma: "de-nghi-thanh-toan", ten: "Đề nghị thanh toán", nhomMacDinh: "FIN",
    moTa: "Đề nghị thanh toán một khoản chi cho đối tác/người nhận.",
    lark: { ma: "2B901E9E-4A8C-4D7C-8EF4-CFA11DCB0855", buoc: "38 bước: AND×29, OR×2, CC×2, AND, 5 bước điều kiện, AND" },
    truong: [
      dm("don_vi", "Đơn vị làm việc", "Đơn vị làm việc"), dm("bo_phan", "Bộ phận", "Bộ phận"), dm("khoan_chi", "Khoản chi", "Khoản chi"),
      chu("noi_dung", "Nội dung đề xuất"), tien("so_tien", "Số tiền"), BANG_CHU("so_tien"), ngay("ngay_can_thanh_toan", "Ngày cần thanh toán"),
      tep("ho_so_lien_quan", "Hồ sơ liên quan đính kèm", { batBuoc: false }),
      chu("so_tai_khoan", "Số tài khoản người nhận"), chu("ten_chu_tk", "Họ tên chủ tài khoản"), chu("ngan_hang", "Ngân hàng nhận tiền"),
      chu("link_dinh_kem", "Đính kèm link", { batBuoc: false }), nhieu("ghi_chu", "Ghi chú", { batBuoc: false }),
    ],
  },
  {
    ma: "de-nghi-tam-ung", ten: "Đề nghị tạm ứng", nhomMacDinh: "FIN",
    moTa: "Đề nghị tạm ứng tiền cho một khoản chi, chia theo hạng mục chi phí.",
    lark: { ma: "9C0B3887-D07F-4CEA-A963-F969F56E0A12", buoc: "38 bước: AND/OR xen kẽ, CC×3, AND, 5 bước điều kiện, AND" },
    truong: [
      dm("don_vi", "Đơn vị làm việc", "Đơn vị làm việc"), dm("bo_phan", "Bộ phận", "Bộ phận"), dm("khoan_chi", "Khoản chi", "Khoản chi"),
      chu("noi_dung", "Nội dung đề xuất"), tien("so_tien", "Số tiền"), BANG_CHU("so_tien"),
      o("bang", "hang_muc_chi_phi", "Hạng mục chi phí (nếu đã biết, chưa phát sinh thì để trống)", { batBuoc: false, con: [chu("hang_muc_chi", "Hạng mục chi"), tien("so_tien", "Số tiền dự kiến", { batBuoc: false })] }),
      o("cong", "tong_du_tru", "Tổng tiền dự trù", { batBuoc: false, tong: { bang: "hang_muc_chi_phi", cot: "so_tien" } }),
      ngay("ngay_can_tam_ung", "Ngày cần tạm ứng"), tep("ho_so_lien_quan", "Hồ sơ liên quan đính kèm", { batBuoc: false }),
      chu("so_tai_khoan", "Số tài khoản người nhận"), chu("ten_chu_tk", "Họ tên chủ tài khoản"), chu("ngan_hang", "Ngân hàng nhận tiền"),
      nhieu("ghi_chu", "Ghi chú", { batBuoc: false }),
    ],
  },
  {
    ma: "de-xuat-tuyen-dung", ten: "Đề xuất tuyển dụng", nhomMacDinh: "HR",
    moTa: "Đề xuất tuyển thêm, thay thế hoặc thời vụ cho một vị trí.",
    lark: { ma: "910E7832-6657-4BA3-83A6-7F413D333E45", buoc: "4 bước: AND×4" },
    truong: [
      dm("vi_tri", "Vị trí", "Vị trí"), dm("phong_ban", "Phòng ban", "Phòng ban"), o("so", "so_luong", "Số lượng"),
      chon("loai_hinh", "Loại hình tuyển dụng", ["Mới", "Thay thế", "Thời vụ"]), chu("muc_luong", "Mức lương dự kiến / Khoảng lương"),
      ngay("thoi_gian_can", "Thời gian cần nhân sự"), chu("thay_the_cho", "Thay thế cho ai", { batBuoc: false }),
      nhieu("ghi_chu", "Ghi chú thêm"), tep("file_dinh_kem", "File đính kèm (JD, kế hoạch nhân sự – nếu có)", { batBuoc: false }),
    ],
  },
  {
    ma: "de-xuat-di-cong-tac", ten: "Đề xuất đi công tác", nhomMacDinh: "HR",
    moTa: "Đề xuất chuyến công tác: nơi đi/đến, thời gian, mục đích.",
    lark: { ma: "147BC960-BBFD-4869-9D9C-01CA4FDC235D", buoc: "8 bước: AND×3, CC×2, AND, OR, AND" },
    truong: [
      chu("noi_di", "Nơi đi", { suyRa: "Ô “Business trip widgets” của Lark: em tách thành nơi đi/đến, từ/đến, phương tiện." }), chu("noi_den", "Nơi đến"),
      ngayGio("tu", "Từ"), ngayGio("den", "Đến", { khongTruoc: "tu" }),
      chon("phuong_tien", "Phương tiện", ["Máy bay", "Ô tô", "Tàu hỏa", "Xe máy", "Khác"], { batBuoc: false }),
      nhieu("muc_dich", "Mục đích công tác"), tep("quyet_dinh", "Quyết định/Đề nghị công tác (đính kèm file – nếu có)", { batBuoc: false }),
    ],
  },
];

export const mauTheoMa = (ma: string) => MAU_PHIEU.find((m) => m.ma === ma);
