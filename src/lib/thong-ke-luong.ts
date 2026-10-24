import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type KyThongKe = { id: string; ten: string; thang: number; nam: number; soNguoi: number; tongThuNhap: number; thucLinh: number; bhNld: number; bhCty: number; thue: number; tienOt: number };
export type ThongKeLuong = { ky: KyThongKe[]; theoKhoi: { nhan: string; so: number }[] };

/** Số liệu lương cho biểu đồ ở Tổng quan: tối đa 6 kỳ gần nhất cộng theo kỳ, và quỹ lương theo khối của kỳ mới nhất. Chỉ gọi cho Quản trị/Kỹ thuật. */
export async function layThongKeLuong(): Promise<ThongKeLuong> {
  const db = createAdminClient();
  const { data: ky, error } = await db.from("ky_luong").select("id, ten_ky, thang, nam").not("thang", "is", null).not("nam", "is", null).order("nam", { ascending: false }).order("thang", { ascending: false }).limit(6);
  if (error) throw new Error(error.message);
  if (!ky || ky.length === 0) return { ky: [], theoKhoi: [] };
  const { data: dong, error: loi2 } = await db
    .from("bang_luong")
    .select("ky_luong_id, tong_thu_nhap, thuc_linh, bh_xh, bh_yt, bh_tn, bh_cty, thue_tncn, tien_ot, nhan_vien(khoi(ten))")
    .in("ky_luong_id", ky.map((k) => k.id));
  if (loi2) throw new Error(loi2.message);

  const kyAsc = [...ky].reverse();
  const ra: KyThongKe[] = kyAsc.map((k) => {
    const d = (dong ?? []).filter((x) => x.ky_luong_id === k.id);
    const t = (f: (x: (typeof d)[number]) => number) => d.reduce((s, x) => s + f(x), 0);
    return { id: k.id, ten: k.ten_ky, thang: k.thang!, nam: k.nam!, soNguoi: d.length, tongThuNhap: t((x) => Number(x.tong_thu_nhap)), thucLinh: t((x) => Number(x.thuc_linh)), bhNld: t((x) => Number(x.bh_xh) + Number(x.bh_yt) + Number(x.bh_tn)), bhCty: t((x) => Number(x.bh_cty)), thue: t((x) => Number(x.thue_tncn)), tienOt: t((x) => Number(x.tien_ot)) };
  });
  const moiNhat = ky[0];
  const khoi = new Map<string, number>();
  for (const x of (dong ?? []).filter((d) => d.ky_luong_id === moiNhat.id)) {
    const ten = x.nhan_vien?.khoi?.ten ?? "Chưa gán khối";
    khoi.set(ten, (khoi.get(ten) ?? 0) + Number(x.tong_thu_nhap));
  }
  return { ky: ra, theoKhoi: [...khoi.entries()].map(([nhan, so]) => ({ nhan, so })).sort((a, b) => b.so - a.so) };
}
