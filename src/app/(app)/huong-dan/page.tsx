export const dynamic = "force-dynamic";

import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MucTrang } from "@/components/ui/MucTrang";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { CHU_THICH_CONG } from "@/lib/cong";

type Buoc = { tieuDe: string; noiDung: React.ReactNode };

function DanhSachBuoc({ buoc }: { buoc: Buoc[] }) {
  return (
    <ol className="space-y-4">
      {buoc.map((b, i) => (
        <li key={b.tieuDe} className="flex gap-4">
          <span className="nut-vang mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-[13px]" style={{ borderRadius: 9999 }}>{i + 1}</span>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-muc">{b.tieuDe}</div>
            <div className="mt-1 space-y-1.5 text-[14px] leading-relaxed text-muc-2">{b.noiDung}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

const CHUNG: Buoc[] = [
  { tieuDe: "Chấm công vào và ra", noiDung: <p>Vào mục <b>Chấm công</b>, bấm nút tròn lớn khi đến làm và bấm lần nữa khi về. Giờ lấy theo giờ Hồ Chí Minh. Ca hành chính là 08:00 – 17:00; vào sau 08:15 máy ghi nhãn &quot;Đi muộn&quot;. Công và lương tính theo ca, không tính theo giờ bấm. Tổng giám đốc, Giám đốc và tài khoản Kỹ thuật không phải chấm công.</p> },
  { tieuDe: "Nộp đơn", noiDung: <><p>Vào <b>Đơn từ và phê duyệt</b> → <b>Nộp đơn mới</b>. Tên người nộp là tên của bạn, không đổi được. Có 11 loại: đi trễ, về sớm, nghỉ phép năm, nghỉ không lương, nghỉ ốm, nghỉ chế độ (thai sản…), giải trình công, làm remote, công tác, chấm công ngoài công ty, tạm ứng lương.</p><p>Phép năm là 12 ngày mỗi năm. Muốn nghỉ một buổi thì chọn &quot;Một buổi / theo giờ&quot; rồi chọn giờ bắt đầu, giờ kết thúc (≤ 4 tiếng tính nửa ngày).</p></> },
  { tieuDe: "Giải trình công", noiDung: <p>Chỉ nộp được cho một ngày <b>đã có sai phạm chấm công</b> (vào trễ, về sớm, ra muộn quá 1 tiếng, quên chấm ra). Chọn ngày, máy tự hiện giờ vào/ra thật của bạn; bạn ghi giờ đúng và lý do. Khi đơn được duyệt, chấm công ngày đó tự sửa về giờ đúng.</p> },
  { tieuDe: "Xem phiếu lương", noiDung: <p>Vào <b>Bảng lương</b> để xem phiếu của các kỳ đã được duyệt. Chỉ bạn xem được phiếu của bạn.</p> },
];

const QUAN_TRI: Buoc[] = [
  { tieuDe: "Hằng ngày: theo dõi chấm công", noiDung: <p>Mục <b>Chấm công</b> cho thấy ai đã chấm công hôm nay, ai đi muộn, ai vắng, kèm lịch cả công ty. Mục <b>Tổng quan</b> tóm tắt số người, đơn chờ duyệt, ứng viên mới.</p> },
  { tieuDe: "Hằng ngày: duyệt đơn", noiDung: <p>Vào <b>Đơn từ và phê duyệt</b>, mở đơn chờ duyệt rồi bấm Duyệt hoặc Từ chối. Không tự duyệt đơn của chính mình. Duyệt đơn <b>Giải trình công</b> thì chấm công ngày đó tự sửa về giờ người nộp ghi. Đơn Đi trễ, Về sớm, Chấm công ngoài công ty khi duyệt chỉ đổi trạng thái đơn, chưa tự sửa chấm công.</p> },
  { tieuDe: "Đầu năm và khi có thông báo: nhập ngày nghỉ lễ", noiDung: <p>Vào <b>Bảng công tháng</b> → <b>Ngày lễ</b>. Hệ thống đã có sẵn các ngày lễ dương lịch cố định (1/1, 30/4, 1/5, 2/9). <b>Tết Nguyên đán, Giỗ Tổ Hùng Vương và ngày nghỉ bù</b> do Hành chính nhân sự nhập theo thông báo của Nhà nước. Ngày lễ ghi mã L và được tính đủ công.</p> },
  { tieuDe: "Cuối tháng: kiểm Bảng công tháng", noiDung: <><p>Vào <b>Bảng công tháng</b>, chọn tháng. Mỗi ô là một mã công: </p><ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">{CHU_THICH_CONG.map((c) => <li key={c.ma}><b className="text-muc">{c.ma}</b> — {c.ten}</li>)}</ul><p>Ô <b>V</b> là ngày vắng không có đơn: hỏi người đó, nếu họ có lý do thì nhờ họ nộp đơn (nghỉ, giải trình) rồi duyệt; bảng tự cập nhật. Cột <b>Công hưởng</b> là số công sẽ vào bảng lương.</p></> },
  { tieuDe: "Cuối tháng: chuẩn bị lương", noiDung: <><p>Vào <b>Bảng lương</b>. Làm lần lượt:</p><ol className="list-decimal space-y-1 pl-5"><li>Tab <b>Tham số</b>: kiểm các mức bảo hiểm, giảm trừ, biểu thuế; sau đó bấm <b>Xác nhận tất cả</b> (cần xác nhận trước khi duyệt kỳ thật).</li><li>Tab <b>Thỏa thuận lương</b>: nhập cho từng người lương thỏa thuận, % KPI, phụ cấp, ăn ca, có đóng bảo hiểm không, số người phụ thuộc.</li><li>Tab <b>Bảng lương</b> → <b>Tạo kỳ lương</b> (chọn tháng/năm) → <b>Lập bảng lương</b>: công lấy tự động từ Bảng công tháng.</li><li>Mở từng dòng để nhập giờ tăng ca, hoa hồng, thưởng, khấu trừ khác; sửa công nếu cần.</li><li>Chuyển kỳ qua <b>Đã kiểm → Đã duyệt → Đã chi</b>. Từ bước Đã kiểm trở đi không sửa được dòng.</li></ol></> },
  { tieuDe: "Thêm nhân viên và tài khoản", noiDung: <p>Mục <b>Hồ sơ nhân sự</b> để thêm, sửa hồ sơ, cho nghỉ việc; <b>Khối và phòng ban</b> để quản lý khối. Quyền Quản trị tự có theo vị trí (khối Hành chính nhân sự, Tổng giám đốc, Phó tổng giám đốc, Giám đốc, Phó giám đốc). Duyệt tài khoản mới đăng ký do tài khoản Kỹ thuật làm.</p> },
];

const KY_THUAT: Buoc[] = [
  { tieuDe: "Duyệt tài khoản đăng ký", noiDung: <p>Ở <b>Tổng quan</b>, mục &quot;Tài khoản chờ duyệt&quot;: đối chiếu email với người thật, chọn hồ sơ nhân sự rồi bấm Duyệt. Chọn vai trò &quot;Theo vị trí&quot; (Quản trị tự có theo vị trí) hoặc &quot;Kỹ thuật&quot;.</p> },
  { tieuDe: "Nộp đơn thay mọi người", noiDung: <p>Khi nộp đơn, Kỹ thuật có ô <b>Nộp cho</b> để chọn bất kỳ nhân viên nào; mọi loại đơn đều nộp được.</p> },
  { tieuDe: "Theo dõi hệ thống", noiDung: <p>Mục <b>Kỹ thuật</b> và &quot;Toàn cảnh số liệu&quot; ở Tổng quan cho thấy tình trạng hệ thống, số dòng dữ liệu và các chỉ số toàn công ty.</p> },
];

export default async function TrangHuongDan() {
  const nd = await layNguoiDungDaDuyet();
  const quanLy = nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat";
  return (
    <div className="space-y-10">
      <TieuDeTrang tieuDe="Hướng dẫn sử dụng" phu={quanLy ? "Việc hằng ngày, cuối tháng và lương, theo thứ tự nên làm" : "Chấm công, nộp đơn và xem phiếu lương"} />
      <MucTrang tieuDe="Việc của mọi nhân viên"><DanhSachBuoc buoc={CHUNG} /></MucTrang>
      {quanLy && <MucTrang tieuDe="Việc của Quản trị và Hành chính nhân sự"><DanhSachBuoc buoc={QUAN_TRI} /></MucTrang>}
      {nd.vaiTro === "ky_thuat" && <MucTrang tieuDe="Việc riêng của tài khoản Kỹ thuật"><DanhSachBuoc buoc={KY_THUAT} /></MucTrang>}
    </div>
  );
}
