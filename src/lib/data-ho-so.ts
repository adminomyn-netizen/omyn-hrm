import { createAdminClient } from "@/lib/supabase/admin";
import { layNhanVienIdTheoUser } from "@/lib/data";
import { giayToConThieu, tyLeDienHoSo } from "@/lib/ho-so";

export const KHO_HO_SO = "ho-so-nhan-vien";

/** Quyền với hồ sơ của một nhân viên: Quản trị/Kỹ thuật xem và xác nhận hồ sơ mọi người; nhân viên chỉ xem và tự bổ sung hồ sơ của chính mình. */
export async function quyenHoSo(nguoi: { id: string; vaiTro: string }, nhanVienId: string): Promise<{ xem: boolean; quanTri: boolean }> {
  if (nguoi.vaiTro === "admin" || nguoi.vaiTro === "ky_thuat") return { xem: true, quanTri: true };
  if (nguoi.vaiTro !== "nhan_vien") return { xem: false, quanTri: false };
  return { xem: (await layNhanVienIdTheoUser(nguoi.id)) === nhanVienId, quanTri: false };
}

export async function layHoSoDayDu(nhanVienId: string) {
  const db = createAdminClient();
  const [nv, hs, tn, tl] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien, chuc_danh, email, ngay_vao_lam, trang_thai, khoi(ten)").eq("id", nhanVienId).maybeSingle(),
    db.from("ho_so_ca_nhan").select("*").eq("nhan_vien_id", nhanVienId).maybeSingle(),
    db.from("than_nhan").select("*").eq("nhan_vien_id", nhanVienId).order("tao_luc"),
    db.from("tai_lieu_nhan_vien").select("id, loai, ten_tep, mime, kich_thuoc, trang_thai, ghi_chu, tao_luc, da_go").eq("nhan_vien_id", nhanVienId).eq("da_go", false).order("tao_luc", { ascending: false }),
  ]);
  if (nv.error) throw nv.error;
  if (!nv.data) return null;
  return { nhanVien: nv.data, hoSo: hs.data, thanNhan: tn.data ?? [], taiLieu: tl.data ?? [] };
}
export type HoSoDayDu = NonNullable<Awaited<ReturnType<typeof layHoSoDayDu>>>;

/** Tóm tắt hồ sơ của mọi nhân viên đang làm: % thông tin đã điền + giấy tờ bắt buộc còn thiếu (cho trang Hồ sơ nhân sự và Tổng hợp). */
export async function layTomTatHoSo() {
  const db = createAdminClient();
  const [nv, hs, tl] = await Promise.all([
    db.from("nhan_vien").select("id").neq("trang_thai", "Đã nghỉ"),
    db.from("ho_so_ca_nhan").select("*"),
    db.from("tai_lieu_nhan_vien").select("nhan_vien_id, loai, da_go, trang_thai").eq("da_go", false),
  ]);
  if (nv.error) throw nv.error;
  const hsTheo = new Map((hs.data ?? []).map((h) => [h.nhan_vien_id, h]));
  const tlTheo = new Map<string, { loai: string; da_go: boolean; trang_thai: string }[]>();
  for (const t of tl.data ?? []) tlTheo.set(t.nhan_vien_id, [...(tlTheo.get(t.nhan_vien_id) ?? []), t]);
  const ra = new Map<string, { tyLe: number; thieu: string[]; choXacNhan: number }>();
  for (const n of nv.data ?? []) {
    const ds = tlTheo.get(n.id) ?? [];
    ra.set(n.id, { tyLe: tyLeDienHoSo(hsTheo.get(n.id) ?? null), thieu: giayToConThieu(ds), choXacNhan: ds.filter((d) => d.trang_thai === "Chờ xác nhận").length });
  }
  return ra;
}
