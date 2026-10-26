import { createAdminClient } from "@/lib/supabase/admin";
import { layNhanVienIdTheoUser } from "@/lib/data";

export type YeuCauTd = {
  id: string; ma: string; vi_tri: string; khoi_id: string | null; khoi_ten: string; so_luong: number; loai_tuyen: string; thay_the_cho: string | null;
  muc_luong: string | null; mo_ta_ngan: string | null; yeu_cau_chinh: string | null; han_can_nhan_su: string | null; nguoi_yeu_cau_id: string | null;
  nguoi_yeu_cau_ten: string; trang_thai: string; ly_do_tu_choi: string | null; ngay_tiep_nhan: string | null; ngay_hoan_thanh: string | null; tao_luc: string;
  soTin: number;
};

/** Yêu cầu tuyển dụng; `chiCuaNguoi` = chỉ lấy của một nhân viên (trưởng bộ phận xem yêu cầu của mình). */
export async function layYeuCauTuyenDung(chiCuaNguoi?: string | null): Promise<YeuCauTd[]> {
  const db = createAdminClient();
  let q = db.from("yeu_cau_tuyen_dung").select("*, khoi(ten)").order("tao_luc", { ascending: false });
  if (chiCuaNguoi) q = q.eq("nguoi_yeu_cau_id", chiCuaNguoi);
  const [{ data, error }, { data: tin }] = await Promise.all([q, db.from("tin_tuyen_dung").select("yeu_cau_id").not("yeu_cau_id", "is", null)]);
  if (error) throw error;
  const dem = new Map<string, number>();
  for (const t of tin ?? []) if (t.yeu_cau_id) dem.set(t.yeu_cau_id, (dem.get(t.yeu_cau_id) ?? 0) + 1);
  return (data ?? []).map(({ khoi, ...y }) => ({ ...y, khoi_ten: khoi?.ten ?? "", soTin: dem.get(y.id) ?? 0 }));
}

export async function layKenhDang() {
  const { data, error } = await createAdminClient().from("dang_tin_kenh").select("id, tin_tuyen_dung_id, kenh, link_bai, ngay_dang, chi_phi, trang_thai, ghi_chu").order("ngay_dang", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export type KenhDang = Awaited<ReturnType<typeof layKenhDang>>[number];

/** Ai được gửi yêu cầu tuyển dụng: Quản trị/Kỹ thuật, hoặc người đang là quản lý trực tiếp của ít nhất một nhân viên. */
export async function coQuyenGuiYeuCau(userId: string, vaiTro: string): Promise<{ ok: boolean; nhanVienId: string | null }> {
  const nhanVienId = await layNhanVienIdTheoUser(userId);
  if (vaiTro === "admin" || vaiTro === "ky_thuat") return { ok: true, nhanVienId };
  if (!nhanVienId) return { ok: false, nhanVienId };
  const { count } = await createAdminClient().from("nhan_vien").select("id", { count: "exact", head: true }).or(`quan_ly_id.eq.${nhanVienId},quan_ly_phu_id.eq.${nhanVienId}`).neq("trang_thai", "Đã nghỉ");
  return { ok: (count ?? 0) > 0, nhanVienId };
}

