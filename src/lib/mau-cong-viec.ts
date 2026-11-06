/** Mẫu công việc hằng ngày để bấm thêm một lần (gợi ý theo các mảng đang có trong app, KHÔNG phải chỉ tiêu). Mỗi việc thêm vào với "số lượng cần làm" = 1,
 *  người dùng tự chỉnh tên/số lượng theo thực tế. Việc đã có cùng tên thì bỏ qua, nên bấm lại không bị trùng. */
export type MauCv = { ma: string; ten: string; viec: string[]; khoi?: string };

export const MAU_CONG_VIEC: MauCv[] = [
  { ma: "chung", ten: "Chung cho mọi người", viec: ["Chấm công vào và ra", "Xử lý phiếu và tin nhắn chờ trong ngày", "Cập nhật tiến độ công việc trong ngày", "Nộp báo cáo cuối ngày kèm link minh chứng"] },
  { ma: "hcns", ten: "Hành chính nhân sự", khoi: "Hành chính nhân sự", viec: ["Kiểm tra đơn từ và phiếu phê duyệt chờ xử lý", "Rà bảng công hôm qua, nhắc người thiếu chấm công", "Cập nhật hồ sơ nhân sự phát sinh trong ngày", "Rà hồ sơ ứng viên và lịch phỏng vấn", "Theo dõi nhân viên thử việc và onboarding"] },
  { ma: "kinh-doanh", ten: "Kinh doanh", khoi: "Kinh doanh", viec: ["Nhắn và chăm sóc khách mới trong ngày", "Chốt và nhập đơn bán trong ngày", "Theo dõi đơn đang giao và đơn hoàn", "Cập nhật kết quả bán hàng cuối ngày"] },
  { ma: "kho", ten: "Kho", viec: ["Nhập kho hàng về trong ngày", "Xuất kho theo đơn trong ngày", "Kiểm tồn kho và hàng sắp hết hạn", "Cập nhật phiếu kho cuối ngày"] },
  { ma: "marketing", ten: "Marketing & Ecom", khoi: "Marketing & Ecom", viec: ["Đăng nội dung theo lịch", "Trả lời bình luận và tin nhắn trang", "Cập nhật chi tiêu và kết quả quảng cáo trong ngày", "Theo dõi đơn sàn thương mại điện tử"] },
  { ma: "ke-toan", ten: "Tài chính - Kế toán", khoi: "Tài chính - Kế toán", viec: ["Ghi nhận thu chi phát sinh trong ngày", "Đối chiếu chứng từ và hoá đơn", "Theo dõi phiếu đề nghị thanh toán và tạm ứng chờ xử lý"] },
];

/** Mẫu gợi ý lên đầu: "chung" luôn có, rồi mẫu khớp tên khối của người dùng; các mẫu còn lại vẫn chọn được. */
export function sapMauTheoKhoi(tenKhoi: string | null | undefined): MauCv[] {
  const khop = MAU_CONG_VIEC.filter((m) => m.khoi && m.khoi === tenKhoi);
  const chung = MAU_CONG_VIEC.filter((m) => m.ma === "chung");
  const con = MAU_CONG_VIEC.filter((m) => !khop.includes(m) && !chung.includes(m));
  return [...chung, ...khop, ...con];
}
