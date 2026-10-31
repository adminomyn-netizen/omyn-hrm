/** Cấu hình các mục vận hành HCNS chuyển từ Lark (docs/mapping-lark-hr.md). Một khai báo → bảng/thẻ danh sách, biểu mẫu thêm/sửa, kiểm tra ở máy chủ.
 * Thêm mục mới = thêm một khối vào HR_MUC (+ migration cho bảng); không cần viết thêm trang. Không dùng hàm trong cấu hình để truyền được sang trình duyệt. */

const KENH_ND = ["Facebook", "TikTok", "Shopee", "Zalo", "Website", "Khác"] as const;

export type KieuCot = "chu" | "nhieu" | "so" | "tien" | "ngay" | "gio" | "chon" | "co" | "nv" | "khoi" | "tc";

export type CotHr = {
  k: string;
  nhan: string;
  kieu: KieuCot;
  luaChon?: readonly string[];
  batBuoc?: boolean;
  /** Giá trị mặc định khi thêm mới. */
  mac?: string | number | boolean;
  /** Hiện ở thẻ danh sách (ngoài tiêu đề). */
  the?: boolean;
  /** Chiếm cả hàng trong biểu mẫu. */
  rong?: boolean;
  goiY?: string;
  /** Với kieu "tc": bảng được tham chiếu (có cột id, ten) — chọn trong danh sách bảng đó. */
  bangTc?: string;
  /** Cột số được để trống (lưu null thay vì 0). */
  coTheTrong?: boolean;
  /** Khoảng giá trị hợp lệ [nhỏ nhất, lớn nhất] cho cột số. */
  khoang?: readonly [number, number];
};

export type MucHr = {
  ma: string;
  ten: string;
  nhom: string;
  moTa: string;
  bang: string;
  cot: readonly CotHr[];
  /** Cột làm tiêu đề thẻ. */
  tieuDe: string;
  /** Cột trạng thái (hiện nhãn màu + bộ lọc nhanh). */
  trangThai?: string;
  sapXep: { cot: string; giam?: boolean };
  /** Cột ngày để cảnh báo sắp đến hạn (số ngày tới). */
  canhBao?: { cot: string; ngay: number; nhan: string };
  /** Chỉ vai giám đốc được thêm/sửa/xoá; các vai khác chỉ xem. */
  chiGiamDocSua?: boolean;
  /** Một câu hướng dẫn khi chưa có dữ liệu. */
  trong: string;
  /** Link "← …" ở đầu trang chi tiết; mặc định theo nhóm (Tuyển dụng → Sổ tuyển dụng, còn lại → Trang chủ Nhân sự). */
  quayVe?: { href: string; nhan: string };
};

const UU_TIEN = ["Cao", "Trung bình", "Thấp"] as const;

