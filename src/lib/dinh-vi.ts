/** Giới hạn vị trí chấm công: tính khoảng cách và quyết định cho/không cho chấm. Thuần hàm, không đụng DB. */

export type ToaDo = { viDo: number; kinhDo: number; doChinhXac: number | null };
export type CauHinhViTri = { ten: string; diaChi: string; viDo: number; kinhDo: number; banKinhM: number; daXacNhan: boolean };

/** Bán kính chấm công quanh văn phòng (mét): chị Lâm chốt 31/10/2026 = 30 m. Được ghi vào DB khi Quản trị chốt lại toạ độ văn phòng. */
export const BAN_KINH_CHAM_CONG_M = 30;

/** Độ chính xác GPS tối đa (mét) chấp nhận được; kém hơn thì không đủ tin để so với bán kính chấm công. */
export const DO_CHINH_XAC_TOI_DA_M = 100;

const R_TRAI_DAT_M = 6_371_008.8;
const rad = (d: number) => (d * Math.PI) / 180;

/** Khoảng cách đường chim bay giữa hai toạ độ (mét), công thức haversine. */
export function khoangCachMet(a: { viDo: number; kinhDo: number }, b: { viDo: number; kinhDo: number }) {
  const dLat = rad(b.viDo - a.viDo);
  const dLon = rad(b.kinhDo - a.kinhDo);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.viDo)) * Math.cos(rad(b.viDo)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_TRAI_DAT_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const toaDoHopLe = (t: unknown): t is ToaDo =>
  !!t && typeof t === "object" &&
  Number.isFinite((t as ToaDo).viDo) && Math.abs((t as ToaDo).viDo) <= 90 &&
  Number.isFinite((t as ToaDo).kinhDo) && Math.abs((t as ToaDo).kinhDo) <= 180 &&
  ((t as ToaDo).doChinhXac === null || (Number.isFinite((t as ToaDo).doChinhXac) && (t as ToaDo).doChinhXac! >= 0));

export type KetQuaViTri =
  | { ok: true; khoangCachM: number | null }
  | { ok: false; loi: string; khoangCachM?: number; ngoaiVung?: boolean };

/** Chưa xác nhận vị trí văn phòng thì chưa chặn (khoangCachM = null). Đã xác nhận: phải có GPS, đủ chính xác và nằm trong bán kính. */
export function kiemViTri(cau: CauHinhViTri, toaDo: unknown): KetQuaViTri {
  if (!cau.daXacNhan) return { ok: true, khoangCachM: null };
  if (!toaDoHopLe(toaDo)) return { ok: false, loi: "Chưa lấy được vị trí của bạn. Bật định vị (GPS) cho trình duyệt rồi thử lại." };
  if (toaDo.doChinhXac !== null && toaDo.doChinhXac > DO_CHINH_XAC_TOI_DA_M)
    return { ok: false, loi: `Định vị đang sai lệch khoảng ${Math.round(toaDo.doChinhXac)} m, chưa đủ chính xác. Ra chỗ thoáng hoặc bật "vị trí chính xác" rồi thử lại.` };
  const m = Math.round(khoangCachMet(cau, toaDo));
  if (m > cau.banKinhM)
    return { ok: false, ngoaiVung: true, khoangCachM: m, loi: `Bạn đang cách văn phòng khoảng ${m} m, ngoài phạm vi ${cau.banKinhM} m nên chưa chấm công được. Nếu làm việc ngoài công ty, hãy nộp phiếu "Chấm công ngoài công ty" ở mục Đơn từ.` };
  return { ok: true, khoangCachM: m };
}
