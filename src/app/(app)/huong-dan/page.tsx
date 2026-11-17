export const dynamic = "force-dynamic";

import { BookOpen, ShieldCheck, Terminal, Users, type LucideIcon } from "lucide-react";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { CHU_THICH_CONG } from "@/lib/cong";

type Sac = "luc" | "xanh" | "tim" | "cam" | "hong";
type Buoc = { tieuDe: string; noiDung: React.ReactNode };
type Phan = { tieuDe: string; sac: Sac; buoc: Buoc[] };
type HuongDan = { vaiTro: string; loiNoi: string; sac: Sac; Icon: LucideIcon; phan: Phan[]; luuY: string[] };

const v = (k: Sac, h: "" | "-nen" | "-mau" | "-1" | "-2") => `var(--sac-${k}${h})`;
const dai = (k: Sac) => `linear-gradient(135deg, ${v(k, "-1")} 0%, ${v(k, "-2")} 100%)`;

/** Ba bản hướng dẫn RIÊNG cho ba vai trò: mỗi người chỉ thấy việc của chính vai trò mình, không gộp chung. */
const NHAN_VIEN: HuongDan = {
  vaiTro: "Nhân viên",
  loiNoi: "Chấm công đúng giờ, nộp đơn khi cần nghỉ hoặc đi làm khác thường, và xem phiếu lương của chính bạn.",
  sac: "luc",
  Icon: Users,
  phan: [
    {
      tieuDe: "Mỗi ngày",
      sac: "luc",
      buoc: [
        { tieuDe: "Chấm công vào và ra", noiDung: <p>Vào mục <b>Chấm công</b>, bấm nút tròn lớn khi đến làm và bấm lần nữa khi về. Ca hành chính là 08:00 – 17:00; vào sau 08:15 máy ghi nhãn &quot;Đi muộn&quot;. Công và lương tính theo ca, không tính theo giờ bấm. Đừng quên bấm khi ra về: ngày quên chấm ra sẽ phải giải trình.</p> },
        { tieuDe: "Xem lịch công của bạn", noiDung: <p>Cũng ở <b>Chấm công</b>: dải &quot;Tuần này&quot; cho thấy ngày nào đã chấm, bên dưới là lịch cả tháng với giờ vào, giờ ra thật của bạn.</p> },
      ],
    },
    {
      tieuDe: "Công việc hằng ngày",
      sac: "tim",
      buoc: [
        { tieuDe: "Lập danh sách việc hôm nay", noiDung: <p>Vào mục <b>Công việc</b>, gõ vào ô &quot;Thêm việc cần làm hôm nay…&quot; rồi bấm Enter. Chưa có việc hằng ngày thì bấm <b>Chưa có việc hằng ngày? Thêm từ mẫu</b>, chọn mẫu theo mảng của bạn (kinh doanh, kho, marketing, kế toán, nhân sự hoặc mẫu chung) rồi sửa tên và số lượng cho đúng thực tế. Mỗi lần thêm xong có dòng &quot;Đã thêm việc…&quot; báo thành công. Giám đốc, Phó giám đốc và Kỹ thuật nhận thông báo bạn vừa thêm việc gì, thuộc phòng ban nào.</p> },
        { tieuDe: "Việc lặp hằng ngày", noiDung: <p>Bấm <b>Thêm chi tiết</b>, bật <b>Lặp lại hằng ngày</b>, nhập số lượng cần làm mỗi ngày và đơn vị (cuộc gọi, bài, đơn…). Tick xong hôm nay thì ngày mai việc tự mở lại. Muốn dừng hẳn thì chọn <b>Huỷ việc</b>.</p> },
        { tieuDe: "Thêm minh chứng trước khi hoàn thành", noiDung: <p>Mở việc, bấm <b>Thêm minh chứng</b>. Có link (bảng tính, tài liệu, ảnh, bài đăng… bắt đầu bằng https) thì dán vào; <b>không có link thì chỉ cần ghi chú ngắn</b> đã làm gì, kết quả ra sao (ví dụ việc phỏng vấn, gọi điện). Link không bắt buộc, nhưng <b>phải có link hoặc ghi chú thì mới bấm hoàn thành được</b>; chưa có thì nút xong bị khoá và hiện lời nhắc.</p> },
        { tieuDe: "Nộp báo cáo cuối ngày", noiDung: <p>Ở ô <b>Báo cáo công việc hôm nay</b>, ghi <b>Kết quả hôm nay</b> (đã làm gì, còn dở gì, vướng gì), có link thì dán thêm (không bắt buộc), rồi nộp. Trong ngày còn sửa được bằng <b>Sửa báo cáo</b>. Giám đốc, Phó giám đốc và Kỹ thuật không phải nộp.</p> },
        { tieuDe: "Các mốc nhắc", noiDung: <p>08:30 nhắc việc đầu ngày. 16:45 nhắc sắp hết ngày làm. 17:30 và 19:30 nhắc lại nếu bạn chưa nộp báo cáo. Nhắc hiện ở biểu tượng chuông; muốn nhận cả thông báo trên điện thoại thì thêm app vào màn hình chính và cho phép thông báo.</p> },
      ],
    },
    {
      tieuDe: "Khi cần nghỉ hoặc làm khác thường",
      sac: "xanh",
      buoc: [
        { tieuDe: "Nộp đơn", noiDung: <><p>Vào <b>Đơn nghỉ và giải trình công</b> → <b>Nộp đơn mới</b>. Tên người nộp là tên của bạn và không đổi được. Chọn loại đơn: nghỉ phép năm, nghỉ không lương, nghỉ ốm, nghỉ chế độ (thai sản…), làm remote, công tác, chấm công ngoài công ty, tạm ứng lương, đi trễ, về sớm.</p><p>Phép năm là 12 ngày mỗi năm; số ngày còn lại hiện ngay trong form.</p></> },
        { tieuDe: "Nghỉ một buổi hoặc vài tiếng", noiDung: <p>Với nghỉ phép năm, không lương, ốm: chọn &quot;Một buổi / theo giờ&quot;, chọn ngày rồi giờ bắt đầu – kết thúc. Nghỉ không quá 4 tiếng tính nửa ngày, lâu hơn tính một ngày.</p> },
        { tieuDe: "Theo dõi kết quả", noiDung: <p>Đơn được duyệt hay bị từ chối đều báo ở biểu tượng chuông phía trên. Đơn cũng hiện trong danh sách của bạn ở mục Đơn từ.</p> },
      ],
    },
    {
      tieuDe: "Khi chấm công bị sai",
      sac: "cam",
      buoc: [
        { tieuDe: "Giải trình công", noiDung: <p>Chỉ nộp được cho đúng <b>một ngày đã có sai phạm</b>: vào trễ, về sớm, ra muộn quá 1 tiếng hoặc quên chấm ra. Chọn ngày, máy tự hiện giờ vào/ra thật của bạn. Bạn ghi giờ đúng và lý do. Khi đơn được duyệt, chấm công ngày đó tự sửa về giờ đúng. Ngày không có sai phạm thì nút Nộp bị khoá.</p> },
      ],
    },
    {
      tieuDe: "Nội quy và chính sách",
      sac: "xanh",
      buoc: [
        { tieuDe: "Xem và tải nội quy", noiDung: <p>Vào <b>Nội quy & chính sách</b> (menu Nhân sự): gồm 2 nhóm: <b>Cơ chế & nội quy</b> và <b>Hợp đồng & phụ lục</b>. Bấm <b>Tải về</b> để lưu file.</p> },
      ],
    },
    {
      tieuDe: "Cuối tháng",
      sac: "hong",
      buoc: [
        { tieuDe: "Xem và in phiếu lương", noiDung: <p>Vào <b>Bảng lương</b>: các kỳ đã được duyệt hiện thành từng phiếu (thu nhập, bảo hiểm, thuế, thực lĩnh). Bấm &quot;In phiếu&quot; để in hoặc lưu thành PDF. Chỉ bạn xem được phiếu của bạn.</p> },
      ],
    },
  ],
  luuY: [
    "Không tự duyệt đơn của mình, và không sửa được chấm công của người khác.",
    "Thấy chấm công hoặc phiếu lương có gì sai, báo bộ phận Hành chính nhân sự.",
  ],
};

