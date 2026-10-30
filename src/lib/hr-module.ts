/** Cấu hình các mục vận hành HCNS chuyển từ Lark (docs/mapping-lark-hr.md). Một khai báo → bảng/thẻ danh sách, biểu mẫu thêm/sửa, kiểm tra ở máy chủ.
 * Thêm mục mới = thêm một khối vào HR_MUC (+ migration cho bảng); không cần viết thêm trang. Không dùng hàm trong cấu hình để truyền được sang trình duyệt. */

export type KieuCot = "chu" | "nhieu" | "so" | "tien" | "ngay" | "gio" | "chon" | "co" | "nv" | "khoi";

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
  /** Một câu hướng dẫn khi chưa có dữ liệu. */
  trong: string;
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
    ma: "de-xuat-phe-duyet", ten: "Đề xuất cần phê duyệt", nhom: "Tuyển dụng", bang: "de_xuat_phe_duyet", tieuDe: "tieu_de", trangThai: "trang_thai",
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
    ma: "kpi-thuong", ten: "Khen thưởng thi đua", nhom: "KPI & thi đua", bang: "kpi_thuong", tieuDe: "pham_vi",
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
    case "nv": case "khoi": return !s ? { v: null } : /^[0-9a-f-]{36}$/i.test(s) ? { v: s } : { loi: `“${c.nhan}” chưa hợp lệ.` };
  }
}