export const HR_MUC: readonly MucHr[] = [
  {
    ma: "muc-tieu-tuyen-dung", ten: "Kế hoạch & mục tiêu tuyển dụng", nhom: "Tuyển dụng", bang: "muc_tieu_tuyen_dung", tieuDe: "vi_tri", trangThai: "trang_thai",
    moTa: "Mỗi kỳ cần tuyển vị trí nào, bao nhiêu người, hạn nào, đã tuyển được bao nhiêu.",
    sapXep: { cot: "han_hoan_thanh" }, canhBao: { cot: "han_hoan_thanh", ngay: 14, nhan: "Sắp đến hạn" },
    trong: "Chưa có kế hoạch. Bấm “Thêm mới” để đặt chỉ tiêu tuyển cho kỳ này.",
    cot: [
      { k: "ky", nhan: "Kỳ", kieu: "chu", batBuoc: true, the: true, goiY: "Quý 4/2026" },
      { k: "vi_tri", nhan: "Vị trí cần tuyển", kieu: "chu", batBuoc: true },
      { k: "khoi_id", nhan: "Khối / phòng ban", kieu: "khoi", the: true },
      { k: "chi_tieu", nhan: "Chỉ tiêu (người)", kieu: "so", batBuoc: true, mac: 1, the: true },
      { k: "da_tuyen", nhan: "Đã tuyển", kieu: "so", mac: 0, the: true },
      { k: "han_hoan_thanh", nhan: "Hạn hoàn thành", kieu: "ngay", the: true },
      { k: "uu_tien", nhan: "Ưu tiên", kieu: "chon", luaChon: UU_TIEN, mac: "Trung bình", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Kế hoạch", "Đang tuyển", "Đủ người", "Tạm dừng", "Huỷ"], mac: "Đang tuyển" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "ngan-sach-tuyen-dung", ten: "Ngân sách tuyển dụng", nhom: "Tuyển dụng", bang: "ngan_sach_tuyen_dung", tieuDe: "hang_muc",
    moTa: "Dự kiến và thực chi theo hạng mục (đăng tin, headhunt, giới thiệu, sự kiện…).",
    sapXep: { cot: "tao_luc", giam: true }, trong: "Chưa có ngân sách. Thêm hạng mục đầu tiên của kỳ.",
    cot: [
      { k: "ky", nhan: "Kỳ", kieu: "chu", batBuoc: true, the: true, goiY: "Quý 4/2026" },
      { k: "hang_muc", nhan: "Hạng mục", kieu: "chu", batBuoc: true, goiY: "Đăng tin trả phí" },
      { k: "du_kien", nhan: "Dự kiến (đ)", kieu: "tien", mac: 0, the: true },
      { k: "thuc_te", nhan: "Thực chi (đ)", kieu: "tien", mac: 0, the: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "kenh-tuyen-dung", ten: "Kênh tuyển dụng & hiệu suất", nhom: "Tuyển dụng", bang: "kenh_tuyen_dung", tieuDe: "ten", trangThai: "trang_thai",
    moTa: "Mỗi kênh đem về bao nhiêu CV, phỏng vấn, nhận việc và tốn bao nhiêu để biết kênh nào đáng đầu tư.",
    sapXep: { cot: "tao_luc", giam: true }, trong: "Chưa có kênh nào. Thêm các kênh bạn đang dùng (TopCV, Facebook, giới thiệu…).",
    cot: [
      { k: "ten", nhan: "Tên kênh", kieu: "chu", batBuoc: true, goiY: "TopCV" },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Miễn phí", "Trả phí", "Giới thiệu nội bộ", "Trường/Đối tác", "Khác"], mac: "Miễn phí", the: true },
      { k: "chi_phi", nhan: "Chi phí (đ)", kieu: "tien", mac: 0, the: true },
      { k: "so_cv", nhan: "Số CV", kieu: "so", mac: 0, the: true },
      { k: "so_phong_van", nhan: "Số phỏng vấn", kieu: "so", mac: 0, the: true },
      { k: "so_nhan_viec", nhan: "Số nhận việc", kieu: "so", mac: 0, the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang dùng", "Tạm dừng"], mac: "Đang dùng" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "lich-phong-van", ten: "Lịch phỏng vấn", nhom: "Tuyển dụng", bang: "lich_phong_van", tieuDe: "ten_ung_vien", trangThai: "ket_qua",
    moTa: "Lịch từng vòng, người phỏng vấn, kết quả và nhận xét.",
    sapXep: { cot: "thoi_gian", giam: true }, canhBao: { cot: "thoi_gian", ngay: 3, nhan: "Sắp tới" }, trong: "Chưa có lịch phỏng vấn. Thêm lịch mới cho ứng viên.",
    cot: [
      { k: "ten_ung_vien", nhan: "Ứng viên", kieu: "chu", batBuoc: true },
      { k: "vi_tri", nhan: "Vị trí ứng tuyển", kieu: "chu", the: true },
      { k: "vong", nhan: "Vòng", kieu: "chon", luaChon: ["Sàng lọc điện thoại", "Vòng 1", "Vòng 2", "Vòng cuối"], mac: "Vòng 1", the: true },
      { k: "thoi_gian", nhan: "Thời gian", kieu: "gio", batBuoc: true, the: true },
      { k: "hinh_thuc", nhan: "Hình thức", kieu: "chon", luaChon: ["Trực tiếp", "Online", "Điện thoại"], mac: "Trực tiếp", the: true },
      { k: "dia_diem", nhan: "Địa điểm / link", kieu: "chu" },
      { k: "nguoi_phong_van_id", nhan: "Người phỏng vấn", kieu: "nv", the: true },
      { k: "ket_qua", nhan: "Kết quả", kieu: "chon", luaChon: ["Chờ", "Đạt", "Không đạt", "Hoãn", "Vắng mặt"], mac: "Chờ" },
      { k: "nhan_xet", nhan: "Nhận xét", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "offer-tuyen-dung", ten: "Offer", nhom: "Tuyển dụng", bang: "offer_tuyen_dung", tieuDe: "ten_ung_vien", trangThai: "trang_thai",
    moTa: "Thư mời nhận việc: mức lương đề xuất, hạn trả lời, ngày nhận việc và kết quả.",
    sapXep: { cot: "tao_luc", giam: true }, canhBao: { cot: "han_tra_loi", ngay: 3, nhan: "Sắp hết hạn trả lời" }, trong: "Chưa có offer nào. Thêm khi ứng viên đã qua vòng cuối.",
    cot: [
      { k: "ten_ung_vien", nhan: "Ứng viên", kieu: "chu", batBuoc: true },
      { k: "vi_tri", nhan: "Vị trí", kieu: "chu", batBuoc: true, the: true },
      { k: "luong_de_xuat", nhan: "Lương đề xuất (đ)", kieu: "tien", the: true },
      { k: "ngay_gui", nhan: "Ngày gửi", kieu: "ngay" },
      { k: "han_tra_loi", nhan: "Hạn trả lời", kieu: "ngay", the: true },
      { k: "ngay_nhan_viec", nhan: "Ngày nhận việc", kieu: "ngay", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Soạn", "Chờ duyệt", "Đã gửi", "Đồng ý", "Từ chối", "Thương lượng", "Huỷ"], mac: "Soạn" },
      { k: "ly_do_tu_choi", nhan: "Lý do từ chối", kieu: "nhieu", rong: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "de-xuat-phe-duyet", ten: "Đề xuất nhân sự cần duyệt", nhom: "Hợp đồng & thăng tiến", bang: "de_xuat_phe_duyet", tieuDe: "tieu_de", trangThai: "trang_thai",
    moTa: "Đề xuất tuyển người, ngân sách, offer hoặc điều chỉnh nhân sự gửi lãnh đạo duyệt.",
    sapXep: { cot: "tao_luc", giam: true }, trong: "Chưa có đề xuất nào.",
    cot: [
      { k: "loai", nhan: "Loại đề xuất", kieu: "chon", luaChon: ["Tuyển dụng", "Ngân sách tuyển dụng", "Offer", "Điều chỉnh nhân sự"], mac: "Tuyển dụng", the: true },
      { k: "tieu_de", nhan: "Tiêu đề", kieu: "chu", batBuoc: true },
      { k: "nguoi_de_xuat_id", nhan: "Người đề xuất", kieu: "nv", the: true },
      { k: "so_tien", nhan: "Số tiền (đ)", kieu: "tien", the: true },
      { k: "noi_dung", nhan: "Nội dung", kieu: "nhieu", rong: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Chờ duyệt", "Đã duyệt", "Từ chối"], mac: "Chờ duyệt" },
      { k: "nguoi_duyet_id", nhan: "Người duyệt", kieu: "nv" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "kpi-chi-tieu", ten: "Chỉ tiêu KPI", nhom: "KPI & thi đua", bang: "kpi_chi_tieu", tieuDe: "ten",
    moTa: "Chỉ tiêu có mục tiêu NGÀY, chung cho mọi khối hoặc riêng một khối; trọng số 1-10 cho điểm tổng.",
    sapXep: { cot: "tao_luc" }, trong: "Chưa có chỉ tiêu. Thêm chỉ tiêu đầu tiên (vd Cuộc gọi/ngày, mục tiêu 20).",
    cot: [
      { k: "ten", nhan: "Tên chỉ tiêu", kieu: "chu", batBuoc: true, goiY: "Cuộc gọi chăm sóc" },
      { k: "khoi_id", nhan: "Áp cho khối (trống = mọi khối)", kieu: "khoi", the: true },
      { k: "muc_tieu_ngay", nhan: "Mục tiêu mỗi ngày", kieu: "so", batBuoc: true, mac: 1, the: true, goiY: "Phải lớn hơn 0" },
      { k: "don_vi", nhan: "Đơn vị", kieu: "chu", the: true, goiY: "cuộc / đơn / bài" },
      { k: "trong_so", nhan: "Trọng số (1-10)", kieu: "so", mac: 1, the: true },
      { k: "chieu", nhan: "Chiều tốt", kieu: "chon", luaChon: ["Càng cao càng tốt", "Càng thấp càng tốt"], mac: "Càng cao càng tốt", the: true },
      { k: "hoat_dong", nhan: "Đang dùng", kieu: "co", mac: true },
    ],
  },
  {
    ma: "kpi-thuong", ten: "Khen thưởng thi đua", nhom: "KPI & thi đua", bang: "kpi_thuong", tieuDe: "pham_vi", chiGiamDocSua: true,
    moTa: "Phần thưởng cho hạng 1-2-3 theo tháng/quý, cho phòng, cá nhân trong phòng và cá nhân toàn công ty.",
    sapXep: { cot: "tao_luc" }, trong: "Chưa có mức thưởng. Thêm mức cho hạng 1 của tháng.",
    cot: [
      { k: "ky_loai", nhan: "Kỳ", kieu: "chon", luaChon: ["Tháng", "Quý"], mac: "Tháng", the: true },
      { k: "pham_vi", nhan: "Phạm vi", kieu: "chon", luaChon: ["Phòng", "Cá nhân trong phòng", "Cá nhân toàn công ty"], mac: "Phòng", the: true },
      { k: "hang", nhan: "Hạng (1-3)", kieu: "so", batBuoc: true, mac: 1, the: true },
      { k: "so_tien", nhan: "Số tiền (đ)", kieu: "tien", mac: 0, the: true },
      { k: "mo_ta", nhan: "Mô tả", kieu: "chu", rong: true, goiY: "Cờ thi đua + bữa trưa cả phòng" },
    ],
  },
  {
    ma: "hop-dong-lao-dong", ten: "Hợp đồng lao động", nhom: "Hợp đồng & thăng tiến", bang: "hop_dong_lao_dong", tieuDe: "nhan_vien_id", trangThai: "trang_thai",
    moTa: "Theo dõi từng hợp đồng: loại, lần ký, thời hạn; cảnh báo hợp đồng sắp hết hạn trong 45 ngày để kịp đánh giá tái ký.",
    sapXep: { cot: "den_ngay" }, canhBao: { cot: "den_ngay", ngay: 45, nhan: "Sắp hết hạn" }, trong: "Chưa có hợp đồng. Thêm hợp đồng đầu tiên của nhân sự.",
    cot: [
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", the: true },
      { k: "ten_nguoi_ky", nhan: "Tên người ký (nếu chưa có hồ sơ, vd cộng tác viên)", kieu: "chu" },
      { k: "loai", nhan: "Loại hợp đồng", kieu: "chon", luaChon: ["Thử việc", "Xác định thời hạn", "Không xác định thời hạn", "Cộng tác viên", "Khác"], mac: "Xác định thời hạn", the: true },
      { k: "so_hop_dong", nhan: "Số hợp đồng", kieu: "chu", the: true },
      { k: "lan", nhan: "Lần ký", kieu: "so", mac: 1, khoang: [1, 20] },
      { k: "tu_ngay", nhan: "Từ ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "den_ngay", nhan: "Đến ngày (trống = không thời hạn)", kieu: "ngay", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Chờ ký", "Đang hiệu lực", "Đã hết hạn", "Đã chấm dứt"], mac: "Đang hiệu lực" },
      { k: "pham_vi", nhan: "Phạm vi công việc", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "danh-gia-tai-ky", ten: "Đánh giá tái ký hợp đồng", nhom: "Hợp đồng & thăng tiến", bang: "danh_gia_tai_ky", tieuDe: "nhan_vien_id", trangThai: "de_xuat",
    moTa: "Chấm kết quả, thái độ, năng lực, mức độ phù hợp (1-5) và đề xuất ký tiếp hay không.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có đánh giá tái ký nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", batBuoc: true, the: true },
      { k: "ket_qua_cong_viec", nhan: "Kết quả công việc (1-5)", kieu: "so", coTheTrong: true, khoang: [1, 5], the: true },
      { k: "thai_do", nhan: "Thái độ (1-5)", kieu: "so", coTheTrong: true, khoang: [1, 5], the: true },
      { k: "nang_luc", nhan: "Năng lực (1-5)", kieu: "so", coTheTrong: true, khoang: [1, 5], the: true },
      { k: "muc_do_phu_hop", nhan: "Mức độ phù hợp (1-5)", kieu: "so", coTheTrong: true, khoang: [1, 5], the: true },
      { k: "de_xuat", nhan: "Đề xuất", kieu: "chon", luaChon: ["Chờ quyết định", "Ký tiếp có thời hạn", "Ký không thời hạn", "Gia hạn thử việc", "Không tái ký"], mac: "Chờ quyết định" },
      { k: "nguoi_danh_gia_id", nhan: "Người đánh giá", kieu: "nv" },
      { k: "ngay", nhan: "Ngày đánh giá", kieu: "ngay" },
      { k: "nhan_xet", nhan: "Nhận xét và đề xuất", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "bsc-goc-nhin", ten: "Góc nhìn BSC", nhom: "BSC & mục tiêu", bang: "bsc_goc_nhin", tieuDe: "ten",
    moTa: "Bốn góc nhìn chuẩn: Tài chính, Khách hàng, Quy trình nội bộ, Học hỏi và phát triển. Đổi tên hoặc thêm bớt nếu cần.",
    sapXep: { cot: "sap_xep" }, trong: "Chưa có góc nhìn nào.",
    cot: [
      { k: "ten", nhan: "Tên góc nhìn", kieu: "chu", batBuoc: true },
      { k: "sap_xep", nhan: "Thứ tự hiện", kieu: "so", mac: 1, the: true },
      { k: "hoat_dong", nhan: "Đang dùng", kieu: "co", mac: true },
    ],
  },
  {
    ma: "bsc-muc-tieu", ten: "Mục tiêu chiến lược", nhom: "BSC & mục tiêu", bang: "bsc_muc_tieu", tieuDe: "ten",
    moTa: "Mục tiêu của từng góc nhìn (dùng chung nhiều năm); số liệu theo năm nằm ở chỉ số.",
    sapXep: { cot: "sap_xep" }, trong: "Chưa có mục tiêu. Thêm mục tiêu đầu tiên cho một góc nhìn.",
    cot: [
      { k: "ten", nhan: "Tên mục tiêu", kieu: "chu", batBuoc: true, goiY: "Tăng doanh thu bán lẻ" },
      { k: "goc_nhin_id", nhan: "Góc nhìn", kieu: "tc", bangTc: "bsc_goc_nhin", batBuoc: true, the: true },
      { k: "bat_dau", nhan: "Bắt đầu", kieu: "ngay", the: true },
      { k: "ket_thuc", nhan: "Kết thúc", kieu: "ngay", the: true },
      { k: "sap_xep", nhan: "Thứ tự hiện", kieu: "so", mac: 1 },
      { k: "hoat_dong", nhan: "Đang dùng", kieu: "co", mac: true },
      { k: "mo_ta", nhan: "Mô tả", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "bsc-chi-so", ten: "Chỉ số BSC theo năm", nhom: "BSC & mục tiêu", bang: "bsc_chi_so", tieuDe: "ten",
    moTa: "Chỉ số đo từng mục tiêu: đơn vị, cách gộp, trọng số. Kế hoạch và thực tế từng tháng nhập ở “Số liệu BSC”.",
    sapXep: { cot: "sap_xep" }, trong: "Chưa có chỉ số. Thêm chỉ số cho một mục tiêu.",
    cot: [
      { k: "ten", nhan: "Tên chỉ số", kieu: "chu", batBuoc: true, goiY: "Doanh thu" },
      { k: "nam", nhan: "Năm", kieu: "so", batBuoc: true, mac: 2026, khoang: [2020, 2100], the: true },
      { k: "muc_tieu_id", nhan: "Mục tiêu", kieu: "tc", bangTc: "bsc_muc_tieu", batBuoc: true, the: true },
      { k: "don_vi", nhan: "Đơn vị", kieu: "chu", the: true, goiY: "triệu đồng / đơn / %" },
      { k: "cach_gop", nhan: "Cách gộp các tháng", kieu: "chon", luaChon: ["Cộng dồn", "Trung bình", "Cuối kỳ"], mac: "Cộng dồn", the: true },
      { k: "trong_so", nhan: "Trọng số (%, tương đối)", kieu: "so", mac: 0, the: true },
      { k: "sap_xep", nhan: "Thứ tự hiện", kieu: "so", mac: 1 },
      { k: "hoat_dong", nhan: "Đang dùng", kieu: "co", mac: true },
      { k: "duong_dan_bao_cao", nhan: "Đường dẫn báo cáo nguồn", kieu: "chu", rong: true },
      { k: "mo_ta", nhan: "Mô tả", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "bsc-giao-chi-so", ten: "Giao chỉ số cho nhân sự", nhom: "BSC & mục tiêu", bang: "bsc_chi_so_nguoi", tieuDe: "chi_so_id",
    moTa: "Chỉ số nào giao cho ai làm mục tiêu cá nhân. Người được giao tự nhập thực tế hằng tháng ở “Mục tiêu của tôi”.",
    sapXep: { cot: "id" }, trong: "Chưa giao chỉ số cho ai.",
    cot: [
      { k: "chi_so_id", nhan: "Chỉ số", kieu: "tc", bangTc: "bsc_chi_so", batBuoc: true },
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", batBuoc: true, the: true },
    ],
  },
  {
    ma: "bsc-ke-hoach-hanh-dong", ten: "Kế hoạch hành động", nhom: "BSC & mục tiêu", bang: "bsc_ke_hoach_hanh_dong", tieuDe: "ten", trangThai: "uu_tien",
    moTa: "Việc cụ thể để đạt chỉ số: ai làm, ai giao, ai giám sát, ưu tiên P0 (gấp nhất) đến P3, thời gian và tiến độ.",
    sapXep: { cot: "ket_thuc" }, canhBao: { cot: "ket_thuc", ngay: 7, nhan: "Sắp đến hạn" }, trong: "Chưa có kế hoạch hành động.",
    cot: [
      { k: "ten", nhan: "Tên việc", kieu: "chu", batBuoc: true },
      { k: "chi_so_id", nhan: "Chỉ số", kieu: "tc", bangTc: "bsc_chi_so", batBuoc: true, the: true },
      { k: "nguoi_thuc_hien_id", nhan: "Người thực hiện", kieu: "nv", batBuoc: true, the: true },
      { k: "nguoi_giao_id", nhan: "Người giao", kieu: "nv" },
      { k: "nguoi_giam_sat_id", nhan: "Người giám sát", kieu: "nv" },
      { k: "uu_tien", nhan: "Ưu tiên", kieu: "chon", luaChon: ["P0", "P1", "P2", "P3"], mac: "P2" },
      { k: "bat_dau", nhan: "Bắt đầu", kieu: "ngay", batBuoc: true, the: true },
      { k: "ket_thuc", nhan: "Kết thúc", kieu: "ngay", batBuoc: true, the: true },
      { k: "tien_do", nhan: "Tiến độ (0-100%)", kieu: "so", mac: 0, khoang: [0, 100], the: true },
      { k: "ket_qua", nhan: "Kết quả", kieu: "nhieu", rong: true },
      { k: "mo_ta", nhan: "Mô tả", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "pd-danh-muc", ten: "Sửa danh sách lựa chọn", nhom: "Phê duyệt", bang: "pd_danh_muc", tieuDe: "gia_tri", trangThai: "loai",
    moTa: "Thêm, đổi, xoá từng lựa chọn của các ô chọn trong phiếu. Bấm tên danh sách ở hàng lọc để chỉ xem một danh sách. Danh sách còn trống thì phiếu cho nhập chữ tự do. Xem phiếu nào dùng danh sách nào ở màn Lựa chọn trong phiếu.",
    sapXep: { cot: "loai" }, trong: "Chưa có danh mục.",
    cot: [
      { k: "loai", nhan: "Danh mục", kieu: "chon", luaChon: ["Đơn vị làm việc", "Nhóm làm việc", "Bộ phận", "Phòng ban", "Chức vụ", "Vị trí", "Khoản chi", "Tài khoản quỹ", "Loại nghỉ"], batBuoc: true, the: true },
      { k: "gia_tri", nhan: "Giá trị", kieu: "chu", batBuoc: true },
      { k: "thu_tu", nhan: "Thứ tự", kieu: "so", mac: 0 },
    ],
  },
  {
    ma: "hop-dong-phu-luc", ten: "Phụ lục hợp đồng", nhom: "Hồ sơ & hợp đồng", bang: "hop_dong_phu_luc", tieuDe: "nhan_vien_id", trangThai: "trang_thai",
    moTa: "Phụ lục gia hạn, điều chỉnh lương, chức danh hoặc địa điểm của hợp đồng đang có. Gia hạn thì nhập ngày hết hạn mới.",
    sapXep: { cot: "ngay_hieu_luc", giam: true }, trong: "Chưa có phụ lục nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", batBuoc: true, the: true },
      { k: "so_hop_dong", nhan: "Thuộc hợp đồng số", kieu: "chu", the: true },
      { k: "so_phu_luc", nhan: "Số phụ lục", kieu: "chu", the: true },
      { k: "loai_thay_doi", nhan: "Nội dung thay đổi", kieu: "chon", luaChon: ["Gia hạn", "Điều chỉnh lương", "Điều chỉnh chức danh", "Điều chỉnh địa điểm", "Khác"], mac: "Khác", the: true },
      { k: "ngay_hieu_luc", nhan: "Hiệu lực từ", kieu: "ngay", batBuoc: true, the: true },
      { k: "den_ngay_moi", nhan: "Hết hạn mới (khi gia hạn)", kieu: "ngay" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Chờ ký", "Đã ký"], mac: "Chờ ký" },
      { k: "noi_dung", nhan: "Nội dung phụ lục", kieu: "nhieu", batBuoc: true, rong: true },
    ],
  },
  {
    ma: "tai-san-cap-phat", ten: "Tài sản cấp phát", nhom: "Hồ sơ & hợp đồng", bang: "tai_san_cap_phat", tieuDe: "ten_tai_san", trangThai: "tinh_trang",
    moTa: "Tài sản công ty cấp cho từng người (máy, điện thoại, thẻ, đồng phục…) và ngày trả. Đây là danh sách dùng khi bàn giao lúc nghỉ việc: còn “Đang giữ” là chưa bàn giao xong.",
    sapXep: { cot: "ngay_cap", giam: true }, trong: "Chưa cấp tài sản nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Người nhận", kieu: "nv", batBuoc: true, the: true },
      { k: "ten_tai_san", nhan: "Tài sản", kieu: "chu", batBuoc: true, goiY: "Laptop Dell" },
      { k: "ma_tai_san", nhan: "Mã / số seri", kieu: "chu", the: true },
      { k: "so_luong", nhan: "Số lượng", kieu: "so", batBuoc: true, mac: 1, khoang: [1, 1000], the: true },
      { k: "ngay_cap", nhan: "Ngày cấp", kieu: "ngay", batBuoc: true, the: true },
      { k: "ngay_tra", nhan: "Ngày trả", kieu: "ngay" },
      { k: "tinh_trang", nhan: "Tình trạng", kieu: "chon", luaChon: ["Đang giữ", "Đã trả", "Mất/hỏng"], mac: "Đang giữ" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "tang-ca", ten: "Giờ tăng ca", nhom: "Công, lương & bảo hiểm", bang: "tang_ca", tieuDe: "nhan_vien_id",
    moTa: "Giờ làm thêm đã xác nhận, tự có khi phiếu “xác nhận làm thêm giờ” được duyệt; nhập tay ở đây khi cần bổ sung. Cuối tháng tự cộng vào bảng lương theo ngày thường/nghỉ tuần/lễ. Giới hạn giờ theo tham số lương (chờ kế toán/luật sư xác nhận).",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có giờ tăng ca nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", batBuoc: true, the: true },
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "so_gio", nhan: "Số giờ (0,5 - 12)", kieu: "so", batBuoc: true, mac: 1, khoang: [1, 12], the: true },
      { k: "loai_ngay", nhan: "Loại ngày", kieu: "chon", luaChon: ["Ngày thường", "Ngày nghỉ tuần", "Ngày lễ"], mac: "Ngày thường", the: true },
      { k: "ly_do", nhan: "Lý do", kieu: "chu", rong: true },
    ],
  },
  {
    ma: "thuong-hoa-hong", ten: "Thưởng, hoa hồng, phụ cấp khác", nhom: "Công, lương & bảo hiểm", bang: "thuong_hoa_hong", tieuDe: "nhan_vien_id",
    moTa: "Khoản thưởng, hoa hồng, phụ cấp khác theo ngày phát sinh; khi lập bảng lương của tháng đó sẽ tự cộng vào dòng lương (hoa hồng riêng, thưởng và phụ cấp khác gộp “thưởng khác”).",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có khoản thưởng/hoa hồng nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", batBuoc: true, the: true },
      { k: "ngay", nhan: "Ngày phát sinh", kieu: "ngay", batBuoc: true, the: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Thưởng", "Hoa hồng", "Phụ cấp khác"], mac: "Thưởng", the: true },
      { k: "so_tien", nhan: "Số tiền (đ)", kieu: "tien", batBuoc: true, mac: 0, the: true },
      { k: "ly_do", nhan: "Lý do", kieu: "chu", rong: true },
    ],
  },
  {
    ma: "ke-hoach-dao-tao", ten: "Kế hoạch đào tạo", nhom: "Đào tạo", bang: "dao_tao_ke_hoach", tieuDe: "chu_de", trangThai: "trang_thai",
    moTa: "Các đợt đào tạo dự kiến và đang làm: chủ đề, khối tham gia, hình thức, ngày, số người, ngân sách, người phụ trách.",
    sapXep: { cot: "ngay_du_kien" }, canhBao: { cot: "ngay_du_kien", ngay: 14, nhan: "Sắp diễn ra" }, trong: "Chưa có kế hoạch đào tạo nào. Thêm đợt đào tạo đầu tiên.",
    cot: [
      { k: "chu_de", nhan: "Chủ đề", kieu: "chu", batBuoc: true, rong: true },
      { k: "khoi_id", nhan: "Khối tham gia", kieu: "khoi", the: true },
      { k: "hinh_thuc", nhan: "Hình thức", kieu: "chon", luaChon: ["Nội bộ", "Thuê ngoài", "Online", "Kèm cặp"], mac: "Nội bộ", the: true },
      { k: "ngay_du_kien", nhan: "Ngày dự kiến", kieu: "ngay", the: true },
      { k: "so_nguoi", nhan: "Số người", kieu: "so", khoang: [1, 1000], coTheTrong: true, the: true },
      { k: "ngan_sach", nhan: "Ngân sách (đ)", kieu: "tien", coTheTrong: true },
      { k: "nguoi_phu_trach", nhan: "Người phụ trách", kieu: "chu" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Dự kiến", "Đã duyệt", "Đang diễn ra", "Hoàn thành", "Huỷ"], mac: "Dự kiến" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "khoa-hoc-chung-chi", ten: "Khoá học và chứng chỉ", nhom: "Đào tạo", bang: "dao_tao_khoa_hoc", tieuDe: "nhan_vien_id", trangThai: "trang_thai",
    moTa: "Khoá học, chứng chỉ của từng người, ngày hoàn thành, ngày hết hạn (chứng chỉ có hạn sẽ báo trước 60 ngày) và chi phí.",
    sapXep: { cot: "ngay_hoan_thanh", giam: true }, canhBao: { cot: "ngay_het_han", ngay: 60, nhan: "Chứng chỉ sắp hết hạn" }, trong: "Chưa ghi khoá học hay chứng chỉ nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", batBuoc: true, the: true },
      { k: "ten_khoa", nhan: "Tên khoá / chứng chỉ", kieu: "chu", batBuoc: true, rong: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Khoá học", "Chứng chỉ", "Chứng nhận nội bộ"], mac: "Khoá học", the: true },
      { k: "don_vi_cap", nhan: "Đơn vị đào tạo / cấp", kieu: "chu", the: true },
      { k: "ngay_hoan_thanh", nhan: "Ngày hoàn thành", kieu: "ngay", the: true },
      { k: "ngay_het_han", nhan: "Ngày hết hạn", kieu: "ngay" },
      { k: "chi_phi", nhan: "Chi phí (đ)", kieu: "tien", coTheTrong: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang học", "Đã hoàn thành", "Không đạt"], mac: "Đang học" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "ky-luat", ten: "Kỷ luật", nhom: "KPI & thi đua", bang: "ky_luat", tieuDe: "nhan_vien_id", trangThai: "hinh_thuc",
    moTa: "Ghi nhận kỷ luật lao động: hành vi, hình thức, căn cứ nội quy, số quyết định. Các hình thức theo Bộ luật Lao động, chờ luật sư xác nhận trước khi áp dụng chính thức. Chỉ Quản trị xem.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có hồ sơ kỷ luật nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", batBuoc: true, the: true },
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "hinh_thuc", nhan: "Hình thức", kieu: "chon", luaChon: ["Nhắc nhở", "Khiển trách", "Kéo dài thời hạn nâng lương", "Cách chức", "Sa thải"], mac: "Khiển trách", the: true },
      { k: "hanh_vi", nhan: "Hành vi vi phạm", kieu: "nhieu", batBuoc: true, rong: true },
      { k: "can_cu", nhan: "Căn cứ (điều trong nội quy)", kieu: "chu", the: true },
      { k: "so_quyet_dinh", nhan: "Số quyết định", kieu: "chu" },
      { k: "nguoi_quyet_dinh", nhan: "Người quyết định", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "khung-cap-bac", ten: "Khung cấp bậc", nhom: "Hồ sơ & hợp đồng", bang: "khung_cap_bac", tieuDe: "ten_cap",
    moTa: "Các cấp bậc theo thứ tự, điều kiện lên cấp và khoảng lương tham chiếu. Khoảng lương chờ chị Lâm chốt, để trống đến khi có.",
    sapXep: { cot: "thu_tu" }, trong: "Chưa có cấp bậc nào. Thêm cấp thấp nhất trước (thứ tự 1).",
    cot: [
      { k: "ma_cap", nhan: "Mã cấp", kieu: "chu", batBuoc: true, the: true, goiY: "L1" },
      { k: "ten_cap", nhan: "Tên cấp", kieu: "chu", batBuoc: true, the: true },
      { k: "thu_tu", nhan: "Thứ tự (1 = thấp nhất)", kieu: "so", batBuoc: true, mac: 1, khoang: [1, 99], the: true },
      { k: "khoi_id", nhan: "Áp cho khối (trống = mọi khối)", kieu: "khoi", the: true },
      { k: "luong_tu", nhan: "Lương từ (đ)", kieu: "tien", coTheTrong: true },
      { k: "luong_den", nhan: "Lương đến (đ)", kieu: "tien", coTheTrong: true },
      { k: "dieu_kien", nhan: "Điều kiện lên cấp", kieu: "nhieu", rong: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "doanh-thu-ngan-sach", ten: "Doanh thu và ngân sách quỹ lương", nhom: "Số liệu báo cáo HR", bang: "chi_so_hr_ky", tieuDe: "thang",
    moTa: "Mỗi tháng một dòng (nhập ngày mùng 1): doanh thu và ngân sách quỹ lương. Báo cáo HR dùng để tính quỹ lương so với ngân sách, quỹ lương trên doanh thu, doanh thu bình quân mỗi người. Chưa nhập thì báo cáo để trống.",
    sapXep: { cot: "thang", giam: true }, trong: "Chưa nhập tháng nào.",
    cot: [
      { k: "thang", nhan: "Tháng (ngày mùng 1)", kieu: "ngay", batBuoc: true, the: true },
      { k: "doanh_thu", nhan: "Doanh thu (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "ngan_sach_quy_luong", nhan: "Ngân sách quỹ lương (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "dinh-bien", ten: "Định biên theo khối", nhom: "Số liệu báo cáo HR", bang: "chi_so_hr_dinh_bien", tieuDe: "khoi_id",
    moTa: "Số người được duyệt của từng khối. Báo cáo HR so với số người thực tế.",
    sapXep: { cot: "tao_luc" }, trong: "Chưa có định biên khối nào.",
    cot: [
      { k: "khoi_id", nhan: "Khối", kieu: "khoi", batBuoc: true, the: true },
      { k: "so_dinh_bien", nhan: "Số người định biên", kieu: "so", batBuoc: true, mac: 1, khoang: [0, 10000], the: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "vi-tri-chu-chot", ten: "Vị trí chủ chốt và người kế cận", nhom: "Số liệu báo cáo HR", bang: "chi_so_hr_chu_chot", tieuDe: "vi_tri", trangThai: "muc_san_sang",
    moTa: "Các vị trí chủ chốt, ai đang giữ và ai kế cận. Báo cáo HR tính tỷ lệ vị trí chủ chốt đã có người kế cận.",
    sapXep: { cot: "tao_luc" }, trong: "Chưa khai báo vị trí chủ chốt nào.",
    cot: [
      { k: "vi_tri", nhan: "Vị trí chủ chốt", kieu: "chu", batBuoc: true, the: true, goiY: "Trưởng phòng Kinh doanh" },
      { k: "khoi_id", nhan: "Khối", kieu: "khoi", the: true },
      { k: "nguoi_giu_id", nhan: "Người đang giữ", kieu: "nv", the: true },
      { k: "ke_can_id", nhan: "Người kế cận", kieu: "nv", the: true },
      { k: "muc_san_sang", nhan: "Mức sẵn sàng", kieu: "chon", luaChon: ["Sẵn sàng ngay", "Sau 1 năm", "Chưa sẵn sàng"], coTheTrong: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "tam-ung", ten: "Tạm ứng nhân viên", nhom: "Số liệu báo cáo HR", bang: "tam_ung_nhan_vien", tieuDe: "nhan_vien_id", trangThai: "tinh_trang",
    moTa: "Các khoản tạm ứng của từng người. Còn “Chưa thu hồi” sẽ hiện ở Báo cáo HR cùng tài sản chưa thu hồi của người nghỉ việc.",
    sapXep: { cot: "ngay_ung", giam: true }, trong: "Chưa ghi khoản tạm ứng nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Người tạm ứng", kieu: "nv", batBuoc: true, the: true },
      { k: "so_tien", nhan: "Số tiền (đ)", kieu: "tien", batBuoc: true, the: true },
      { k: "ngay_ung", nhan: "Ngày ứng", kieu: "ngay", batBuoc: true, the: true },
      { k: "tinh_trang", nhan: "Tình trạng", kieu: "chon", luaChon: ["Chưa thu hồi", "Đã thu hồi"], mac: "Chưa thu hồi" },
      { k: "ngay_thu_hoi", nhan: "Ngày thu hồi", kieu: "ngay" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "lich-noi-dung", ten: "Lịch nội dung", nhom: "Marketing & Thương hiệu", bang: "mkt_lich_noi_dung", tieuDe: "chu_de", trangThai: "trang_thai",
    moTa: "Lịch bài đăng theo ngày và kênh: chủ đề, người làm, đã duyệt chưa, đã đăng chưa. Mỗi bài một dòng.",
    sapXep: { cot: "ngay_dang", giam: true }, trong: "Chưa có bài nào trong lịch.",
    quayVe: { href: "/quang-cao", nhan: "Quảng cáo" },
    cot: [
      { k: "ngay_dang", nhan: "Ngày đăng", kieu: "ngay", batBuoc: true, the: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: KENH_ND, mac: "Facebook", the: true },
      { k: "chu_de", nhan: "Chủ đề", kieu: "chu", batBuoc: true },
      { k: "nguoi_lam_id", nhan: "Người làm", kieu: "nv", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Lên ý tưởng", "Đang làm", "Chờ duyệt", "Đã duyệt", "Đã đăng", "Huỷ"], mac: "Lên ý tưởng" },
      { k: "link_bai", nhan: "Link bài", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "duyet-noi-dung", ten: "Duyệt nội dung quảng cáo", nhom: "Marketing & Thương hiệu", bang: "mkt_duyet_noi_dung", tieuDe: "tieu_de", trangThai: "trang_thai",
    moTa: "Nội dung quảng cáo gửi duyệt trước khi đăng, kèm danh sách kiểm: không dùng từ cấm hoặc hứa công dụng như thuốc, sản phẩm có số công bố, hình ảnh khách có đồng ý. Danh sách từ cấm chính thức chờ chị Lâm hoặc luật sư xác nhận.",
    sapXep: { cot: "ngay_gui", giam: true }, trong: "Chưa có nội dung nào gửi duyệt.",
    quayVe: { href: "/quang-cao", nhan: "Quảng cáo" },
    cot: [
      { k: "tieu_de", nhan: "Tiêu đề nội dung", kieu: "chu", batBuoc: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: KENH_ND, mac: "Facebook", the: true },
      { k: "ngay_gui", nhan: "Ngày gửi", kieu: "ngay", batBuoc: true, the: true },
      { k: "nguoi_gui_id", nhan: "Người gửi", kieu: "nv", the: true },
      { k: "noi_dung", nhan: "Nội dung", kieu: "nhieu", rong: true },
      { k: "link", nhan: "Link bản nháp", kieu: "chu" },
      { k: "khong_tu_cam", nhan: "Không có từ cấm, không hứa công dụng như thuốc", kieu: "co", mac: false },
      { k: "co_so_cong_bo", nhan: "Sản phẩm đã có số công bố", kieu: "co", mac: false },
      { k: "co_dong_y_hinh_anh", nhan: "Hình ảnh người thật đã được đồng ý", kieu: "co", mac: false },
      { k: "trang_thai", nhan: "Kết quả duyệt", kieu: "chon", luaChon: ["Chờ duyệt", "Đạt", "Cần sửa", "Không đạt"], mac: "Chờ duyệt" },
      { k: "nguoi_duyet", nhan: "Người duyệt", kieu: "chu" },
      { k: "nhan_xet", nhan: "Nhận xét", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "kol-koc", ten: "Booking KOL và KOC", nhom: "Marketing & Thương hiệu", bang: "mkt_kol_koc", tieuDe: "ten", trangThai: "trang_thai",
    moTa: "Từng người hợp tác: sản phẩm, chi phí thoả thuận và thực tế, ngày đăng, đã nghiệm thu và thanh toán chưa.",
    sapXep: { cot: "tao_luc", giam: true }, trong: "Chưa có KOL hay KOC nào.",
    quayVe: { href: "/quang-cao", nhan: "Quảng cáo" },
    cot: [
      { k: "ten", nhan: "Tên", kieu: "chu", batBuoc: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["KOL", "KOC"], mac: "KOC", the: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: ["Facebook", "TikTok", "Instagram", "YouTube", "Khác"], mac: "TikTok", the: true },
      { k: "link_kenh", nhan: "Link kênh", kieu: "chu" },
      { k: "san_pham", nhan: "Sản phẩm hợp tác", kieu: "chu", the: true },
      { k: "chi_phi_thoa_thuan", nhan: "Chi phí thoả thuận (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "chi_phi_thuc_te", nhan: "Chi phí thực tế (đ)", kieu: "tien", coTheTrong: true },
      { k: "ngay_dang", nhan: "Ngày đăng", kieu: "ngay" },
      { k: "nguoi_phu_trach_id", nhan: "Người phụ trách", kieu: "nv" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đã liên hệ", "Đã chốt", "Đã đăng", "Đã nghiệm thu", "Đã thanh toán", "Huỷ"], mac: "Đã liên hệ" },
      { k: "link_bai", nhan: "Link bài đăng", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú, biên bản nghiệm thu", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "ngan-sach-qc", ten: "Ngân sách quảng cáo", nhom: "Marketing & Thương hiệu", bang: "mkt_ngan_sach_qc", tieuDe: "kenh", trangThai: "trang_thai",
    moTa: "Ngân sách quảng cáo duyệt trước theo tháng và kênh, quyết toán sau bằng số thực chi. Số chi tiêu tự kéo về nằm ở màn Quảng cáo.",
    sapXep: { cot: "thang", giam: true }, trong: "Chưa có ngân sách tháng nào.",
    quayVe: { href: "/quang-cao", nhan: "Quảng cáo" },
    cot: [
      { k: "thang", nhan: "Tháng (ngày mùng 1)", kieu: "ngay", batBuoc: true, the: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: ["Facebook", "TikTok", "Shopee", "Google", "KOL/KOC", "Khác"], mac: "Facebook", the: true },
      { k: "ngan_sach_duyet", nhan: "Ngân sách duyệt (đ)", kieu: "tien", batBuoc: true, the: true },
      { k: "thuc_chi", nhan: "Thực chi (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Chờ duyệt", "Đã duyệt", "Đã quyết toán"], mac: "Chờ duyệt" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "gian-hang-san", ten: "Gian hàng sàn", nhom: "Kinh doanh", bang: "kd_gian_hang", tieuDe: "ten", trangThai: "trang_thai",
    moTa: "Các gian hàng bán trên sàn thương mại điện tử: nền tảng, link, người vận hành, đang bán hay tạm dừng.",
    sapXep: { cot: "tao_luc" }, trong: "Chưa khai báo gian hàng nào.",
    cot: [
      { k: "ten", nhan: "Tên gian hàng", kieu: "chu", batBuoc: true },
      { k: "nen_tang", nhan: "Nền tảng", kieu: "chon", luaChon: ["Shopee", "TikTok Shop", "Lazada", "Facebook Shop", "Website", "Khác"], mac: "Shopee", the: true },
      { k: "link", nhan: "Link gian hàng", kieu: "chu" },
      { k: "nguoi_van_hanh_id", nhan: "Người vận hành", kieu: "nv", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang bán", "Tạm dừng", "Đóng"], mac: "Đang bán" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "doi-soat-san", ten: "Đối soát tiền sàn", nhom: "Kinh doanh", bang: "kd_doi_soat_san", tieuDe: "gian_hang_id", trangThai: "trang_thai",
    moTa: "Mỗi tháng và gian hàng một dòng: doanh thu theo đơn so với tiền sàn chuyển về. Lệch thì ghi nguyên nhân ở ghi chú cho tới khi xử lý xong.",
    sapXep: { cot: "thang", giam: true }, trong: "Chưa có kỳ đối soát nào. Thêm gian hàng ở màn Gian hàng sàn trước.",
    cot: [
      { k: "gian_hang_id", nhan: "Gian hàng", kieu: "tc", bangTc: "kd_gian_hang", batBuoc: true, the: true },
      { k: "thang", nhan: "Tháng (ngày mùng 1)", kieu: "ngay", batBuoc: true, the: true },
      { k: "doanh_thu_don", nhan: "Doanh thu theo đơn (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "tien_san_chuyen", nhan: "Tiền sàn chuyển về (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Chờ đối soát", "Khớp", "Lệch, đang xử lý"], mac: "Chờ đối soát" },
      { k: "ghi_chu", nhan: "Ghi chú, nguyên nhân lệch", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "dai-ly-khach-si", ten: "Đại lý và khách sỉ", nhom: "Kinh doanh", bang: "kd_dai_ly", tieuDe: "ten", trangThai: "trang_thai",
    moTa: "Đại lý, khách sỉ và cộng tác viên: liên hệ, chiết khấu, hạn mức công nợ, hợp đồng và người chăm sóc. Báo trước 45 ngày khi hợp đồng sắp hết hạn. Hợp đồng gửi ra ngoài cần chị Lâm đồng ý trước.",
    sapXep: { cot: "tao_luc", giam: true }, canhBao: { cot: "hop_dong_den", ngay: 45, nhan: "Sắp hết hợp đồng" }, trong: "Chưa có đại lý hay khách sỉ nào.",
    cot: [
      { k: "ten", nhan: "Tên", kieu: "chu", batBuoc: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Đại lý", "Khách sỉ", "Cộng tác viên"], mac: "Đại lý", the: true },
      { k: "dien_thoai", nhan: "Điện thoại", kieu: "chu", the: true },
      { k: "dia_chi", nhan: "Địa chỉ", kieu: "chu" },
      { k: "chiet_khau", nhan: "Chiết khấu (%)", kieu: "so", coTheTrong: true, khoang: [0, 100], the: true },
      { k: "han_muc_cong_no", nhan: "Hạn mức công nợ (đ)", kieu: "tien", coTheTrong: true },
      { k: "hop_dong_tu", nhan: "Hợp đồng từ", kieu: "ngay" },
      { k: "hop_dong_den", nhan: "Hợp đồng đến", kieu: "ngay" },
      { k: "nguoi_phu_trach_id", nhan: "Người chăm sóc", kieu: "nv" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang hợp tác", "Tạm dừng", "Ngừng"], mac: "Đang hợp tác" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "cong-no-dai-ly", ten: "Công nợ đại lý", nhom: "Kinh doanh", bang: "kd_cong_no_dai_ly", tieuDe: "dai_ly_id", trangThai: "loai",
    moTa: "Mỗi lần phát sinh nợ hoặc đã thu tiền của đại lý, khách sỉ là một dòng, kèm hạn thanh toán. Số dư của từng người là tổng phát sinh trừ tổng đã thu.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có khoản công nợ nào. Thêm đại lý ở màn Đại lý và khách sỉ trước.",
    cot: [
      { k: "dai_ly_id", nhan: "Đại lý, khách sỉ", kieu: "tc", bangTc: "kd_dai_ly", batBuoc: true, the: true },
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Phát sinh", "Đã thu"], mac: "Phát sinh" },
      { k: "so_tien", nhan: "Số tiền (đ)", kieu: "tien", batBuoc: true, the: true },
      { k: "han_thanh_toan", nhan: "Hạn thanh toán", kieu: "ngay", the: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "phien-livestream", ten: "Phiên livestream", nhom: "Kinh doanh", bang: "kd_phien_live", tieuDe: "chu_de", trangThai: "trang_thai",
    moTa: "Lịch và kết quả từng phiên live: nền tảng, host, chủ đề, doanh thu và số đơn sau phiên.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có phiên live nào.",
    cot: [
      { k: "ngay", nhan: "Ngày live", kieu: "ngay", batBuoc: true, the: true },
      { k: "nen_tang", nhan: "Nền tảng", kieu: "chon", luaChon: ["TikTok", "Shopee", "Facebook"], mac: "TikTok", the: true },
      { k: "chu_de", nhan: "Chủ đề", kieu: "chu", batBuoc: true },
      { k: "host_id", nhan: "Host", kieu: "nv", the: true },
      { k: "doanh_thu", nhan: "Doanh thu (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "so_don", nhan: "Số đơn", kieu: "so", coTheTrong: true, khoang: [0, 1000000] },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Lên kế hoạch", "Đã live", "Huỷ"], mac: "Lên kế hoạch" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "khieu-nai", ten: "Khiếu nại khách hàng", nhom: "Kinh doanh", bang: "kd_khieu_nai", tieuDe: "noi_dung", trangThai: "trang_thai",
    moTa: "Khiếu nại nhận từ mọi kênh: nội dung, hạn trả lời, người xử lý và kết quả. Báo trước 2 ngày khi sắp đến hạn trả lời. Hạn trả lời cụ thể theo quy trình chờ chị Lâm xác nhận.",
    sapXep: { cot: "ngay_nhan", giam: true }, canhBao: { cot: "han_tra_loi", ngay: 2, nhan: "Sắp đến hạn trả lời" }, trong: "Chưa có khiếu nại nào.",
    cot: [
      { k: "ngay_nhan", nhan: "Ngày nhận", kieu: "ngay", batBuoc: true, the: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: ["Shopee", "TikTok Shop", "Facebook", "Zalo", "Điện thoại", "Khác"], mac: "Shopee", the: true },
      { k: "khach", nhan: "Khách", kieu: "chu", the: true },
      { k: "noi_dung", nhan: "Nội dung khiếu nại", kieu: "nhieu", batBuoc: true, rong: true },
      { k: "han_tra_loi", nhan: "Hạn trả lời", kieu: "ngay", the: true },
      { k: "nguoi_xu_ly_id", nhan: "Người xử lý", kieu: "nv" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Mới", "Đang xử lý", "Đã trả lời", "Đã đóng"], mac: "Mới" },
      { k: "ket_qua", nhan: "Kết quả xử lý", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "chi-tieu-doanh-so", ten: "Chỉ tiêu doanh số", nhom: "Kinh doanh", bang: "kd_chi_tieu", tieuDe: "kenh",
    moTa: "Chỉ tiêu doanh số giao theo tháng và kênh (tổng, sàn, sỉ và đại lý, livestream) so với thực đạt.",
    sapXep: { cot: "thang", giam: true }, trong: "Chưa giao chỉ tiêu tháng nào.",
    cot: [
      { k: "thang", nhan: "Tháng (ngày mùng 1)", kieu: "ngay", batBuoc: true, the: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: ["Tổng", "Sàn", "Sỉ và đại lý", "Livestream"], mac: "Tổng", the: true },
      { k: "chi_tieu", nhan: "Chỉ tiêu (đ)", kieu: "tien", batBuoc: true, the: true },
      { k: "thuc_dat", nhan: "Thực đạt (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "nguoi_phu_trach_id", nhan: "Người phụ trách", kieu: "nv" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "doanh-thu-ngay", ten: "Doanh thu sàn theo ngày", nhom: "Kinh doanh", bang: "kd_doanh_thu_ngay", tieuDe: "gian_hang_id",
    moTa: "Mỗi ngày và gian hàng một dòng: số đơn, doanh thu, đơn huỷ, tiền hoàn. Là số gốc để so với chỉ tiêu và đối soát tiền sàn cuối tháng.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa nhập ngày nào. Thêm gian hàng ở màn Gian hàng sàn trước.",
    cot: [
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "gian_hang_id", nhan: "Gian hàng", kieu: "tc", bangTc: "kd_gian_hang", batBuoc: true, the: true },
      { k: "so_don", nhan: "Số đơn", kieu: "so", coTheTrong: true, khoang: [0, 1000000], the: true },
      { k: "doanh_thu", nhan: "Doanh thu (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "so_don_huy", nhan: "Số đơn huỷ", kieu: "so", coTheTrong: true, khoang: [0, 1000000] },
      { k: "doanh_thu_hoan", nhan: "Tiền hoàn trả khách (đ)", kieu: "tien", coTheTrong: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "don-si", ten: "Đơn bán sỉ", nhom: "Kinh doanh", bang: "kd_don_si", tieuDe: "ma_don", trangThai: "trang_thai",
    moTa: "Đơn bán cho đại lý, khách sỉ từ báo giá tới thu đủ tiền: giá trị, hạn thanh toán, người phụ trách. Phát sinh nợ và thu tiền ghi ở màn Công nợ đại lý.",
    sapXep: { cot: "ngay", giam: true }, canhBao: { cot: "han_thanh_toan", ngay: 3, nhan: "Sắp đến hạn thanh toán" }, trong: "Chưa có đơn sỉ nào. Thêm đại lý ở màn Đại lý và khách sỉ trước.",
    cot: [
      { k: "ma_don", nhan: "Mã đơn", kieu: "chu", batBuoc: true, the: true },
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "dai_ly_id", nhan: "Đại lý, khách sỉ", kieu: "tc", bangTc: "kd_dai_ly", batBuoc: true, the: true },
      { k: "gia_tri", nhan: "Giá trị đơn (đ)", kieu: "tien", batBuoc: true, the: true },
      { k: "han_thanh_toan", nhan: "Hạn thanh toán", kieu: "ngay", the: true },
      { k: "nguoi_phu_trach_id", nhan: "Người phụ trách", kieu: "nv" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Báo giá", "Đã chốt", "Đang giao", "Đã giao", "Đã thu đủ", "Huỷ"], mac: "Báo giá" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "co-hoi-khach-si", ten: "Cơ hội khách sỉ", nhom: "Kinh doanh", bang: "kd_co_hoi", tieuDe: "ten_khach", trangThai: "giai_doan",
    moTa: "Khách sỉ, đại lý tiềm năng từ lần liên hệ đầu tới khi chốt hoặc mất: nguồn, nhu cầu, giá trị dự kiến, ngày liên hệ tiếp. Báo trước 2 ngày khi tới hẹn liên hệ. Chốt xong thì thêm vào màn Đại lý và khách sỉ.",
    sapXep: { cot: "tao_luc", giam: true }, canhBao: { cot: "lien_he_tiep", ngay: 2, nhan: "Sắp tới hẹn liên hệ" }, trong: "Chưa có cơ hội nào.",
    cot: [
      { k: "ten_khach", nhan: "Tên khách", kieu: "chu", batBuoc: true },
      { k: "dien_thoai", nhan: "Điện thoại", kieu: "chu", the: true },
      { k: "nguon", nhan: "Nguồn", kieu: "chon", luaChon: ["Facebook", "Zalo", "Giới thiệu", "Hội chợ, sự kiện", "Khác"], mac: "Khác", the: true },
      { k: "nhu_cau", nhan: "Nhu cầu", kieu: "nhieu", rong: true },
      { k: "gia_tri_du_kien", nhan: "Giá trị dự kiến (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "giai_doan", nhan: "Giai đoạn", kieu: "chon", luaChon: ["Mới", "Đã liên hệ", "Đã báo giá", "Thương lượng", "Đã chốt", "Mất"], mac: "Mới" },
      { k: "lien_he_tiep", nhan: "Liên hệ tiếp ngày", kieu: "ngay", the: true },
      { k: "nguoi_phu_trach_id", nhan: "Người phụ trách", kieu: "nv" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "doi-tra-hoan-hang", ten: "Đổi trả và hoàn hàng", nhom: "Kinh doanh", bang: "kd_doi_tra", tieuDe: "ma_don", trangThai: "trang_thai",
    moTa: "Đơn khách trả hoặc đổi từ mọi kênh: lý do, số tiền hoàn, người xử lý và đã nhận hàng về chưa. Đối chiếu với tiền hoàn ở màn Doanh thu sàn theo ngày.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có đơn đổi trả nào.",
    cot: [
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: ["Shopee", "TikTok Shop", "Lazada", "Facebook Shop", "Sỉ và đại lý", "Khác"], mac: "Shopee", the: true },
      { k: "ma_don", nhan: "Mã đơn", kieu: "chu", the: true },
      { k: "loai", nhan: "Hình thức", kieu: "chon", luaChon: ["Hoàn tiền", "Đổi hàng"], mac: "Hoàn tiền" },
      { k: "ly_do", nhan: "Lý do", kieu: "chon", luaChon: ["Lỗi sản phẩm", "Giao sai hàng", "Hư hỏng khi vận chuyển", "Khách đổi ý", "Khác"], mac: "Khác", the: true },
      { k: "so_tien", nhan: "Số tiền hoàn (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Mới", "Đang xử lý", "Đã nhận hàng về", "Đã hoàn tất", "Từ chối"], mac: "Mới" },
      { k: "nguoi_xu_ly_id", nhan: "Người xử lý", kieu: "nv" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "san-pham", ten: "Danh mục sản phẩm", nhom: "Sản phẩm & Giá", bang: "sp_san_pham", tieuDe: "ten", trangThai: "trang_thai",
    moTa: "Mỗi sản phẩm một dòng với mã riêng: nhà sản xuất, nguồn gốc, quy cách. Mã sản phẩm dùng chung cho giá, kiểm lô, bao bì và hồ sơ công bố.",
    sapXep: { cot: "ma_sp" }, trong: "Chưa có sản phẩm nào.",
    cot: [
      { k: "ma_sp", nhan: "Mã sản phẩm", kieu: "chu", batBuoc: true, the: true, goiY: "HK-001" },
      { k: "ten", nhan: "Tên sản phẩm", kieu: "chu", batBuoc: true },
      { k: "nhom_hang", nhan: "Nhóm hàng", kieu: "chu", the: true },
      { k: "nha_san_xuat", nhan: "Nhà sản xuất", kieu: "chu", the: true },
      { k: "nguon_goc", nhan: "Nguồn gốc", kieu: "chon", luaChon: ["Nhập khẩu", "Sản xuất trong nước"], mac: "Nhập khẩu" },
      { k: "quy_cach", nhan: "Quy cách (dung tích, trọng lượng)", kieu: "chu" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang phát triển", "Đang bán", "Ngừng bán"], mac: "Đang phát triển" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "bang-gia", ten: "Bảng giá theo kênh", nhom: "Sản phẩm & Giá", bang: "sp_gia", tieuDe: "san_pham_id", trangThai: "trang_thai",
    moTa: "Một bảng giá duy nhất: mỗi sản phẩm và kênh (sàn, sỉ, đại lý, lẻ) một dòng với giá vốn, giá niêm yết, chiết khấu, giá bán, ngày hiệu lực. Giá chờ duyệt không được dùng cho tới khi có người duyệt.",
    sapXep: { cot: "tao_luc", giam: true }, trong: "Chưa có giá nào. Thêm sản phẩm ở màn Danh mục sản phẩm trước.",
    cot: [
      { k: "san_pham_id", nhan: "Sản phẩm", kieu: "tc", bangTc: "sp_san_pham", batBuoc: true, the: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: ["Sàn", "Sỉ", "Đại lý", "Lẻ"], mac: "Sàn", the: true },
      { k: "gia_von", nhan: "Giá vốn (đ)", kieu: "tien", coTheTrong: true },
      { k: "gia_niem_yet", nhan: "Giá niêm yết (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "chiet_khau", nhan: "Chiết khấu (%)", kieu: "so", coTheTrong: true, khoang: [0, 100] },
      { k: "gia_ban", nhan: "Giá bán (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "hieu_luc_tu", nhan: "Hiệu lực từ", kieu: "ngay" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Chờ duyệt", "Đã duyệt", "Hết hiệu lực"], mac: "Chờ duyệt" },
      { k: "nguoi_duyet", nhan: "Người duyệt", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "kiem-lo-nhap", ten: "Kiểm lô nhập", nhom: "Sản phẩm & Giá", bang: "sp_kiem_lo", tieuDe: "so_lo", trangThai: "ket_qua",
    moTa: "Mỗi lô hàng nhập một dòng: số lô, ngày nhập, số lượng, hạn dùng, đã có phiếu kiểm nghiệm (COA) chưa, đã lưu mẫu chưa, kết quả. Báo trước 90 ngày khi lô sắp hết hạn dùng.",
    sapXep: { cot: "ngay_nhap", giam: true }, canhBao: { cot: "han_dung", ngay: 90, nhan: "Sắp hết hạn dùng" }, trong: "Chưa có lô nào.",
    cot: [
      { k: "san_pham_id", nhan: "Sản phẩm", kieu: "tc", bangTc: "sp_san_pham", batBuoc: true, the: true },
      { k: "so_lo", nhan: "Số lô", kieu: "chu", batBuoc: true, the: true },
      { k: "ngay_nhap", nhan: "Ngày nhập", kieu: "ngay", batBuoc: true, the: true },
      { k: "so_luong", nhan: "Số lượng", kieu: "so", coTheTrong: true, khoang: [0, 10000000] },
      { k: "han_dung", nhan: "Hạn dùng", kieu: "ngay", the: true },
      { k: "co_coa", nhan: "Có phiếu kiểm nghiệm (COA)", kieu: "co", mac: false },
      { k: "da_luu_mau", nhan: "Đã lưu mẫu", kieu: "co", mac: false },
      { k: "ket_qua", nhan: "Kết quả kiểm", kieu: "chon", luaChon: ["Chờ kiểm", "Đạt", "Không đạt"], mac: "Chờ kiểm" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "phat-trien-san-pham", ten: "Phát triển sản phẩm mới", nhom: "Sản phẩm & Giá", bang: "sp_phat_trien_moi", tieuDe: "ten", trangThai: "trang_thai",
    moTa: "Theo dõi từng sản phẩm mới qua các bước: ý tưởng, làm mẫu, duyệt bao bì, chuẩn bị công bố, ra mắt.",
    sapXep: { cot: "tao_luc", giam: true }, trong: "Chưa có sản phẩm mới nào đang phát triển.",
    cot: [
      { k: "ten", nhan: "Tên sản phẩm mới", kieu: "chu", batBuoc: true },
      { k: "y_tuong", nhan: "Ý tưởng, yêu cầu", kieu: "nhieu", rong: true },
      { k: "nguoi_phu_trach_id", nhan: "Người phụ trách", kieu: "nv", the: true },
      { k: "ngay_du_kien", nhan: "Ngày ra mắt dự kiến", kieu: "ngay", the: true },
      { k: "trang_thai", nhan: "Bước hiện tại", kieu: "chon", luaChon: ["Ý tưởng", "Làm mẫu", "Duyệt bao bì", "Chuẩn bị công bố", "Ra mắt", "Dừng"], mac: "Ý tưởng" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "duyet-bao-bi", ten: "Duyệt bao bì và nhãn", nhom: "Sản phẩm & Giá", bang: "sp_duyet_bao_bi", tieuDe: "tieu_de", trangThai: "trang_thai",
    moTa: "Bao bì và nhãn gửi duyệt trước khi in: đủ thông tin bắt buộc, không ghi công dụng như thuốc, khớp hồ sơ công bố. Danh sách thông tin bắt buộc chính thức chờ chị Lâm hoặc luật sư xác nhận.",
    sapXep: { cot: "tao_luc", giam: true }, trong: "Chưa có bao bì nào gửi duyệt.",
    cot: [
      { k: "tieu_de", nhan: "Tiêu đề", kieu: "chu", batBuoc: true },
      { k: "san_pham_id", nhan: "Sản phẩm", kieu: "tc", bangTc: "sp_san_pham", the: true },
      { k: "link_mau", nhan: "Link mẫu bao bì", kieu: "chu" },
      { k: "du_thong_tin", nhan: "Đủ thông tin bắt buộc trên nhãn", kieu: "co", mac: false },
      { k: "khong_ghi_cong_dung_nhu_thuoc", nhan: "Không ghi công dụng như thuốc", kieu: "co", mac: false },
      { k: "khop_ho_so_cong_bo", nhan: "Khớp hồ sơ công bố", kieu: "co", mac: false },
      { k: "trang_thai", nhan: "Kết quả duyệt", kieu: "chon", luaChon: ["Chờ duyệt", "Đạt", "Cần sửa"], mac: "Chờ duyệt" },
      { k: "nguoi_duyet", nhan: "Người duyệt", kieu: "chu" },
      { k: "nhan_xet", nhan: "Nhận xét", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "ho-so-san-pham", ten: "Hồ sơ theo sản phẩm", nhom: "Pháp lý & Hồ sơ", bang: "pl_ho_so_san_pham", tieuDe: "san_pham_id",
    moTa: "Danh sách kiểm hồ sơ của từng mã sản phẩm: đã có phiếu công bố, hoá đơn nhập, phiếu kiểm nghiệm, nhãn phụ, hợp đồng nhà máy, biên bản giao nhận hồ sơ gốc chưa. Cần xuất trình trong 24 giờ nên phải đủ trước khi bán.",
    sapXep: { cot: "tao_luc", giam: true }, trong: "Chưa lập hồ sơ cho sản phẩm nào. Thêm sản phẩm ở màn Danh mục sản phẩm trước.",
    cot: [
      { k: "san_pham_id", nhan: "Sản phẩm", kieu: "tc", bangTc: "sp_san_pham", batBuoc: true, the: true },
      { k: "co_cong_bo", nhan: "Có phiếu công bố", kieu: "co", mac: false },
      { k: "co_hoa_don_nhap", nhan: "Có hoá đơn, chứng từ nhập", kieu: "co", mac: false },
      { k: "co_coa", nhan: "Có phiếu kiểm nghiệm (COA)", kieu: "co", mac: false },
      { k: "co_nhan_phu", nhan: "Có nhãn phụ tiếng Việt", kieu: "co", mac: false },
      { k: "co_hop_dong_nha_may", nhan: "Có hợp đồng với nhà máy", kieu: "co", mac: false },
      { k: "da_giao_nhan_ho_so_goc", nhan: "Đã giao nhận hồ sơ gốc", kieu: "co", mac: false },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "so-cong-bo", ten: "Sổ công bố sản phẩm", nhom: "Pháp lý & Hồ sơ", bang: "pl_so_cong_bo", tieuDe: "san_pham_id", trangThai: "trang_thai",
    moTa: "Số công bố, cơ quan, ngày công bố và ngày hết hạn của từng sản phẩm. Báo trước 90 ngày khi sắp hết hạn. Mốc báo chờ luật sư xác nhận.",
    sapXep: { cot: "ngay_het_han" }, canhBao: { cot: "ngay_het_han", ngay: 90, nhan: "Sắp hết hạn công bố" }, trong: "Chưa ghi công bố nào.",
    cot: [
      { k: "san_pham_id", nhan: "Sản phẩm", kieu: "tc", bangTc: "sp_san_pham", batBuoc: true, the: true },
      { k: "so_cong_bo", nhan: "Số công bố", kieu: "chu", the: true },
      { k: "co_quan", nhan: "Cơ quan tiếp nhận", kieu: "chu" },
      { k: "ngay_cong_bo", nhan: "Ngày công bố", kieu: "ngay" },
      { k: "ngay_het_han", nhan: "Ngày hết hạn", kieu: "ngay", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang chuẩn bị", "Đã nộp", "Còn hiệu lực", "Hết hiệu lực"], mac: "Đang chuẩn bị" },
      { k: "link_file", nhan: "Link file", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "so-hop-dong", ten: "Sổ hợp đồng", nhom: "Pháp lý & Hồ sơ", bang: "pl_so_hop_dong", tieuDe: "ten", trangThai: "trang_thai",
    moTa: "Hợp đồng với nhà máy, đại lý, dịch vụ, mặt bằng, KOL/KOC: đối tác, ngày ký, ngày hết hạn, giá trị, người phụ trách. Hợp đồng gửi ra ngoài phải có chị Lâm đồng ý trước, ô đánh dấu để ghi nhận điều đó. Báo trước 45 ngày khi sắp hết hạn.",
    sapXep: { cot: "ngay_het_han" }, canhBao: { cot: "ngay_het_han", ngay: 45, nhan: "Sắp hết hạn" }, trong: "Chưa ghi hợp đồng nào.",
    cot: [
      { k: "ten", nhan: "Tên hợp đồng", kieu: "chu", batBuoc: true },
      { k: "doi_tac", nhan: "Đối tác", kieu: "chu", the: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Nhà máy", "Đại lý", "Dịch vụ", "Thuê mặt bằng", "KOL/KOC", "Khác"], mac: "Khác", the: true },
      { k: "so_hop_dong", nhan: "Số hợp đồng", kieu: "chu" },
      { k: "ngay_ky", nhan: "Ngày ký", kieu: "ngay" },
      { k: "ngay_het_han", nhan: "Ngày hết hạn", kieu: "ngay", the: true },
      { k: "gia_tri", nhan: "Giá trị (đ)", kieu: "tien", coTheTrong: true },
      { k: "nguoi_phu_trach_id", nhan: "Người phụ trách", kieu: "nv" },
      { k: "da_duoc_dong_y_gui", nhan: "Chị Lâm đã đồng ý trước khi gửi ra ngoài", kieu: "co", mac: false },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang soạn", "Chờ ký", "Đang hiệu lực", "Hết hạn", "Chấm dứt"], mac: "Đang soạn" },
      { k: "link_file", nhan: "Link file", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "nhan-hieu-kieu-dang", ten: "Nhãn hiệu và kiểu dáng", nhom: "Pháp lý & Hồ sơ", bang: "pl_nhan_hieu", tieuDe: "ten", trangThai: "trang_thai",
    moTa: "Nhãn hiệu và kiểu dáng công nghiệp đã đăng ký hoặc đang nộp đơn: số đơn, số văn bằng, ngày cấp, ngày hết hạn. Báo trước 180 ngày để kịp gia hạn. Mốc báo chờ luật sư xác nhận.",
    sapXep: { cot: "ngay_het_han" }, canhBao: { cot: "ngay_het_han", ngay: 180, nhan: "Sắp phải gia hạn" }, trong: "Chưa ghi nhãn hiệu hay kiểu dáng nào.",
    cot: [
      { k: "ten", nhan: "Tên", kieu: "chu", batBuoc: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Nhãn hiệu", "Kiểu dáng công nghiệp"], mac: "Nhãn hiệu", the: true },
      { k: "so_don", nhan: "Số đơn", kieu: "chu" },
      { k: "so_van_bang", nhan: "Số văn bằng", kieu: "chu", the: true },
      { k: "ngay_cap", nhan: "Ngày cấp", kieu: "ngay" },
      { k: "ngay_het_han", nhan: "Ngày hết hạn", kieu: "ngay", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang nộp đơn", "Đã được cấp", "Cần gia hạn", "Hết hiệu lực"], mac: "Đang nộp đơn" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "dong-y-du-lieu", ten: "Đồng ý xử lý dữ liệu khách", nhom: "Pháp lý & Hồ sơ", bang: "pl_dong_y_du_lieu", tieuDe: "khach",
    moTa: "Khách đã đồng ý cho công ty xử lý dữ liệu cá nhân: ngày, hình thức, phạm vi, nơi lưu bằng chứng. Khách rút lại đồng ý thì ghi ngày thu hồi.",
    sapXep: { cot: "ngay_dong_y", giam: true }, trong: "Chưa ghi sự đồng ý nào.",
    cot: [
      { k: "khach", nhan: "Khách", kieu: "chu", batBuoc: true },
      { k: "kenh", nhan: "Kênh liên hệ", kieu: "chu", the: true },
      { k: "ngay_dong_y", nhan: "Ngày đồng ý", kieu: "ngay", batBuoc: true, the: true },
      { k: "hinh_thuc", nhan: "Hình thức", kieu: "chon", luaChon: ["Văn bản ký", "Tin nhắn", "Biểu mẫu"], mac: "Biểu mẫu", the: true },
      { k: "pham_vi", nhan: "Phạm vi sử dụng dữ liệu", kieu: "nhieu", rong: true },
      { k: "link_bang_chung", nhan: "Link bằng chứng", kieu: "chu" },
      { k: "ngay_thu_hoi", nhan: "Ngày rút lại đồng ý", kieu: "ngay" },
    ],
  },
  {
    ma: "nhap-xuat-kho", ten: "Phiếu nhập xuất kho", nhom: "Tài chính & Kho", bang: "kho_nhap_xuat", tieuDe: "san_pham_id", trangThai: "loai",
    moTa: "Mỗi lần nhập, xuất hoặc điều chỉnh kho là một dòng: sản phẩm, số lượng, số lô, đối tượng, chứng từ. Tồn kho tự tính từ các dòng này ở màn Tồn kho.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có phiếu nhập xuất nào. Thêm sản phẩm ở màn Danh mục sản phẩm trước.",
    cot: [
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "loai", nhan: "Loại phiếu", kieu: "chon", luaChon: ["Nhập", "Xuất", "Điều chỉnh tăng", "Điều chỉnh giảm"], mac: "Nhập", the: true },
      { k: "san_pham_id", nhan: "Sản phẩm", kieu: "tc", batBuoc: true, bangTc: "sp_san_pham", the: true },
      { k: "so_luong", nhan: "Số lượng", kieu: "so", batBuoc: true, mac: 1, khoang: [1, 10000000], the: true },
      { k: "so_lo", nhan: "Số lô", kieu: "chu" },
      { k: "doi_tuong", nhan: "Nhà cung cấp hoặc nơi nhận", kieu: "chu" },
      { k: "chung_tu", nhan: "Số chứng từ", kieu: "chu" },
      { k: "nguoi_lap_id", nhan: "Người lập", kieu: "nv" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "dong-goi-giao-hang", ten: "Đóng gói và giao hàng", nhom: "Tài chính & Kho", bang: "kho_dong_goi_giao", tieuDe: "ma_don", trangThai: "trang_thai",
    moTa: "Từng đơn đóng gói: mã đơn, kênh, người đóng, đơn vị vận chuyển, mã vận đơn, đã giao hay hoàn trả.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có đơn nào.",
    cot: [
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "ma_don", nhan: "Mã đơn", kieu: "chu", batBuoc: true },
      { k: "kenh", nhan: "Kênh", kieu: "chon", luaChon: ["Sàn", "Sỉ và đại lý", "Livestream", "Khác"], mac: "Sàn", the: true },
      { k: "nguoi_dong_goi_id", nhan: "Người đóng gói", kieu: "nv", the: true },
      { k: "don_vi_van_chuyen", nhan: "Đơn vị vận chuyển", kieu: "chu" },
      { k: "ma_van_don", nhan: "Mã vận đơn", kieu: "chu", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Chờ đóng", "Đã đóng", "Đã giao", "Hoàn hoặc trả"], mac: "Chờ đóng" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "chung-tu-xuat-nhap-khau", ten: "Chứng từ xuất nhập khẩu", nhom: "Tài chính & Kho", bang: "tc_chung_tu_xnk", tieuDe: "so_chung_tu", trangThai: "trang_thai",
    moTa: "Tờ khai, hoá đơn, vận đơn, packing list của từng lô nhập: số chứng từ, đối tác, giá trị, link file, đã đủ bộ chưa.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có chứng từ nào.",
    cot: [
      { k: "so_chung_tu", nhan: "Số chứng từ", kieu: "chu", batBuoc: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Tờ khai", "Hoá đơn", "Vận đơn", "Packing list", "Khác"], mac: "Hoá đơn", the: true },
      { k: "ngay", nhan: "Ngày", kieu: "ngay", the: true },
      { k: "doi_tac", nhan: "Đối tác", kieu: "chu", the: true },
      { k: "gia_tri", nhan: "Giá trị (đ)", kieu: "tien", coTheTrong: true },
      { k: "link_file", nhan: "Link file", kieu: "chu" },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Đang thu thập", "Đủ", "Đã lưu"], mac: "Đang thu thập" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "cong-no-nha-cung-cap", ten: "Công nợ nhà cung cấp", nhom: "Tài chính & Kho", bang: "tc_cong_no_ncc", tieuDe: "nha_cung_cap", trangThai: "loai",
    moTa: "Phải trả nhà cung cấp: mỗi lần phát sinh hoặc đã trả là một dòng, kèm hạn thanh toán. Công nợ đại lý, khách sỉ nằm ở nhóm Kinh doanh.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có khoản công nợ nào.",
    cot: [
      { k: "nha_cung_cap", nhan: "Nhà cung cấp", kieu: "chu", batBuoc: true },
      { k: "ngay", nhan: "Ngày", kieu: "ngay", batBuoc: true, the: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Phát sinh", "Đã trả"], mac: "Phát sinh", the: true },
      { k: "so_tien", nhan: "Số tiền (đ)", kieu: "tien", batBuoc: true, the: true },
      { k: "han_thanh_toan", nhan: "Hạn thanh toán", kieu: "ngay", the: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "ke-hoach-tai-chinh", ten: "Kế hoạch tài chính", nhom: "Tài chính & Kho", bang: "tc_ke_hoach", tieuDe: "hang_muc", trangThai: "loai",
    moTa: "Kế hoạch thu chi theo tháng và hạng mục, so với thực tế.",
    sapXep: { cot: "thang", giam: true }, trong: "Chưa có kế hoạch tháng nào.",
    cot: [
      { k: "thang", nhan: "Tháng (ngày mùng 1)", kieu: "ngay", batBuoc: true, the: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Thu", "Chi"], mac: "Chi", the: true },
      { k: "hang_muc", nhan: "Hạng mục", kieu: "chu", batBuoc: true },
      { k: "ke_hoach", nhan: "Kế hoạch (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "thuc_te", nhan: "Thực tế (đ)", kieu: "tien", coTheTrong: true, the: true },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "nghien-cuu-thi-truong", ten: "Nghiên cứu thị trường", nhom: "Chiến lược", bang: "cl_nghien_cuu", tieuDe: "chu_de", trangThai: "trang_thai",
    moTa: "Lịch nghiên cứu thị trường (6 tháng một lần) và kho báo cáo: chủ đề, người phụ trách, link báo cáo.",
    sapXep: { cot: "ngay_du_kien", giam: true }, trong: "Chưa có đợt nghiên cứu nào.",
    cot: [
      { k: "chu_de", nhan: "Chủ đề", kieu: "chu", batBuoc: true },
      { k: "ngay_du_kien", nhan: "Ngày dự kiến", kieu: "ngay", the: true },
      { k: "nguoi_phu_trach_id", nhan: "Người phụ trách", kieu: "nv", the: true },
      { k: "trang_thai", nhan: "Trạng thái", kieu: "chon", luaChon: ["Kế hoạch", "Đang làm", "Hoàn thành"], mac: "Kế hoạch" },
      { k: "link_bao_cao", nhan: "Link báo cáo", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "khao-sat-khach", ten: "Khảo sát khách hàng", nhom: "Chiến lược", bang: "cl_khao_sat", tieuDe: "ten",
    moTa: "Các đợt khảo sát khách: đối tượng, ngày, link biểu mẫu, số phản hồi, tóm tắt. Không hỏi thẳng khách về mức chi tiêu.",
    sapXep: { cot: "ngay", giam: true }, trong: "Chưa có đợt khảo sát nào.",
    cot: [
      { k: "ten", nhan: "Tên khảo sát", kieu: "chu", batBuoc: true },
      { k: "doi_tuong", nhan: "Đối tượng", kieu: "chu", the: true },
      { k: "ngay", nhan: "Ngày", kieu: "ngay", the: true },
      { k: "link_form", nhan: "Link biểu mẫu", kieu: "chu" },
      { k: "so_phan_hoi", nhan: "Số phản hồi", kieu: "so", coTheTrong: true, khoang: [0, 10000000], the: true },
      { k: "tom_tat", nhan: "Tóm tắt kết quả", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "thang-chuc-dieu-chuyen", ten: "Lịch sử thăng chức và điều chuyển", nhom: "Hợp đồng & thăng tiến", bang: "thang_chuc_dieu_chuyen", tieuDe: "nhan_vien_id", trangThai: "loai",
    moTa: "Mỗi lần thăng chức, điều chuyển, bổ nhiệm của từng người: từ chức danh/khối nào sang đâu, ngày hiệu lực, số quyết định. Ghi sổ, không tự đổi hồ sơ nhân sự.",
    sapXep: { cot: "ngay_hieu_luc", giam: true }, trong: "Chưa có lần thăng chức hay điều chuyển nào.",
    cot: [
      { k: "nhan_vien_id", nhan: "Nhân sự", kieu: "nv", batBuoc: true, the: true },
      { k: "loai", nhan: "Loại", kieu: "chon", luaChon: ["Thăng chức", "Điều chuyển", "Giáng chức", "Bổ nhiệm", "Miễn nhiệm"], mac: "Thăng chức", the: true },
      { k: "ngay_hieu_luc", nhan: "Hiệu lực từ", kieu: "ngay", batBuoc: true, the: true },
      { k: "tu_chuc_danh", nhan: "Từ chức danh", kieu: "chu", the: true },
      { k: "den_chuc_danh", nhan: "Sang chức danh", kieu: "chu", the: true },
      { k: "tu_khoi_id", nhan: "Từ khối", kieu: "khoi" },
      { k: "den_khoi_id", nhan: "Sang khối", kieu: "khoi" },
      { k: "so_quyet_dinh", nhan: "Số quyết định", kieu: "chu" },
      { k: "ly_do", nhan: "Lý do", kieu: "nhieu", rong: true },
    ],
  },
  {
    ma: "han-bao-cao-nha-nuoc", ten: "Hạn báo cáo nhà nước", nhom: "Lịch & báo cáo nhà nước", bang: "han_bao_cao_nha_nuoc", tieuDe: "ten",
    moTa: "Các hạn báo cáo cơ quan nhà nước (biến động lao động, sử dụng lao động, nội quy lao động…). Mốc ngày để trống đến khi kế toán/luật sư xác nhận; nhập hạn rồi mới hiện trên Lịch nhân sự và nhắc HCNS.",
    sapXep: { cot: "tao_luc" }, trong: "Chưa có hạn nào.",
    cot: [
      { k: "ten", nhan: "Tên báo cáo", kieu: "chu", batBuoc: true, the: true },
      { k: "co_quan", nhan: "Cơ quan nhận", kieu: "chu", the: true },
      { k: "chu_ky", nhan: "Chu kỳ", kieu: "chon", luaChon: ["Hằng tháng", "Hằng quý", "6 tháng", "Hằng năm", "Một lần"], mac: "Hằng năm", the: true },
      { k: "han_ngay", nhan: "Hạn: ngày trong tháng (1-31)", kieu: "so", khoang: [1, 31], coTheTrong: true, the: true },
      { k: "han_thang", nhan: "Hạn: tháng (1-12; với quý/6 tháng là tháng của lần đầu)", kieu: "so", khoang: [1, 12], coTheTrong: true, the: true },
      { k: "han_mot_lan", nhan: "Hạn (khi chu kỳ là “Một lần”)", kieu: "ngay" },
      { k: "dang_bat", nhan: "Đang theo dõi", kieu: "co", mac: true },
      { k: "xac_nhan_boi", nhan: "Ai đã xác nhận mốc (kế toán/luật sư)", kieu: "chu" },
      { k: "ghi_chu", nhan: "Ghi chú", kieu: "nhieu", rong: true },
    ],
  },
];

export const timMucHr = (ma: string) => HR_MUC.find((m) => m.ma === ma);

/** Giá trị gửi lên → giá trị lưu, theo kiểu cột. Trả { loi } khi sai. */
export function chuanHoaGiaTri(c: CotHr, tho: string): { v: string | number | boolean | null } | { loi: string } {
  const s = tho.trim();
  if (c.batBuoc && !s && c.kieu !== "co") return { loi: `Nhập “${c.nhan}”.` };
  switch (c.kieu) {
    case "chu": return { v: s ? s.slice(0, 200) : null };
    case "nhieu": return { v: s ? s.slice(0, 2000) : null };
    case "so": case "tien": {
      if (!s) return { v: c.kieu === "so" && !c.coTheTrong ? 0 : null };
      const n = Number(s.replace(/[.,\s]/g, ""));
      if (!Number.isFinite(n) || n < 0 || n > 1e12) return { loi: `“${c.nhan}” phải là số không âm.` };
      if (c.khoang && (n < c.khoang[0] || n > c.khoang[1])) return { loi: `“${c.nhan}” phải từ ${c.khoang[0]} đến ${c.khoang[1]}.` };
      return { v: Math.round(n) };
    }
    case "ngay": return !s ? { v: null } : /^\d{4}-\d{2}-\d{2}$/.test(s) ? { v: s } : { loi: `“${c.nhan}” chưa đúng ngày.` };
    case "gio": {
      if (!s) return { v: null };
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return { loi: `“${c.nhan}” chưa đúng giờ.` };
      return { v: `${s}:00+07:00` };
    }
    case "chon": return !s ? { v: null } : c.luaChon?.includes(s) ? { v: s } : { loi: `“${c.nhan}” chưa hợp lệ.` };
    case "co": return { v: s === "1" || s === "on" || s === "true" };
    case "nv": case "khoi": case "tc": return !s ? { v: null } : /^[0-9a-f-]{36}$/i.test(s) ? { v: s } : { loi: `“${c.nhan}” chưa hợp lệ.` };
  }
}
