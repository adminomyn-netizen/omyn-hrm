import "server-only";
import { dbHr } from "@/lib/hr-db";
import { suKienThang, congNgay, dauThang, cuoiThang, type BaoCaoL, type DuLieuLich, type HdL, type NghiL, type NghiViecL, type NhanSuL } from "@/lib/lich-nhan-su";

const LOAI_NGHI = ["Nghỉ phép năm", "Nghỉ không lương", "Nghỉ ốm", "Nghỉ chế độ"];

/** Đọc mọi dữ liệu cần cho lịch của tháng (nam, thang): nhân sự, hợp đồng còn hiệu lực, đơn nghỉ đã duyệt trong tháng, hạn báo cáo, hồ sơ nghỉ việc gần đây. */
export async function docDuLieuLich(nam: number, thang: number): Promise<DuLieuLich> {
  const db = dbHr();
  const tu = dauThang(nam, thang), den = cuoiThang(nam, thang);
  const [nv, hs, hd, don, bc, nvv] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, trang_thai, ngay_vao_lam"),
    db.from("ho_so_ca_nhan").select("nhan_vien_id, ngay_sinh"),
    db.from("hop_dong_lao_dong").select("nhan_vien_id, loai, tu_ngay, den_ngay, trang_thai").eq("trang_thai", "Đang hiệu lực"),
    db.from("don_tu").select("nhan_vien_id, loai, tu_ngay, den_ngay").in("loai", LOAI_NGHI).eq("trang_thai", "Đã duyệt").lte("tu_ngay", den).gte("den_ngay", tu),
    db.from("han_bao_cao_nha_nuoc").select("ten, co_quan, chu_ky, han_ngay, han_thang, han_mot_lan, dang_bat"),
    db.from("nghi_viec").select("nhan_vien_id, ngay_lam_viec_cuoi, trang_thai").gte("ngay_lam_viec_cuoi", congNgay(tu, -45)),
  ]);
  const sinh = new Map(((hs.data ?? []) as { nhan_vien_id: string; ngay_sinh: string | null }[]).map((h) => [h.nhan_vien_id, h.ngay_sinh]));
  return {
    nhanSu: ((nv.data ?? []) as Omit<NhanSuL, "ngay_sinh">[]).map((n) => ({ ...n, ngay_sinh: sinh.get(n.id) ?? null })),
    hopDong: (hd.data ?? []) as HdL[],
    nghiPhep: (don.data ?? []) as NghiL[],
    baoCao: (bc.data ?? []) as BaoCaoL[],
    nghiViec: (nvv.data ?? []) as NghiViecL[],
  };
}

/** Các mốc nhắc cho hôm nay (gộp tháng này và tháng sau để không sót hạn đầu tháng). */
export async function suKienDeNhac(hom: string) {
  const nam = Number(hom.slice(0, 4)), thang = Number(hom.slice(5, 7));
  const [a, b] = await Promise.all([docDuLieuLich(nam, thang), docDuLieuLich(thang === 12 ? nam + 1 : nam, thang === 12 ? 1 : thang + 1)]);
  return [...suKienThang(a, nam, thang), ...suKienThang(b, thang === 12 ? nam + 1 : nam, thang === 12 ? 1 : thang + 1)];
}
