import { dbHr } from "@/lib/hr-db";
import { type DongLuongBc, type KyBc } from "@/lib/bao-cao-luong";

const so = (v: unknown) => Number(v ?? 0) || 0;

/** Các kỳ lương (có tháng/năm) và mọi dòng lương của chúng. Chỉ gọi cho Quản trị/Kỹ thuật. */
export async function layDuLieuLuongBc(): Promise<{ ky: KyBc[]; dong: DongLuongBc[] }> {
  const db = dbHr();
  const { data: ky } = await db.from("ky_luong").select("id, ten_ky, thang, nam, trang_thai").not("thang", "is", null).not("nam", "is", null);
  const kyBc: KyBc[] = ((ky ?? []) as { id: string; ten_ky: string; thang: number; nam: number; trang_thai: string }[]).map((k) => ({ id: k.id, ten: k.ten_ky, thang: k.thang, nam: k.nam, trangThai: k.trang_thai }));
  if (kyBc.length === 0) return { ky: [], dong: [] };
  const { data: dong } = await db
    .from("bang_luong")
    .select("ky_luong_id, nhan_vien_id, tong_thu_nhap, thuc_linh, bh_xh, bh_yt, bh_tn, bh_cty, thue_tncn, tien_ot, phu_cap_thuc, tien_an, nhan_vien(khoi(ten))")
    .in("ky_luong_id", kyBc.map((k) => k.id));
  const rows = (dong ?? []) as unknown as Record<string, unknown>[];
  return {
    ky: kyBc,
    dong: rows.map((r) => ({
      kyId: String(r.ky_luong_id),
      khoi: (r.nhan_vien as { khoi: { ten: string } | null } | null)?.khoi?.ten ?? null,
      tongThuNhap: so(r.tong_thu_nhap),
      thucLinh: so(r.thuc_linh),
      bhNld: so(r.bh_xh) + so(r.bh_yt) + so(r.bh_tn),
      bhCty: so(r.bh_cty),
      thue: so(r.thue_tncn),
      tienOt: so(r.tien_ot),
      phuCapThuc: so(r.phu_cap_thuc),
      tienAn: so(r.tien_an),
    })),
  };
}