const QUAN_TRI: HuongDan = {
  vaiTro: "Quản trị · Hành chính nhân sự",
  loiNoi: "Giữ hồ sơ, theo dõi công, duyệt đơn và chốt lương mỗi tháng. Quyền Quản trị tự có theo vị trí (khối Hành chính nhân sự, Giám đốc, Phó giám đốc, Giám đốc, Phó giám đốc).",
  sac: "xanh",
  Icon: ShieldCheck,
  phan: [
    {
      tieuDe: "Mỗi ngày",
      sac: "xanh",
      buoc: [
        { tieuDe: "Nắm tình hình ở Tổng quan và Chấm công", noiDung: <p><b>Tổng quan</b> tóm tắt số người, đơn chờ duyệt, ứng viên mới và quỹ lương. <b>Chấm công</b> cho thấy ai đã chấm hôm nay, ai đi muộn, ai vắng, kèm lịch cả công ty. Giám đốc và người được giữ quyền giám đốc không phải chấm công; người còn lại trong nhóm Quản trị vẫn tự chấm công như mọi người.</p> },
        { tieuDe: "Duyệt đơn", noiDung: <p>Vào <b>Đơn nghỉ và giải trình công</b>, mở đơn chờ duyệt rồi bấm Duyệt hoặc Từ chối. Không duyệt được đơn của chính mình. Duyệt đơn <b>Giải trình công</b> thì chấm công ngày đó tự sửa về giờ người nộp ghi. Đơn Đi trễ, Về sớm, Chấm công ngoài công ty khi duyệt chỉ đổi trạng thái đơn, chưa tự sửa chấm công.</p> },
      ],
    },
    {
      tieuDe: "Công việc hằng ngày của công ty",
      sac: "tim",
      buoc: [
        { tieuDe: "Bạn cũng lập việc và nộp báo cáo", noiDung: <p>Trừ Giám đốc, Phó giám đốc và Kỹ thuật, mọi người kể cả bộ phận Hành chính nhân sự đều lập việc hôm nay, gắn link minh chứng khi hoàn thành và nộp báo cáo cuối ngày ở mục <b>Công việc</b>.</p> },
        { tieuDe: "Xem tổng quan (Giám đốc, Phó giám đốc, Kỹ thuật)", noiDung: <p>Vào <b>Công việc → Tổng quan báo cáo</b>, hoặc xem thẻ <b>Báo cáo công việc hôm nay</b> ở Tổng quan. Mỗi người một dòng: đã nộp báo cáo hay chưa, từng việc đã xong hay chưa, link minh chứng, và nhãn <b>Mới thêm hôm nay</b>. Chuyển ngày bằng nút ngày phía trên. Khoảng 17:45 – 19:00 và 20:00 – 21:30 hệ thống gửi tổng hợp những ai chưa nộp.</p> },
      ],
    },
    {
      tieuDe: "Khi có người mới hoặc thay đổi nhân sự",
      sac: "luc",
      buoc: [
        { tieuDe: "Hồ sơ nhân sự", noiDung: <p>Mục <b>Hồ sơ nhân sự</b>: thêm, sửa hồ sơ, cho nghỉ việc. Có nhiều người cùng lúc thì bấm <b>Nhập từ Excel</b>: tải tệp mẫu, điền, bấm Kiểm tra để xem dòng nào lỗi, sửa hết lỗi rồi mới bấm Nhập. Tên Khối trong tệp phải đúng với danh mục.</p> },
        { tieuDe: "Khối, tuyển dụng, đánh giá", noiDung: <p><b>Khối và phòng ban</b> để thêm sửa khối và vị trí; <b>Tuyển dụng</b> để đăng tin và theo dõi ứng viên qua từng vòng (mở một ứng viên → nút <b>Phiếu đánh giá phỏng vấn</b>: chấm 1–5 sáu tiêu chí, ghi điểm mạnh, điểm cần lưu ý và kết luận Đạt / Cân nhắc / Không đạt; mỗi vòng hoặc mỗi người phỏng vấn một phiếu, lưu phiếu không tự đổi bước của ứng viên); <b>Offer</b> nằm ở Tuyển dụng → Sổ tuyển dụng → Offer: nhập ứng viên, vị trí, lương đề xuất, hạn trả lời, ngày nhận việc, người ký… rồi mở dòng đó bấm <b>Xem và in thư mời nhận việc</b> (in hoặc lưu PDF; chỗ chưa nhập để dấu chấm điền tay); <b>Hợp đồng lao động</b> nằm ở Hồ sơ & hợp đồng → Hợp đồng lao động: thêm hợp đồng (loại, số, từ ngày – đến ngày) và các ô nội dung (chức danh, công việc, địa điểm, mức lương, phụ cấp, thời giờ làm việc, người đại diện ký), rồi mở dòng đó bấm <b>Xem và in hợp đồng</b>; thông tin cá nhân lấy từ hồ sơ cá nhân, chỗ thiếu để dấu chấm, bản in là bản nháp cần rà pháp lý trước khi ký; <b>Đánh giá hiệu suất</b> để ghi điểm và xếp loại theo kỳ.</p> },
        { tieuDe: "Lưu ý về quyền", noiDung: <p>Bạn không đưa được ai vào vị trí tự có quyền Quản trị (Hành chính nhân sự, lãnh đạo): việc đó do tài khoản Kỹ thuật làm. Duyệt tài khoản mới đăng ký cũng do Kỹ thuật làm.</p> },
      ],
    },
    {
      tieuDe: "KPI theo vị trí (tháng)",
      sac: "xanh",
      buoc: [
        { tieuDe: "Đặt chỉ tiêu cho từng vị trí", noiDung: <p>Vào <b>KPI và đánh giá</b>, dòng Thiết lập chọn <b>Chỉ tiêu KPI theo tháng (vị trí)</b>. Thêm chỉ tiêu: gõ đúng <b>chức danh</b> trong hồ sơ nhân sự, tên chỉ tiêu, <b>mục tiêu cả tháng</b>, đơn vị, trọng số 1 đến 10. Chức danh gõ không khớp hồ sơ thì chưa ai thấy chỉ tiêu đó.</p> },
        { tieuDe: "Nhập kết quả tháng", noiDung: <p>Vào <b>Thi đua KPI</b> → <b>KPI theo vị trí (tháng)</b>. Chọn tháng (tháng này hoặc 2 tháng trước), nhập số thực tế rồi bấm <b>Lưu kết quả tháng</b>. Nhân viên nhập của mình, trưởng phòng nhập cho cấp dưới, Quản trị nhập cho mọi người. Ô trống là chưa báo, không bị tính 0.</p> },
        { tieuDe: "Cách tính điểm", noiDung: <p>Mỗi chỉ tiêu: % đạt = thực tế chia mục tiêu (tối đa 120%). Chỉ tiêu &quot;càng thấp càng tốt&quot; tính ngược lại. Điểm tháng là trung bình có trọng số các chỉ tiêu đã báo.</p> },
      ],
    },
    {
      tieuDe: "Nội quy và chính sách",
      sac: "xanh",
      buoc: [
        { tieuDe: "Tải cơ chế, nội quy, hợp đồng, phụ lục", noiDung: <p>Vào <b>Nội quy & chính sách</b> → khung <b>Tải tài liệu lên</b>: chọn nhóm (Cơ chế & nội quy, hoặc Hợp đồng & phụ lục), đặt tên, ghi chú nếu cần (ví dụ có hiệu lực từ ngày nào), chọn tệp (tối đa 25 MB) rồi bấm <b>Tải lên</b>. Muốn thay bản mới thì tải bản mới lên và xoá bản cũ. Mọi thay đổi đều được ghi vào nhật ký.</p> },
        { tieuDe: "Căn cứ kỷ luật", noiDung: <p>Khi ghi kỷ luật, ô <b>Căn cứ (điều trong nội quy)</b> nên ghi đúng số điều trong nội quy đang tải lên mục này.</p> },
      ],
    },
    {
      tieuDe: "Đầu năm và khi có thông báo nghỉ lễ",
      sac: "cam",
      buoc: [
        { tieuDe: "Nhập ngày nghỉ lễ", noiDung: <p>Vào <b>Bảng công tháng</b> → <b>Ngày lễ</b>. Hệ thống đã có sẵn các ngày lễ dương lịch cố định (1/1, 30/4, 1/5, 2/9). <b>Tết Nguyên đán, Giỗ Tổ Hùng Vương và ngày nghỉ bù</b> bạn tự nhập theo thông báo của Nhà nước. Ngày lễ ghi mã L và được tính đủ công.</p> },
      ],
    },
    {
      tieuDe: "Cuối tháng: chốt công",
      sac: "tim",
      buoc: [
        { tieuDe: "Kiểm Bảng công tháng", noiDung: <><p>Vào <b>Bảng công tháng</b>, chọn tháng. Mỗi ô là một mã công:</p><ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">{CHU_THICH_CONG.map((c) => <li key={c.ma}><b className="text-muc">{c.ma}</b> — {c.ten}</li>)}</ul><p>Ô <b>V</b> là ngày vắng không có đơn: hỏi người đó, nếu có lý do thì nhờ họ nộp đơn rồi duyệt; bảng tự cập nhật. Cột <b>Công hưởng</b> là số công sẽ vào bảng lương. Bấm <b>Xuất Excel</b> để lưu bảng công.</p></> },
      ],
    },
    {
      tieuDe: "Cuối tháng: lương",
      sac: "hong",
      buoc: [
        { tieuDe: "Kiểm tham số và thỏa thuận lương", noiDung: <p>Vào <b>Bảng lương</b>. Tab <b>Tham số</b>: kiểm mức bảo hiểm, giảm trừ, biểu thuế rồi bấm <b>Xác nhận tất cả</b> (cần xác nhận trước khi duyệt kỳ thật). Tab <b>Thỏa thuận lương</b>: nhập cho từng người lương thỏa thuận, % KPI, phụ cấp, ăn ca, có đóng bảo hiểm không, số người phụ thuộc, và ô <b>Khấu trừ thuế 10%</b> (người đang thử việc luôn bị trừ 10% tự động; người chính thức tắt thì thuế lũy tiến, bật nếu cần trừ 10%). Ô 10% chỉ chị Lâm hoặc chị Linh đổi được, nhân sự chỉ xem. Sửa xong bấm <b>Cập nhật và tính lại cả kỳ</b> ở tab Bảng lương.</p> },
        { tieuDe: "Tạo kỳ và lập bảng lương", noiDung: <p>Tab <b>Bảng lương</b> → <b>Tạo kỳ lương</b> (chọn tháng, năm) → <b>Lập bảng lương</b>. Công lấy tự động từ Bảng công tháng. Mở từng dòng để nhập giờ tăng ca, hoa hồng, thưởng, khấu trừ khác; sửa công nếu cần.</p> },
        { tieuDe: "Đối chiếu thuế, bảo hiểm rồi chốt", noiDung: <p>Tab <b>Thuế và bảo hiểm</b> cho thấy cách ra từng số (bảo hiểm, giảm trừ, 5 bậc thuế). Bảng lương chỉ có hai bước người: chị Phượng bấm <b>Lập bảng lương</b>, rồi chị Lâm hoặc chị Linh bấm <b>Duyệt bảng lương</b> (người khác không thấy nút duyệt). Sau khi duyệt, đánh dấu <b>Đã chi</b> khi chuyển khoản xong; từ khi duyệt trở đi không sửa được dòng. Bấm <b>Xuất Excel</b> để lưu bảng lương, hoặc mở dòng của từng người bấm <b>In phiếu</b>.</p> },
      ],
    },
  ],
  luuY: [
    "Lương là dữ liệu nhạy cảm: chỉ Quản trị và Kỹ thuật xem được, đừng gửi tệp Excel lương qua kênh chung.",
    "Chưa xác nhận hết tham số thì chưa duyệt kỳ lương thật.",
  ],
};

const KY_THUAT: HuongDan = {
  vaiTro: "Kỹ thuật",
  loiNoi: "Quyền cao nhất: thấy mọi số liệu kể cả lương, duyệt tài khoản, gán vị trí Quản trị và giữ hệ thống ổn định. Tài khoản Kỹ thuật không phải chấm công.",
  sac: "tim",
  Icon: Terminal,
  phan: [
    {
      tieuDe: "Mỗi ngày",
      sac: "tim",
      buoc: [
        { tieuDe: "Duyệt tài khoản mới đăng ký", noiDung: <p>Ở <b>Tổng quan</b>, mục &quot;Tài khoản chờ duyệt&quot; (chỉ bạn thấy). Email do người đăng ký tự nhập và chưa xác minh, nên đối chiếu với người thật. Chọn hồ sơ nhân sự (hoặc &quot;Tạo hồ sơ mới theo đăng ký&quot;), chọn vai trò &quot;Theo vị trí&quot; (Quản trị tự có theo vị trí) hoặc &quot;Kỹ thuật&quot;, rồi bấm Duyệt.</p> },
        { tieuDe: "Đọc Toàn cảnh số liệu", noiDung: <p>Cuối <b>Tổng quan</b> là mục Toàn cảnh số liệu (chỉ Kỹ thuật thấy): nhân sự, tài khoản và đăng nhập, chấm công, đơn từ, tuyển dụng, lương, đánh giá, hệ thống. Thẻ chuyển cam hoặc hồng khi có việc cần chú ý (đơn chờ duyệt, đi muộn, tham số chưa xác nhận…).</p> },
      ],
    },
    {
      tieuDe: "Quyền chỉ riêng bạn có",
      sac: "xanh",
      buoc: [
        { tieuDe: "Đưa người vào vị trí Quản trị", noiDung: <p>Khi thêm hoặc sửa hồ sơ, chỉ bạn được đặt người vào khối Hành chính nhân sự hoặc chức vụ Giám đốc, Phó giám đốc (các vị trí tự có quyền Quản trị). Quản trị làm việc này sẽ bị chặn.</p> },
        { tieuDe: "Nộp đơn thay mọi người", noiDung: <p>Khi nộp đơn, ô <b>Nộp cho</b> cho phép chọn bất kỳ nhân viên nào; mọi loại đơn đều nộp được. Dùng để hỗ trợ nhập hộ khi người đó chưa tự làm được.</p> },
        { tieuDe: "Xem mọi thứ, kể cả lương", noiDung: <p>Bạn làm được mọi việc của Quản trị: Hồ sơ, Khối, Tuyển dụng, Bảng công tháng, Bảng lương (kỳ, thỏa thuận, tham số, thuế và bảo hiểm), xuất Excel và in phiếu. Hướng dẫn chi tiết các việc này nằm ở bản dành cho Quản trị.</p> },
      ],
    },
    {
      tieuDe: "Giữ hệ thống ổn định",
      sac: "cam",
      buoc: [
        { tieuDe: "Mục Kỹ thuật", noiDung: <p>Mục <b>Kỹ thuật</b> cho thấy tình trạng hệ thống: tổng số dòng dữ liệu, số dòng theo từng bảng, hạ tầng đang chạy.</p> },
        { tieuDe: "Tải bản sao lưu", noiDung: <p>Cũng ở mục Kỹ thuật, bấm <b>Tải bản sao lưu (JSON)</b> để lưu toàn bộ dữ liệu nghiệp vụ (không gồm tài khoản đăng nhập) ra nơi an toàn. Nên tải đều đặn, nhất là trước khi nhập hàng loạt hoặc đổi cấu trúc. Tệp chứa dữ liệu cá nhân và lương, đừng chia sẻ. Hiện ứng dụng chỉ tải về, chưa có chức năng khôi phục từ tệp.</p> },
      ],
    },
  ],
  luuY: [
    "Không có gì xoá hay khôi phục hàng loạt trong ứng dụng: việc phá huỷ dữ liệu thật chỉ làm khi có lệnh rõ của chủ dự án.",
    "Lương là dữ liệu nhạy cảm: tải bản sao lưu hoặc Excel lương thì cất ở nơi riêng.",
  ],
};

export default async function TrangHuongDan() {
  const nd = await layNguoiDungDaDuyet();
  const hd = nd.vaiTro === "ky_thuat" ? KY_THUAT : nd.vaiTro === "admin" ? QUAN_TRI : NHAN_VIEN;
  return (
    <div className="space-y-10">
      <TieuDeTrang tieuDe="Hướng dẫn sử dụng" phu={`Dành riêng cho vai trò ${hd.vaiTro}`} />

      <div className="relative overflow-hidden p-6 text-[var(--chu-tren-vang)]" style={{ background: dai(hd.sac), borderRadius: 14 }}>
        <span aria-hidden className="absolute -right-8 -top-8 h-36 w-36" style={{ background: "rgba(255,255,255,0.12)", borderRadius: 9999 }} />
        <div className="relative flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center" style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12 }}><hd.Icon className="h-6 w-6" strokeWidth={1.7} /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] opacity-90"><BookOpen className="h-4 w-4" strokeWidth={1.8} /> Hướng dẫn cho {hd.vaiTro}</div>
            <p className="mt-2 max-w-3xl text-[16px] leading-relaxed">{hd.loiNoi}</p>
          </div>
        </div>
      </div>

      {hd.phan.map((p) => (
        <section key={p.tieuDe} aria-label={p.tieuDe} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1.5" style={{ background: v(p.sac, "-mau"), borderRadius: 3 }} />
            <h2 className="text-[17px] font-semibold text-muc">{p.tieuDe}</h2>
            <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${v(p.sac, "-mau")} 45%, transparent), transparent)` }} />
          </div>
          <ol className="space-y-3">
            {p.buoc.map((b, i) => (
              <li key={b.tieuDe} className="flex gap-4 p-4" style={{ background: v(p.sac, "-nen"), borderRadius: 12, border: `1px solid color-mix(in srgb, ${v(p.sac, "-mau")} 26%, transparent)` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[14px] font-semibold text-[var(--chu-tren-vang)]" style={{ background: dai(p.sac), borderRadius: 9999 }}>{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-muc">{b.tieuDe}</div>
                  <div className="mt-1 space-y-1.5 text-[14px] leading-relaxed text-muc-2">{b.noiDung}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {hd.luuY.length > 0 && (
        <aside className="p-5" style={{ background: v("cam", "-nen"), borderRadius: 12, border: `1px solid color-mix(in srgb, ${v("cam", "-mau")} 30%, transparent)` }}>
          <div className="text-[14px] font-semibold" style={{ color: v("cam", "") }}>Lưu ý</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-muc-2">{hd.luuY.map((l) => <li key={l}>{l}</li>)}</ul>
        </aside>
      )}
    </div>
  );
}
