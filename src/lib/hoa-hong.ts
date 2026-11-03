export type Ctv = { id: string; ten: string; loai: string; tyLe: number | null; dangHopTac: boolean };
export type HoaHong = { ctvId: string; ngay: string; soTienDon: number; tyLe: number; soTien: number; trangThai: string };
export type HoaHongCtv = { ctvId: string; ten: string; soDon: number; doanhSo: number; choDuyet: number; daDuyetChuaChi: number; daChi: number };

/** Hoa hồng một đơn = giá trị đơn × tỷ lệ % (làm tròn xuống đồng). */
export const tinhHoaHong = (soTienDon: number, tyLe: number) => Math.floor((soTienDon * tyLe) / 100);

/** Khi ghi hoa hồng: tỷ lệ lấy theo ô nhập, thiếu thì lấy tỷ lệ mặc định của người giới thiệu; không có cả hai thì báo lỗi, không đoán. */
export function tyLeApDung(nhap: number | null, ctv: Pick<Ctv, "tyLe">): number | null {
  return nhap ?? ctv.tyLe ?? null;
}

/**
 * Hoa hồng từng người giới thiệu trong kỳ [tu, den] theo ngày đơn. Đơn Huỷ không tính vào đâu.
 * Còn phải chi = Đã duyệt mà chưa Đã chi; Chờ duyệt chưa phải khoản phải chi.
 */
export function hoaHongTheoCtv(ctv: readonly Ctv[], hh: readonly HoaHong[], tu: string, den: string): HoaHongCtv[] {
  const trong = hh.filter((h) => h.ngay >= tu && h.ngay <= den && h.trangThai !== "Huỷ");
  return ctv
    .map((c) => {
      const ds = trong.filter((h) => h.ctvId === c.id);
      const t = (tt: string) => ds.filter((h) => h.trangThai === tt).reduce((a, h) => a + h.soTien, 0);
      return { ctvId: c.id, ten: c.ten, soDon: ds.length, doanhSo: ds.reduce((a, h) => a + h.soTienDon, 0), choDuyet: t("Chờ duyệt"), daDuyetChuaChi: t("Đã duyệt"), daChi: t("Đã chi") };
    })
    .filter((r) => r.soDon > 0)
    .sort((a, b) => b.daDuyetChuaChi - a.daDuyetChuaChi || b.doanhSo - a.doanhSo);
}
