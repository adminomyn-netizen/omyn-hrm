import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { coCheCuaNguoi, diemThangCuaNguoi, mucHuongKpi } from "@/lib/kpi";
import { docChamThang, docCoChe } from "@/lib/kpi-data";
import { cotKetQua, tuDong, type Dong } from "@/lib/luong/dong-bo-ky";
import type { ThamSo } from "@/lib/luong/tinh-luong";

/** Đưa mức hưởng KPI (theo thang điểm) của tháng `thang` (`YYYY-MM`) vào "% hoàn thành KPI" của dòng lương cùng tháng, rồi tính lại dòng đó.
 * Chỉ khi người đó đã được chấm ĐỦ mọi nhóm của cơ chế áp cho họ, và chỉ ở kỳ còn sửa được (mở / đã lập); kỳ đã duyệt trở đi giữ nguyên.
 * Chấm lại thì số được cập nhật lại; ai muốn đổi tay thì sửa ở chi tiết dòng lương sau lần chấm cuối. Trả về số dòng lương đã đổi. */
export async function dongBoKpiVaoLuong(thang: string): Promise<{ capNhat: number }> {
  const [nam, th] = thang.split("-").map(Number);
  if (!nam || !th) return { capNhat: 0 };
  const db = createAdminClient();
  const { data: kys } = await db.from("ky_luong").select("id").eq("nam", nam).eq("thang", th).in("trang_thai", ["mo", "da_lap"]);
  if (!kys?.length) return { capNhat: 0 };
  const { data: bl } = await db.from("bang_luong").select("*").in("ky_luong_id", kys.map((k) => k.id));
  if (!bl?.length) return { capNhat: 0 };
  const [coChe, cham, nv, ts] = await Promise.all([
    docCoChe(), docChamThang(thang),
    db.from("nhan_vien").select("id, chuc_danh").in("id", [...new Set(bl.map((b) => b.nhan_vien_id))]),
    db.from("tham_so_luong").select("khoa, gia_tri"),
  ]);
  const p: ThamSo = {};
  for (const t of ts.data ?? []) p[t.khoa] = Number(t.gia_tri);
  const chucDanh = new Map((nv.data ?? []).map((n) => [n.id, n.chuc_danh as string | null]));
  let capNhat = 0;
  for (const d of bl) {
    const cc = coCheCuaNguoi(coChe, { id: d.nhan_vien_id, chucDanh: chucDanh.get(d.nhan_vien_id) });
    if (!cc || cc.nhom.length === 0) continue;
    const ids = new Set(cc.nhom.map((h) => h.id));
    const r = diemThangCuaNguoi(cham.filter((x) => x.nhanVienId === d.nhan_vien_id && ids.has(x.nhomId)), cc.nhom.length);
    if (r.diem === null || r.daCham < r.tong) continue;
    const huong = mucHuongKpi(r.diem);
    if (Number(d.ty_le_ht_kpi) === huong) continue;
    const moi = { ...(d as unknown as Dong), ty_le_ht_kpi: huong };
    const { error } = await db.from("bang_luong").update({ ty_le_ht_kpi: huong, ...cotKetQua(tuDong(moi), p) }).eq("id", d.id);
    if (!error) capNhat++;
  }
  return { capNhat };
}
