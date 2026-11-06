import "server-only";
import { chuTongHopBaoCao, mocTongHopBaoCao, nhacBaoCaoCv } from "@/lib/bao-cao-cv";
import { nguoiNhanTongHopBaoCao, nguoiPhaiBaoCaoCv, tinhTrangBaoCaoCaNhan } from "@/lib/bao-cao-cv-data";
import type { guiChoNguoiDung } from "@/lib/push";

type Gui = (userId: string, khung: string, tin: Parameters<typeof guiChoNguoiDung>[1], trongApp?: boolean) => Promise<void>;

/** Nhắc báo cáo công việc hằng ngày (chạy trong cron nhắc, bọc try/catch ở nơi gọi để lỗi ở đây không làm hỏng nhắc chấm công):
 *  · Mỗi người PHẢI báo cáo (trừ Giám đốc, Phó giám đốc, Kỹ thuật): nhắc sáng việc hôm nay; chiều/tối nhắc nộp nếu chưa nộp.
 *  · Giám đốc, Phó giám đốc, Kỹ thuật: 17:45 tổng hợp "x/y đã nộp, ai chưa nộp"; 20:00 nhắc lại chỉ khi vẫn còn người chưa nộp. */
export async function nhacBaoCaoCongViec(o: { hom: string; phut: number; gui: Gui }): Promise<number> {
  const { hom, phut, gui } = o;
  const moc = mocTongHopBaoCao(phut);
  const canNhacNguoi = nhacBaoCaoCv(phut, 0, false) !== null;
  if (!canNhacNguoi && !moc) return 0;
  const ds = await nguoiPhaiBaoCaoCv(hom);
  if (ds.length === 0) return 0;
  const tt = await tinhTrangBaoCaoCaNhan(hom, ds.map((n) => n.nhanVienId));
  let dem = 0;
  for (const n of ds) {
    const t = tt.get(n.nhanVienId);
    const nhac = nhacBaoCaoCv(phut, t?.soViec ?? 0, t?.daNop ?? false);
    if (nhac) { await gui(n.userId, nhac.khung, { tieuDe: nhac.tieuDe, noiDung: nhac.noiDung, url: nhac.url }, true); dem++; }
  }
  if (moc) {
    const chua = ds.filter((n) => !tt.get(n.nhanVienId)?.daNop).map((n) => n.hoTen);
    if (moc === "cv_tong1" || chua.length > 0) {
      for (const u of await nguoiNhanTongHopBaoCao()) await gui(u, moc, { tieuDe: "Báo cáo công việc hôm nay", noiDung: chuTongHopBaoCao(ds.length - chua.length, ds.length, chua), url: "/cong-viec/tong-quan" }, true);
    }
  }
  return dem;
}
