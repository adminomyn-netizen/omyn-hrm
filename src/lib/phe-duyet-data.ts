import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbHr } from "@/lib/hr-db";
import { laGiamDoc } from "@/lib/chuc-danh";
import { guiChoNguoiDung } from "@/lib/push";
import type { HangLuong, NguCanhNguoiDuyet, NhanSuDuyet, O, TrangThaiO, KieuBuoc, LoaiNguoiDuyet, TrangThaiPhieu } from "@/lib/phe-duyet";

export const KHO_TEP = "phe-duyet-tep";

/** Danh mục lựa chọn (đơn vị, bộ phận, khoản chi…) theo từng loại, đúng thứ tự đã đặt. */
export async function docDanhMuc(): Promise<Record<string, string[]>> {
  const { data } = await dbHr().from("pd_danh_muc").select("loai, gia_tri").order("thu_tu").order("gia_tri");
  const ra: Record<string, string[]> = {};
  for (const r of (data ?? []) as { loai: string; gia_tri: string }[]) (ra[r.loai] ??= []).push(r.gia_tri);
  return ra;
}

export async function docNhomMa(): Promise<Record<string, { nhom: string; dung: boolean }>> {
  const { data } = await dbHr().from("pd_cau_hinh_phieu").select("ma_phieu, nhom_ma, dang_dung");
  return Object.fromEntries(((data ?? []) as { ma_phieu: string; nhom_ma: string; dang_dung: boolean }[]).map((r) => [r.ma_phieu, { nhom: r.nhom_ma, dung: r.dang_dung }]));
}

export async function docLuong(maPhieu: string): Promise<HangLuong[]> {
  const { data } = await dbHr().from("pd_luong_duyet").select("buoc, ten_buoc, kieu, loai_nguoi, chuc_danh, nhan_vien_id, dieu_kien_truong, dieu_kien_gia_tri").eq("ma_phieu", maPhieu).order("buoc");
  return ((data ?? []) as Record<string, string | number | null>[]).map((r) => ({
    buoc: r.buoc as number, tenBuoc: r.ten_buoc as string | null, kieu: r.kieu as KieuBuoc, loaiNguoi: r.loai_nguoi as LoaiNguoiDuyet,
    chucDanh: r.chuc_danh as string | null, nhanVienId: r.nhan_vien_id as string | null, dieuKienTruong: r.dieu_kien_truong as string | null, dieuKienGiaTri: r.dieu_kien_gia_tri as string | null,
  }));
}

type NvTho = { id: string; user_id: string | null; ho_ten: string; chuc_danh: string | null; quan_ly_id: string | null; trang_thai: string };
const sangNhanSu = (n: NvTho): NhanSuDuyet => ({ id: n.id, userId: n.user_id, hoTen: n.ho_ten, chucDanh: n.chuc_danh, quanLyId: n.quan_ly_id, daNghi: n.trang_thai === "Đã nghỉ" });

export async function nhanVienCuaTaiKhoan(userId: string): Promise<NhanSuDuyet | null> {
  const { data } = await dbHr().from("nhan_vien").select("id, user_id, ho_ten, chuc_danh, quan_ly_id, trang_thai").eq("user_id", userId).maybeSingle();
  return data ? sangNhanSu(data as NvTho) : null;
}

