import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { congChuanTheoKy, tinhLuong, type DauVaoLuong, type ThamSo } from "@/lib/luong/tinh-luong";
import { layBangCongThang } from "@/lib/bang-cong";

export type Dong = {
  luong_thoa_thuan: number; ty_le_kpi: number; thu_viec: boolean; cong_chuan: number; cong_huong: number; ngay_lam: number; ty_le_ht_kpi: number;
  phu_cap: number; phu_cap_mien_thue: boolean; an_ca: boolean; dong_bh: boolean; so_nguoi_phu_thuoc: number;
  gio_ot_thuong: number; gio_ot_nghi_tuan: number; gio_ot_le: number; hoa_hong: number; thuong_khac: number; khau_tru_khac: number;
};
export const tuDong = (d: Dong): DauVaoLuong => ({
  luongThoaThuan: Number(d.luong_thoa_thuan), tyLeKpi: d.ty_le_kpi, thuViec: d.thu_viec, congChuan: Number(d.cong_chuan), congHuong: Number(d.cong_huong), ngayLam: Number(d.ngay_lam),
  tyLeHtKpi: d.ty_le_ht_kpi, phuCap: Number(d.phu_cap), phuCapMienThue: d.phu_cap_mien_thue, anCa: d.an_ca, dongBh: d.dong_bh, soNguoiPhuThuoc: d.so_nguoi_phu_thuoc,
  gioOtThuong: Number(d.gio_ot_thuong), gioOtNghiTuan: Number(d.gio_ot_nghi_tuan), gioOtLe: Number(d.gio_ot_le), hoaHong: Number(d.hoa_hong), thuongKhac: Number(d.thuong_khac), khauTruKhac: Number(d.khau_tru_khac),
});
export const cotKetQua = (v: DauVaoLuong, p: ThamSo) => {
  const r = tinhLuong(v, p);
  return {
    luong_chuc_danh: r.luongChucDanh, luong_kpi: r.luongKpi, phu_cap_thuc: r.phuCapThuc, tien_an: r.tienAn, tien_ot: r.tienOt, tong_thu_nhap: r.tongThuNhap,
    bh_xh: r.bhXh, bh_yt: r.bhYt, bh_tn: r.bhTn, giam_tru: r.giamTru, thu_nhap_tinh_thue: r.thuNhapTinhThue, thue_tncn: r.thueTncn, thuc_linh: r.thucLinh, bh_cty: r.bhCty,
    tinh_luc: new Date().toISOString(),
  };
};


/** Đồng bộ dòng lương của kỳ còn sửa được (mở / đã lập) với hồ sơ: trạng thái Thử việc, Thỏa thuận lương hiện tại (lương, KPI nền, phụ cấp, tiền ăn, bảo hiểm, người phụ thuộc, kiểu công) và công chuẩn theo tháng.
 *  Chỉ ghi dòng nào có số thay đổi (hoặc mọi dòng khi `ep`, để tính lại theo tham số mới). GIỮ NGUYÊN số liệu nhập riêng của kỳ: công hưởng, ngày làm, % hoàn thành KPI, giờ tăng ca, hoa hồng, thưởng, khấu trừ. */
export async function dongBoKyTuHoSo(kyId: string, p: ThamSo, ep = false): Promise<{ tong: number; doi: number; loi?: string }> {
  const db = createAdminClient();
  const { data: ky } = await db.from("ky_luong").select("id, thang, nam, trang_thai").eq("id", kyId).maybeSingle();
  if (!ky || !["mo", "da_lap"].includes(ky.trang_thai)) return { tong: 0, doi: 0 };
  const [bl, nv, tt] = await Promise.all([
    db.from("bang_luong").select("*").eq("ky_luong_id", kyId),
    db.from("nhan_vien").select("id, trang_thai"),
    db.from("luong_thoa_thuan").select("*"),
  ]);
  const data = bl.data ?? [];
  if (data.length === 0) return { tong: 0, doi: 0 };
  const cc = ky.nam && ky.thang ? await layBangCongThang(ky.nam, ky.thang) : null;
  const congTheoNguoi = new Map((cc?.dong ?? []).map((x) => [x.nhanVienId, x.tong]));
  const nvMap = new Map((nv.data ?? []).map((n) => [n.id, n.trang_thai]));
  const ttMap = new Map((tt.data ?? []).map((t) => [t.nhan_vien_id, t]));
  let doi = 0;
  for (const d of data) {
    const t = ttMap.get(d.nhan_vien_id);
    const moiHoSo: Record<string, unknown> = {};
    if (nvMap.has(d.nhan_vien_id)) moiHoSo.thu_viec = nvMap.get(d.nhan_vien_id) === "Thử việc";
    if (t) {
      Object.assign(moiHoSo, {
        luong_thoa_thuan: Number(t.luong_thoa_thuan), ty_le_kpi: t.ty_le_kpi, phu_cap: Number(t.phu_cap), phu_cap_mien_thue: t.phu_cap_mien_thue, an_ca: t.an_ca,
        dong_bh: t.dong_bh, so_nguoi_phu_thuoc: t.so_nguoi_phu_thuoc, kieu_cong: t.kieu_cong,
      });
    }
    if (ky.nam && ky.thang) {
      const congChuan = congChuanTheoKy((t?.kieu_cong ?? d.kieu_cong) as "van_phong" | "van_hanh", ky.nam, ky.thang, p.t7_nghi_moi_thang ?? 2);
      moiHoSo.cong_chuan = congChuan;
      // Công chuẩn đổi thì công cũ có thể đã bị cắt ở mức cũ (vd 24): lấy lại từ bảng công. Công chuẩn không đổi thì giữ số đã nhập tay.
      const tong = congTheoNguoi.get(d.nhan_vien_id);
      const laiTuCong = Number(d.cong_chuan) !== congChuan && !!tong;
      moiHoSo.cong_huong = Math.min(laiTuCong ? tong!.congHuong : Number(d.cong_huong), congChuan);
      moiHoSo.ngay_lam = Math.min(laiTuCong ? tong!.congLam : Number(d.ngay_lam), congChuan);
    }
    const khac = Object.entries(moiHoSo).some(([k, v]) => {
      const cu = (d as Record<string, unknown>)[k];
      return typeof v === "number" ? Number(cu) !== v : cu !== v;
    });
    if (!ep && !khac) continue;
    const moi = { ...(d as unknown as Dong), ...(moiHoSo as Partial<Dong>) };
    const { error } = await db.from("bang_luong").update({ ...moiHoSo, ...cotKetQua(tuDong(moi), p) } as never).eq("id", d.id);
    if (error) return { tong: data.length, doi, loi: "Chưa tính lại được. Thử lại sau." };
    doi++;
  }
  return { tong: data.length, doi };
}
