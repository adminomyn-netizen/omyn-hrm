/** Báo cáo công việc hằng ngày — hàm thuần (không đụng DB) để dùng ở cron nhắc, trang và test. */

/** Người KHÔNG phải nộp báo cáo công việc hằng ngày và là người xem tổng quan (chị Lâm 06/11): Tổng giám đốc, Giám đốc, Phó (tổng) giám đốc, và tài khoản Kỹ thuật.
 *  KHÔNG dùng `khongCanChamCong`: hàm đó cố ý giữ Phó giám đốc trong danh sách chấm công. Người giữ cờ quyền giám đốc cũng được miễn. */
export const CHUC_DANH_SEP = ["tổng giám đốc", "phó tổng giám đốc", "giám đốc", "phó giám đốc"];
export function mienBaoCaoCv(vaiTro: string | null | undefined, chucDanh: string | null | undefined, quyenGiamDoc?: boolean | null): boolean {
  return vaiTro === "ky_thuat" || !!quyenGiamDoc || CHUC_DANH_SEP.includes((chucDanh ?? "").trim().toLowerCase());
}

/** Link minh chứng: để trống hợp lệ (trả ""), chỉ nhận http/https (đường dẫn hiện thành thẻ <a>, nên chặn javascript:/data:), tối đa 500 ký tự. Sai thì trả null. */
export function chuanHoaLink(s: unknown): string | null {
  const t = String(s ?? "").trim();
  if (!t) return "";
  if (t.length > 500 || /\s/.test(t)) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href.slice(0, 500) : null;
  } catch {
    return null;
  }
}

/** Tên miền ngắn để hiện trên thẻ ("docs.google.com"). */
export const tenMienLink = (link: string) => { try { return new URL(link).hostname.replace(/^www\./, ""); } catch { return link; } };

export type NhacBaoCao = { khung: string; tieuDe: string; noiDung: string; url: string };
const P = (g: number, p = 0) => g * 60 + p;
/** Các mốc nhắc báo cáo công việc (phút trong ngày, giờ Việt Nam). Mỗi mốc cố định và chỉ gửi MỘT lần (khoá `khung` ở bảng nhac_da_gui) —
 *  không nhắc dồn dập 10 phút một lần vì khung 17:00–20:00 đã có nhắc chấm công ra. Mốc sáng nhắc việc trong ngày; các mốc chiều/tối chỉ gửi khi CHƯA nộp báo cáo. */
export function nhacBaoCaoCv(phut: number, soViec: number, daNop: boolean): NhacBaoCao | null {
  if (phut >= P(8, 30) && phut < P(10)) {
    return soViec > 0
      ? { khung: "cv_sang", tieuDe: "Việc hôm nay", noiDung: `Hôm nay bạn có ${soViec} việc. Cập nhật tiến độ trong ngày và nhớ gắn link minh chứng.`, url: "/cong-viec" }
      : { khung: "cv_sang", tieuDe: "Chưa có việc hôm nay", noiDung: "Danh sách việc hôm nay đang trống. Thêm việc (có mẫu gợi ý) để cuối ngày báo cáo kết quả.", url: "/cong-viec" };
  }
  if (daNop) return null;
  if (phut >= P(16, 45) && phut < P(17, 30)) return { khung: "cv_c1", tieuDe: "Sắp hết ngày làm", noiDung: "Nhớ nộp báo cáo kết quả công việc hôm nay, kèm link minh chứng.", url: "/cong-viec" };
  if (phut >= P(17, 30) && phut < P(19, 30)) return { khung: "cv_c2", tieuDe: "Bạn chưa nộp báo cáo công việc", noiDung: "Nộp báo cáo kết quả công việc hôm nay để Giám đốc nắm tiến độ.", url: "/cong-viec" };
  if (phut >= P(19, 30) && phut < P(21, 30)) return { khung: "cv_c3", tieuDe: "Vẫn chưa nộp báo cáo công việc", noiDung: "Nộp báo cáo trước khi hết ngày. Chưa làm được gì thì ghi rõ lý do.", url: "/cong-viec" };
  return null;
}

/** Mốc gửi tổng hợp cho Giám đốc / Phó giám đốc / Kỹ thuật: 17:45 và nhắc cuối 20:00 (chỉ khi còn người chưa nộp). */
export function mocTongHopBaoCao(phut: number): "cv_tong1" | "cv_tong2" | null {
  if (phut >= P(17, 45) && phut < P(19)) return "cv_tong1";
  if (phut >= P(20) && phut < P(21, 30)) return "cv_tong2";
  return null;
}

/** Dòng chữ tổng hợp cho cấp quản lý: "3/5 đã nộp. Chưa nộp: A, B". */
export function chuTongHopBaoCao(daNop: number, tong: number, chuaNop: string[]): string {
  if (tong === 0) return "Hôm nay không có ai phải nộp báo cáo công việc.";
  const dau = `${daNop}/${tong} người đã nộp báo cáo công việc hôm nay.`;
  if (chuaNop.length === 0) return `${dau} Tất cả đã nộp.`;
  const ten = chuaNop.slice(0, 5).join(", ") + (chuaNop.length > 5 ? ` và ${chuaNop.length - 5} người nữa` : "");
  return `${dau} Chưa nộp: ${ten}.`;
}

/** Quy tắc "không có minh chứng thì không được bấm Hoàn thành" (chị Lâm 06/11), áp cho người PHẢI báo cáo (không phải Giám đốc/Phó giám đốc/Kỹ thuật).
 *  · Việc lặp hằng ngày: chỉ ghi nhận bớt/thêm từng phần được; khi số làm trong ngày CHẠM mục tiêu thì cần link minh chứng của HÔM NAY.
 *  · Việc một lần: bấm Hoàn thành (hoặc ghi nhận đủ số) cần có link minh chứng (bất kỳ ngày nào đã gắn cho việc đó).
 *  Trả về câu báo lỗi khi bị chặn, null khi được phép. */
export function chanHoanThanhThieuMinhChung(o: { phaiCoMinhChung: boolean; lapLai: boolean; daLamMoi: number; mucTieu: number; coMinhChung: boolean; dichHoanThanh: boolean }): string | null {
  if (!o.phaiCoMinhChung || o.coMinhChung) return null;
  const chamMuc = o.lapLai ? o.daLamMoi >= o.mucTieu : o.dichHoanThanh || o.daLamMoi >= o.mucTieu;
  if (!chamMuc) return null;
  return "Cần gắn link minh chứng cho việc này trước khi bấm hoàn thành. Bấm \"Thêm link\" dưới tên việc, dán link rồi lưu.";
}

/** Nội dung báo cho Giám đốc / Phó giám đốc / Kỹ thuật khi một nhân sự vừa thêm việc: ai, phòng ban nào, việc gì. */
export function tinThemViec(o: { hoTen: string; khoi: string | null | undefined; tieuDe: string[] }): { tieuDe: string; noiDung: string } {
  const khoi = o.khoi ? ` (${o.khoi})` : "";
  const n = o.tieuDe.length;
  const ds = o.tieuDe.slice(0, 3).map((t) => (t.length > 60 ? `${t.slice(0, 57)}…` : t)).join("; ") + (n > 3 ? ` và ${n - 3} việc nữa` : "");
  return { tieuDe: n === 1 ? "Nhân sự vừa thêm việc" : `Nhân sự vừa thêm ${n} việc`, noiDung: `${o.hoTen}${khoi} đã thêm: ${ds}.` };
}
