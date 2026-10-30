/** Luật hợp đồng lao động dùng để CẢNH BÁO (không tự khẳng định): mốc theo Bộ luật Lao động 2019, ghi như trang hrm.vieclamngay.vn đang dùng.
 * Mọi mốc đều "chờ kế toán/luật sư xác nhận" — xem CHO_XAC_NHAN. */

export const CHO_XAC_NHAN = "chờ kế toán/luật sư xác nhận";
/** Hợp đồng xác định thời hạn: tối đa 2 lần, lần sau phải là không xác định thời hạn (Điều 20 BLLĐ 2019). */
export const TOI_DA_HD_XAC_DINH = 2;
/** Thử việc: mốc phổ biến nhất (cao đẳng trở lên) 60 ngày; mốc khác theo chức danh cần xác nhận. */
export const TOI_DA_NGAY_THU_VIEC = 60;
export const NGAY_BAO_SAP_HET = 45;

export type HopDong = { nhan_vien_id: string | null; loai: string; tu_ngay: string; den_ngay: string | null; trang_thai: string };
export type CanhBaoHd = { nhanVienId: string; muc: "loi" | "cho"; noiDung: string };

const MS = 86_400_000;
const ngay = (d: string) => Date.parse(`${d}T00:00:00Z`);

/** Cảnh báo hợp đồng cho từng nhân sự đang làm: thiếu hợp đồng, hết hạn mà vẫn đang làm, thử việc quá mốc, ký xác định thời hạn quá số lần. */
export function canhBaoHopDong(hd: readonly HopDong[], dangLam: readonly string[], homNay: string): CanhBaoHd[] {
  const ra: CanhBaoHd[] = [];
  for (const nv of dangLam) {
    const ds = hd.filter((h) => h.nhan_vien_id === nv).sort((a, b) => a.tu_ngay.localeCompare(b.tu_ngay));
    if (ds.length === 0) { ra.push({ nhanVienId: nv, muc: "loi", noiDung: "Chưa có hợp đồng nào trong hồ sơ." }); continue; }
    const hieuLuc = ds.filter((h) => h.trang_thai === "Đang hiệu lực" || (h.trang_thai !== "Đã chấm dứt" && h.trang_thai !== "Chờ ký" && h.tu_ngay <= homNay && (!h.den_ngay || h.den_ngay >= homNay)));
    if (hieuLuc.length === 0) ra.push({ nhanVienId: nv, muc: "loi", noiDung: "Không có hợp đồng đang hiệu lực (đã hết hạn hoặc chưa ký)." });
    const xdth = ds.filter((h) => h.loai === "Xác định thời hạn");
    if (xdth.length > TOI_DA_HD_XAC_DINH) ra.push({ nhanVienId: nv, muc: "loi", noiDung: `Đã ký ${xdth.length} hợp đồng xác định thời hạn, vượt ${TOI_DA_HD_XAC_DINH} lần (${CHO_XAC_NHAN}).` });
    else if (xdth.length === TOI_DA_HD_XAC_DINH && hieuLuc.some((h) => h.loai === "Xác định thời hạn") && !ds.some((h) => h.loai === "Không xác định thời hạn")) {
      ra.push({ nhanVienId: nv, muc: "cho", noiDung: `Đã ký đủ ${TOI_DA_HD_XAC_DINH} lần xác định thời hạn: lần tới phải ký không xác định thời hạn (${CHO_XAC_NHAN}).` });
    }
    for (const h of ds) {
      if (h.loai === "Thử việc" && h.den_ngay && (ngay(h.den_ngay) - ngay(h.tu_ngay)) / MS + 1 > TOI_DA_NGAY_THU_VIEC) {
        ra.push({ nhanVienId: nv, muc: "cho", noiDung: `Thử việc dài hơn ${TOI_DA_NGAY_THU_VIEC} ngày: cần đối chiếu mốc theo chức danh (${CHO_XAC_NHAN}).` });
      }
    }
    for (const h of hieuLuc) {
      if (h.den_ngay) {
        const con = Math.round((ngay(h.den_ngay) - ngay(homNay)) / MS);
        if (con <= NGAY_BAO_SAP_HET && con >= 0) ra.push({ nhanVienId: nv, muc: "cho", noiDung: `Hợp đồng ${h.loai.toLowerCase()} còn ${con} ngày là hết hạn.` });
      }
    }
  }
  return ra;
}
