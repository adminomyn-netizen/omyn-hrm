import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { mienBaoCaoCv } from "@/lib/bao-cao-cv";
import { nguoiPhaiChamCong } from "@/lib/nhac-cong";

type Nv = { id: string; ho_ten: string; chuc_danh: string | null; quyen_giam_doc: boolean | null; user_id: string | null; khoi: { ten?: string } | null };

/** Tập user_id mang vai trò Kỹ thuật (vai trò lưu ở app_metadata của tài khoản). */
async function taiKhoanKyThuat(): Promise<Set<string>> {
  const { data } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  return new Set((data?.users ?? []).filter((u) => u.app_metadata?.vai_tro === "ky_thuat").map((u) => u.id));
}
async function docNhanVien(): Promise<Nv[]> {
  const { data } = await dbHr().from("nhan_vien").select("id, ho_ten, chuc_danh, quyen_giam_doc, user_id, khoi(ten)").neq("trang_thai", "Đã nghỉ").order("ho_ten").limit(2000);
  return (data ?? []) as unknown as Nv[];
}

/** Ai được xem tổng quan báo cáo và nhận tổng hợp: ĐÚNG 3 vị trí chị Lâm chốt (Giám đốc, Phó giám đốc, Kỹ thuật), theo hồ sơ nhân sự, KHÔNG theo vai trò Quản trị
 *  (Quản trị gồm cả Hành chính nhân sự — người phải nộp báo cáo). */
export async function duocXemTongQuanBaoCao(): Promise<boolean> {
  const nd = await layNguoiDungDaDuyet();
  if (nd.vaiTro === "ky_thuat") return true;
  const { data } = await dbHr().from("nhan_vien").select("chuc_danh, quyen_giam_doc").eq("user_id", nd.id).neq("trang_thai", "Đã nghỉ").maybeSingle();
  return !!data && mienBaoCaoCv("nhan_vien", data.chuc_danh, data.quyen_giam_doc);
}

/** Tài khoản nhận thông báo tổng hợp báo cáo công việc: Giám đốc, Phó giám đốc (theo hồ sơ) và Kỹ thuật. */
export async function nguoiNhanTongHopBaoCao(): Promise<string[]> {
  const [nvs, kt] = await Promise.all([docNhanVien(), taiKhoanKyThuat()]);
  const ra = new Set(kt);
  for (const n of nvs) if (n.user_id && mienBaoCaoCv("nhan_vien", n.chuc_danh, n.quyen_giam_doc)) ra.add(n.user_id);
  return [...ra];
}

export type NguoiNopBaoCao = { nhanVienId: string; userId: string; hoTen: string };
/** Những người PHẢI nộp báo cáo trong `ngay`: người phải chấm công (đã loại Chủ nhật, ngày lễ, nghỉ/công tác cả ngày đã duyệt, chưa tới ngày vào làm)
 *  trừ 3 vị trí được miễn (Giám đốc, Phó giám đốc, Kỹ thuật). */
export async function nguoiPhaiBaoCaoCv(ngay: string): Promise<NguoiNopBaoCao[]> {
  const ds = await nguoiPhaiChamCong(ngay);
  if (ds.length === 0) return [];
  const nvs = await docNhanVien();
  const theoId = new Map(nvs.map((n) => [n.id, n]));
  return ds.filter((n) => { const x = theoId.get(n.nhanVienId); return !!x && !mienBaoCaoCv("nhan_vien", x.chuc_danh, x.quyen_giam_doc); }).map((n) => ({ nhanVienId: n.nhanVienId, userId: n.userId, hoTen: n.hoTen }));
}

export type DongBaoCao = {
  nhanVienId: string; hoTen: string; chucDanh: string; khoi: string; phai: boolean;
  soViec: number; xong: number; quaHan: number;
  baoCao: { tomTat: string; link: string | null; nopLuc: string } | null;
  minhChung: { tieuDe: string; link: string; ghiChu: string | null }[];
};
export type TongQuanBaoCao = { ngay: string; dong: DongBaoCao[]; phaiNop: number; daNop: number };

/** Tổng quan báo cáo của MỌI người không được miễn trong `ngay`: số việc / đã xong / quá hạn, báo cáo cuối ngày, link minh chứng từng việc.
 *  Việc trong ngày = việc lặp hằng ngày + việc một lần có hạn đúng ngày đó; "xong" = lặp đủ số lượng trong ngày, hoặc một lần đã Hoàn thành. */