export async function nguCanhNguoiDuyet(nguoiNop: NhanSuDuyet | null): Promise<NguCanhNguoiDuyet> {
  const [{ data }, us] = await Promise.all([
    dbHr().from("nhan_vien").select("id, user_id, ho_ten, chuc_danh, quan_ly_id, trang_thai"),
    createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const tatCa = ((data ?? []) as NvTho[]).map(sangNhanSu);
  const kyThuat = (us.data?.users ?? [])
    .filter((x) => x.app_metadata?.vai_tro === "ky_thuat")
    .map((x) => ({ userId: x.id, ten: (x.app_metadata?.ho_ten as string) || x.email || "Kỹ thuật" }));
  return { nguoiNop, tatCa, giamDoc: tatCa.filter((n) => laGiamDoc(n.chucDanh) && n.userId), kyThuat };
}

/** Chuông trong ứng dụng + đẩy tới điện thoại. Không bao giờ ném lỗi: thông báo hỏng không được làm hỏng nghiệp vụ. */
export async function baoNguoiDung(userIds: (string | null)[], tin: { tieuDe: string; noiDung: string; url: string; tag?: string }) {
  const ids = [...new Set(userIds.filter((x): x is string => !!x))];
  if (ids.length === 0) return;
  try {
    await dbHr().from("thong_bao_app").insert(ids.map((user_id) => ({ user_id, tieu_de: tin.tieuDe, noi_dung: tin.noiDung, url: tin.url })));
  } catch (e) {
    console.error("[thong_bao_app] lỗi", e);
  }
  await guiChoNguoiDung(ids, { tieuDe: tin.tieuDe, noiDung: tin.noiDung, url: tin.url, tag: tin.tag }).catch(() => undefined);
}

export type PhieuTho = {
  id: string; so_phieu: string; ma_phieu: string; nhom_ma: string; nguoi_nop_id: string | null; du_lieu: Record<string, unknown>;
  trang_thai: TrangThaiPhieu; buoc_hien_tai: number; tao_luc: string; cap_nhat_luc: string; hoan_tat_luc: string | null;
  nguoi_nop: { ho_ten: string } | null;
};
export const COT_PHIEU = "id, so_phieu, ma_phieu, nhom_ma, nguoi_nop_id, du_lieu, trang_thai, buoc_hien_tai, tao_luc, cap_nhat_luc, hoan_tat_luc, nguoi_nop:nhan_vien!nguoi_nop_id(ho_ten)";

type OTho = { id: string; buoc: number; ten_buoc: string | null; kieu: KieuBuoc; nhan_vien_id: string | null; user_id: string | null; ten_nguoi: string | null; trang_thai: TrangThaiO; y_kien: string | null; xu_ly_luc: string | null };
const sangO = (r: OTho): O => ({ id: r.id, buoc: r.buoc, kieu: r.kieu, nhanVienId: r.nhan_vien_id, userId: r.user_id, ten: r.ten_nguoi ?? "", trangThai: r.trang_thai, tenBuoc: r.ten_buoc });

export async function docO(phieuId: string): Promise<(O & { yKien: string | null; xuLyLuc: string | null })[]> {
  const { data } = await dbHr().from("pd_buoc").select("id, buoc, ten_buoc, kieu, nhan_vien_id, user_id, ten_nguoi, trang_thai, y_kien, xu_ly_luc").eq("phieu_id", phieuId).order("buoc").order("ten_nguoi");
  return ((data ?? []) as OTho[]).map((r) => ({ ...sangO(r), yKien: r.y_kien, xuLyLuc: r.xu_ly_luc }));
}

/** Lưu trạng thái các ô sau khi chuyển bước (chỉ ghi ô đổi). */
export async function ghiO(truoc: readonly O[], sau: readonly O[], luc: string, y?: { oId: string; yKien: string | null }) {
  const db = dbHr();
  for (const s of sau) {
    const t = truoc.find((x) => x.id === s.id);
    if (t && t.trangThai === s.trangThai && y?.oId !== s.id) continue;
    const { error } = await db.from("pd_buoc").update({ trang_thai: s.trangThai, xu_ly_luc: s.trangThai === "Chờ" ? null : luc, ...(y?.oId === s.id ? { y_kien: y.yKien } : s.trangThai === "Chờ" ? { y_kien: null } : {}) }).eq("id", s.id);
    if (error) throw new Error(error.message);
  }
}

export const TEN_TRANG_THAI_O: Record<TrangThaiO, string> = { "Chờ": "Chờ duyệt", "Đã duyệt": "Đã duyệt", "Từ chối": "Từ chối", "Bỏ qua": "Bỏ qua", "Đã xem": "Đã nhận bản sao" };

export type TepPhieu = { id: string; truong: string; ten_tep: string; kich_thuoc: number; tao_luc: string };
export type LichSuPhieu = { id: string; buoc: number | null; ten_nguoi: string | null; hanh_dong: string; ghi_chu: string | null; luc: string };

/** Một phiếu đủ để xem: chỉ trả về nếu người dùng là người nộp, người duyệt/nhận bản sao, hoặc Quản trị/Kỹ thuật. */
export async function taiPhieuDeXem(id: string, nd: { id: string; vaiTro: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = dbHr();
  const { data } = await db.from("pd_phieu").select(COT_PHIEU).eq("id", id).maybeSingle();
  if (!data) return null;
  const phieu = data as unknown as PhieuTho;
  const [nv, o] = await Promise.all([nhanVienCuaTaiKhoan(nd.id), docO(id)]);
  const laNguoiNop = !!nv && phieu.nguoi_nop_id === nv.id;
  const laNguoiDuyet = o.some((x) => x.userId === nd.id || (!!nv && x.nhanVienId === nv.id));
  const laQuanLy = nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat";
  if (!laNguoiNop && !laNguoiDuyet && !laQuanLy) return null;
  const [tep, ls] = await Promise.all([
    db.from("pd_tep").select("id, truong, ten_tep, kich_thuoc, tao_luc").eq("phieu_id", id).order("tao_luc"),
    db.from("pd_lich_su").select("id, buoc, ten_nguoi, hanh_dong, ghi_chu, luc").eq("phieu_id", id).order("luc"),
  ]);
  return { phieu, o, nv, tep: (tep.data ?? []) as TepPhieu[], lichSu: (ls.data ?? []) as LichSuPhieu[] };
}

export async function taiDanhSachNhanSu(): Promise<{ id: string; ten: string }[]> {
  const { data } = await dbHr().from("nhan_vien").select("id, ho_ten, chuc_danh, ma_nhan_vien").neq("trang_thai", "Đã nghỉ").order("ho_ten");
  return ((data ?? []) as { id: string; ho_ten: string; chuc_danh: string | null; ma_nhan_vien: string | null }[]).map((n) => ({ id: n.id, ten: n.chuc_danh ? `${n.ho_ten} · ${n.chuc_danh}` : n.ho_ten }));
}

/** Phiếu của chính người dùng, để nối từ phiếu khác (hoàn ứng nối tới phiếu tạm ứng đã duyệt). */
export async function taiPhieuCoTheNoi(userId: string): Promise<{ id: string; ten: string; maPhieu: string }[]> {
  const nv = await nhanVienCuaTaiKhoan(userId);
  if (!nv) return [];
  const { data } = await dbHr().from("pd_phieu").select("id, so_phieu, ma_phieu, tao_luc").eq("nguoi_nop_id", nv.id).eq("trang_thai", "Đã duyệt").order("tao_luc", { ascending: false }).limit(100);
  return ((data ?? []) as { id: string; so_phieu: string; ma_phieu: string }[]).map((p) => ({ id: p.id, ten: p.so_phieu, maPhieu: p.ma_phieu }));
}

import { apDungGhiDe, giaiNguoiDuyet, type CheDoHien, type GhiDeO } from "@/lib/phe-duyet";
import { mauTheoMa } from "@/lib/phe-duyet-mau";

export async function docGhiDe(maPhieu: string): Promise<GhiDeO[]> {
  const { data } = await dbHr().from("pd_o_cau_hinh").select("truong, bat_buoc, che_do_hien, hien_truong, hien_gia_tri").eq("ma_phieu", maPhieu);
  return ((data ?? []) as { truong: string; bat_buoc: GhiDeO["batBuoc"]; che_do_hien: CheDoHien; hien_truong: string | null; hien_gia_tri: string[] | null }[]).map((r) => ({
    truong: r.truong, batBuoc: r.bat_buoc, cheDoHien: r.che_do_hien, hienTruong: r.hien_truong, hienGiaTri: r.hien_gia_tri,
  }));
}

/** Mẫu phiếu đang có hiệu lực: cấu hình trong mã nguồn + ghi đè của Kỹ thuật. */
export async function mauHieuLuc(maPhieu: string) {
  const mau = mauTheoMa(maPhieu);
  return mau ? apDungGhiDe(mau, await docGhiDe(maPhieu)) : null;
}

export const SU_KIEN_THONG_BAO = ["Nộp phiếu", "Duyệt xong", "Từ chối", "Cần bổ sung", "Huỷ"] as const;
export type SuKienThongBao = (typeof SU_KIEN_THONG_BAO)[number];

/** Báo thêm những người Kỹ thuật đã cài để nhận thông báo ở sự kiện này (không báo trùng người đã được báo). */
export async function baoTheoCauHinh(maPhieu: string, suKien: SuKienThongBao, nguoiNopId: string | null, tin: { tieuDe: string; noiDung: string; url: string }, daBao: (string | null)[] = []) {
  try {
    const { data } = await dbHr().from("pd_thong_bao_cau_hinh").select("loai_nguoi, chuc_danh, nhan_vien_id").eq("ma_phieu", maPhieu).eq("su_kien", suKien).eq("dang_bat", true);
    const ds = (data ?? []) as { loai_nguoi: LoaiNguoiDuyet; chuc_danh: string | null; nhan_vien_id: string | null }[];
    if (ds.length === 0) return;
    const nguoiNop = nguoiNopId ? (await dbHr().from("nhan_vien").select("id, user_id, ho_ten, chuc_danh, quan_ly_id, trang_thai").eq("id", nguoiNopId).maybeSingle()).data as NvTho | null : null;
    const ctx = await nguCanhNguoiDuyet(nguoiNop ? sangNhanSu(nguoiNop) : null);
    const user = new Set<string>();
    for (const r of ds) {
      const h: HangLuong = { buoc: 0, tenBuoc: null, kieu: "CC", loaiNguoi: r.loai_nguoi, chucDanh: r.chuc_danh, nhanVienId: r.nhan_vien_id, dieuKienTruong: null, dieuKienGiaTri: null };
      for (const n of giaiNguoiDuyet(h, ctx)) if (n.userId && !daBao.includes(n.userId)) user.add(n.userId);
    }
    await baoNguoiDung([...user], tin);
  } catch (e) {
    console.error("[pd] thông báo theo cấu hình lỗi", e);
  }
}
