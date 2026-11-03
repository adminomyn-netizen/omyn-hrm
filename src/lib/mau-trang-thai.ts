// Bảng màu trạng thái dùng chung: mỗi giai đoạn một sắc riêng để nhìn là phân biệt được, không chỉ chữ.
export type Sac = "xanh" | "tim" | "luc" | "cam" | "hong" | "la" | "xam" | "do" | "vang" | "nhan";

/** Giai đoạn ứng viên: đi từ lạnh (mới) sang ấm rồi xanh lá (nhận việc); Không đạt là xám. */
export const SAC_BUOC_UNG_VIEN: Record<string, Sac> = {
  "Mới nộp": "xanh",
  "Hẹn phỏng vấn": "tim",
  "Vòng 1": "luc",
  "Vòng 2": "cam",
  "Đề nghị": "hong",
  "Nhận việc": "la",
  "Không đạt": "xam",
};

const KHOP: [RegExp, Sac][] = [
  [/^(Từ chối|Không đạt|Huỷ|Hủy|Quá hạn|Trễ|Thiếu|Lỗi|Hoàn hoặc trả|Hoàn trả|Nghỉ giữa chừng|Cần bổ sung|Vi phạm)/i, "do"],
  [/^(Chờ|Soạn|Nháp|Kế hoạch|Chưa|Cần theo dõi|Sắp|Tạm|Đang chờ)/i, "vang"],
  [/^(Đã duyệt|Đã chốt|Đã xác nhận|Đã thu đủ|Đã giao|Hoàn thành|Đạt|Đủ|Đồng ý|Nhận việc|Đã nhận|Đã thanh toán|Đã trả|Đã ký|Đã xong)/i, "la"],
  [/^(Đang đăng|Đang tuyển|Đang dùng|Đang hiệu lực|Đang làm|Đang thực hiện)/i, "luc"],
  [/^(Đang phỏng vấn|Đang thử việc|Thử việc|Đang giao|Đang xử lý|Đang đăng tin|Đã tiếp nhận)/i, "xanh"],
  [/^(Đã đóng|Đã gỡ|Đã hết|Hết hạn|Chấm dứt|Đã nghỉ|Lưu trữ|Ngừng)/i, "xam"],
];

/** Đoán sắc theo chữ trạng thái; không khớp thì để mặc định (xám trung tính của nhãn). */
export function sacTuTrangThai(chu: string): Sac | null {
  const t = chu.trim();
  for (const [re, sac] of KHOP) if (re.test(t)) return sac;
  return null;
}

/** Biến CSS cho chữ và nền nhạt của một sắc. */
export function mauSac(sac: Sac): { chu: string; nen: string } {
  switch (sac) {
    case "do": return { chu: "var(--loi)", nen: "var(--loi-nen)" };
    case "vang": return { chu: "var(--canh-bao)", nen: "var(--canh-bao-nen)" };
    case "nhan": return { chu: "var(--nhan-dam)", nen: "var(--nhan-nhat)" };
    default: return { chu: `var(--sac-${sac})`, nen: `var(--sac-${sac}-nen)` };
  }
}