export async function layTongQuanBaoCao(ngay: string): Promise<TongQuanBaoCao> {
  const db = dbHr();
  const [nvs, kt, phaiDs] = await Promise.all([docNhanVien(), taiKhoanKyThuat(), nguoiPhaiBaoCaoCv(ngay)]);
  const nguoi = nvs.filter((n) => !mienBaoCaoCv(n.user_id && kt.has(n.user_id) ? "ky_thuat" : "nhan_vien", n.chuc_danh, n.quyen_giam_doc));
  const ids = nguoi.map((n) => n.id);
  if (ids.length === 0) return { ngay, dong: [], phaiNop: 0, daNop: 0 };
  const phai = new Set(phaiDs.map((n) => n.nhanVienId));
  const [{ data: cv }, { data: bc }] = await Promise.all([
    db.from("cong_viec").select("id, tieu_de, nguoi_lam_id, han, lap_lai, muc_tieu_so, trang_thai").in("nguoi_lam_id", ids).neq("trang_thai", "Huỷ").limit(5000),
    db.from("cong_viec_bao_cao").select("nhan_vien_id, tom_tat, link, nop_luc").eq("ngay", ngay).in("nhan_vien_id", ids),
  ]);
  const cvIds = (cv ?? []).map((c) => c.id as string);
  const { data: nh } = cvIds.length ? await db.from("cong_viec_ngay").select("cong_viec_id, da_lam, link_bao_cao, ghi_chu").eq("ngay", ngay).in("cong_viec_id", cvIds) : { data: [] };
  const ngayCv = new Map((nh ?? []).map((x) => [x.cong_viec_id as string, x]));
  const baoCaoTheo = new Map((bc ?? []).map((b) => [b.nhan_vien_id as string, b]));
  const dong: DongBaoCao[] = nguoi.map((n) => {
    let soViec = 0, xong = 0, quaHan = 0;
    const minhChung: DongBaoCao["minhChung"] = [];
    for (const c of (cv ?? []).filter((x) => x.nguoi_lam_id === n.id)) {
      const homNay = ngayCv.get(c.id as string);
      const lap = c.lap_lai === "Hằng ngày";
      if (lap || c.han === ngay) {
        soViec++;
        if (lap ? Number(homNay?.da_lam ?? 0) >= Number(c.muc_tieu_so) : c.trang_thai === "Hoàn thành") xong++;
      } else if (c.han && c.han < ngay && c.trang_thai !== "Hoàn thành") quaHan++;
      if (homNay?.link_bao_cao) minhChung.push({ tieuDe: c.tieu_de as string, link: homNay.link_bao_cao as string, ghiChu: (homNay.ghi_chu as string | null) ?? null });
    }
    const b = baoCaoTheo.get(n.id);
    return {
      nhanVienId: n.id, hoTen: n.ho_ten, chucDanh: n.chuc_danh ?? "", khoi: n.khoi?.ten ?? "", phai: phai.has(n.id), soViec, xong, quaHan,
      baoCao: b ? { tomTat: b.tom_tat as string, link: (b.link as string | null) ?? null, nopLuc: b.nop_luc as string } : null, minhChung,
    };
  });
  dong.sort((a, b) => Number(b.phai && !b.baoCao) - Number(a.phai && !a.baoCao) || a.hoTen.localeCompare(b.hoTen, "vi"));
  const phaiNop = dong.filter((d) => d.phai).length;
  return { ngay, dong, phaiNop, daNop: dong.filter((d) => d.phai && d.baoCao).length };
}

/** Số việc trong ngày và đã nộp báo cáo chưa của từng người — cho cron nhắc (một lượt truy vấn cho cả công ty). */
export async function tinhTrangBaoCaoCaNhan(ngay: string, nhanVienIds: string[]): Promise<Map<string, { soViec: number; daNop: boolean }>> {
  const ra = new Map<string, { soViec: number; daNop: boolean }>();
  if (nhanVienIds.length === 0) return ra;
  const db = dbHr();
  const [{ data: cv }, { data: bc }] = await Promise.all([
    db.from("cong_viec").select("nguoi_lam_id, han, lap_lai").in("nguoi_lam_id", nhanVienIds).neq("trang_thai", "Huỷ").neq("trang_thai", "Hoàn thành").limit(5000),
    db.from("cong_viec_bao_cao").select("nhan_vien_id").eq("ngay", ngay).in("nhan_vien_id", nhanVienIds),
  ]);
  for (const id of nhanVienIds) ra.set(id, { soViec: 0, daNop: false });
  for (const c of cv ?? []) if (c.lap_lai === "Hằng ngày" || c.han === ngay) ra.get(c.nguoi_lam_id as string)!.soViec++;
  for (const b of bc ?? []) ra.get(b.nhan_vien_id as string)!.daNop = true;
  return ra;
}
