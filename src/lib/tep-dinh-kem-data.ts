import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbHr } from "@/lib/hr-db";
import { timMucHr } from "@/lib/hr-module";
import { quyenTrenSo } from "@/lib/quyen-nghiep-vu";
import { duongDanHopLe, duongDanTrongKho, kiemTep, KHO_TEP, laLoaiGiay, laManTep, laUuid, type ManTep } from "@/lib/tep-dinh-kem";

export type Nguoi = { ten: string; nguon: "Trong app" | "Lệnh tải từ máy khác" };
export type TepInfo = { id: string; loai_giay: string; ten_tep: string; kich_thuoc: number; kieu: string | null; nguoi_tai: string; nguon: string; tao_luc: string };
type Loi = { loi: string };

/** Quyền với tệp đính kèm: Quản trị/Kỹ thuật đủ quyền; người khác theo quyền khối ở mảng Pháp lý & Hồ sơ (xem hoặc nhập). Trả null nếu không được vào. */
export async function quyenTep(nd: { id: string; vaiTro: string }): Promise<"nhap" | "xem" | null> {
  if (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") return "nhap";
  return (await quyenTrenSo(nd, "Pháp lý & Hồ sơ")).muc;
}

const kho = () => createAdminClient().storage.from(KHO_TEP);

/** Dòng này có thật trong sổ không (tránh gắn tệp vào dòng không tồn tại). */
async function dongTonTai(man: ManTep, dongId: string) {
  const muc = timMucHr(man);
  if (!muc) return null;
  const { data } = await dbHr().from(muc.bang).select("id").eq("id", dongId).maybeSingle();
  return data ? muc : null;
}

/** Lịch sử của dòng: ai gắn/gỡ tệp nào. Tải từ máy khác không có tài khoản nên user_id để trống, tên người ghi là "Flora (tải từ máy khác)". */
async function ghiLichSu(muc: { ten: string }, dongId: string, moTa: string, nguoiId: string | null, tenNguoi: string) {
  const { error } = await dbHr().from("nhan_su_lich_su").insert({ nhan_vien_id: null, doi_tuong: muc.ten, doi_tuong_id: dongId, hanh_dong: "Sửa", mo_ta: `Tệp đính kèm: ${moTa}`.slice(0, 500), truoc: null, sau: null, user_id: nguoiId, ten_nguoi: tenNguoi });
  if (error) console.error("[tep lich su] lỗi", error.message);
}

export async function layTepCuaDong(man: string, dongId: string): Promise<TepInfo[]> {
  if (!laManTep(man) || !laUuid(dongId)) return [];
  const { data } = await dbHr().from("tep_dinh_kem").select("id, loai_giay, ten_tep, kich_thuoc, kieu, nguoi_tai, nguon, tao_luc").eq("man", man).eq("dong_id", dongId).order("tao_luc", { ascending: false });
  return (data ?? []) as TepInfo[];
}

/** Bước 1 của tải lên: kiểm tra rồi xin link ký để tải THẲNG vào kho (file không đi qua máy chủ web nên không vướng giới hạn 4,5 MB). */
export async function taoLinkTaiLen(v: { man: string; dongId: string; loai: string; tenTep: string; kichThuoc: number }): Promise<Loi | { duongDan: string; token: string; linkTai: string }> {
  if (!laManTep(v.man)) return { loi: "Màn không hợp lệ." };
  if (!laUuid(v.dongId)) return { loi: "Mã dòng không hợp lệ." };
  if (!laLoaiGiay(v.loai)) return { loi: "Loại giấy không hợp lệ." };
  const l = kiemTep(v.tenTep, v.kichThuoc);
  if (l) return { loi: l };
  if (!(await dongTonTai(v.man, v.dongId))) return { loi: "Không tìm thấy dòng cần gắn tệp." };
  const duongDan = duongDanTrongKho(v.man, v.dongId, randomUUID(), v.tenTep);
  const { data, error } = await kho().createSignedUploadUrl(duongDan);
  if (error || !data) return { loi: "Chưa tạo được link tải lên. Thử lại sau." };
  return { duongDan, token: data.token, linkTai: data.signedUrl };
}

/** Bước 2: tệp đã nằm trong kho thì ghi vào bảng (dung lượng lấy từ kho, không tin số khách khai). */
export async function xacNhanTep(nguoi: Nguoi, nguoiId: string | null, v: { man: string; dongId: string; loai: string; tenTep: string; kieu: string | null; duongDan: string }): Promise<Loi | { ok: true; id: string }> {
  if (!laManTep(v.man) || !laUuid(v.dongId) || !laLoaiGiay(v.loai)) return { loi: "Thông tin không hợp lệ." };
  if (!duongDanHopLe(v.man, v.dongId, v.duongDan)) return { loi: "Đường dẫn tệp không hợp lệ." };
  const muc = await dongTonTai(v.man, v.dongId);
  if (!muc) return { loi: "Không tìm thấy dòng cần gắn tệp." };
  const thu = v.duongDan.slice(0, v.duongDan.lastIndexOf("/"));
  const ten = v.duongDan.slice(v.duongDan.lastIndexOf("/") + 1);
  const { data: ds } = await kho().list(thu, { search: ten.slice(0, 36) });
  const f = (ds ?? []).find((x) => x.name === ten);
  const size = Number((f?.metadata as { size?: number } | null)?.size ?? 0);
  if (!f || size <= 0) return { loi: "Chưa thấy tệp trong kho. Tải lên chưa xong?" };
  const l = kiemTep(v.tenTep, size);
  if (l) { await kho().remove([v.duongDan]); return { loi: l }; }
  const { data, error } = await dbHr().from("tep_dinh_kem").insert({ man: v.man, dong_id: v.dongId, loai_giay: v.loai, ten_tep: v.tenTep.slice(0, 200), duong_dan: v.duongDan, kich_thuoc: size, kieu: v.kieu, nguoi_tai: nguoi.ten, nguon: nguoi.nguon }).select("id").single();
  if (error || !data) return { loi: "Chưa lưu được thông tin tệp." };
  await ghiLichSu(muc, v.dongId, `thêm ${v.loai} - ${v.tenTep}`, nguoiId, nguoi.ten);
  return { ok: true, id: data.id as string };
}

/** Link xem hoặc tải xuống có chữ ký, hết hạn sau 2 phút. */
export async function layLinkTep(tepId: string, tai: boolean): Promise<Loi | { url: string }> {
  if (!laUuid(tepId)) return { loi: "Tệp không hợp lệ." };
  const { data: t } = await dbHr().from("tep_dinh_kem").select("duong_dan, ten_tep").eq("id", tepId).maybeSingle();
  if (!t) return { loi: "Không tìm thấy tệp." };
  const { data, error } = await kho().createSignedUrl(t.duong_dan as string, 120, tai ? { download: t.ten_tep as string } : undefined);
  if (error || !data) return { loi: "Chưa tạo được link. Thử lại sau." };
  return { url: data.signedUrl };
}

export async function xoaTep(tepId: string, nguoiId: string, tenNguoi: string): Promise<Loi | { ok: true }> {
  if (!laUuid(tepId)) return { loi: "Tệp không hợp lệ." };
  const { data: t } = await dbHr().from("tep_dinh_kem").select("id, man, dong_id, duong_dan, ten_tep").eq("id", tepId).maybeSingle();
  if (!t) return { loi: "Không tìm thấy tệp." };
  await kho().remove([t.duong_dan as string]);
  await dbHr().from("tep_dinh_kem").delete().eq("id", tepId);
  const muc = timMucHr(t.man as string);
  if (muc) await ghiLichSu(muc, t.dong_id as string, `gỡ ${t.ten_tep}`, nguoiId, tenNguoi);
  return { ok: true };
}

const bam = (k: string) => createHash("sha256").update(k).digest("hex");
/** Khoá tải file từ máy khác có hợp lệ (đã đăng ký, chưa thu hồi) không. Chỉ so dấu vân tay, không lưu khoá. */
export async function khoaHopLe(khoa: string | null | undefined): Promise<boolean> {
  if (!khoa || khoa.length < 24) return false;
  const { data } = await dbHr().from("khoa_tai_len_tep").select("id").eq("bam", bam(khoa)).is("thu_hoi_luc", null).maybeSingle();
  return !!data;
}

/** Tìm dòng để gắn tệp: nhận mã dòng, hoặc đoạn tên (phải ra đúng 1 dòng, nhiều dòng thì trả danh sách để chọn). */
export async function timDong(man: string, q: string): Promise<Loi | { ds: { id: string; ten: string }[] }> {
  if (!laManTep(man)) return { loi: "Màn không hợp lệ." };
  const muc = timMucHr(man)!;
  const cot = muc.cot.find((c) => c.k === muc.tieuDe)!;
  const { data } = await dbHr().from(muc.bang).select("*").limit(1000);
  let ten = (r: Record<string, unknown>) => String(r[muc.tieuDe] ?? "");
  if (cot.kieu === "tc" && cot.bangTc) {
    const { data: ds } = await dbHr().from(cot.bangTc).select("id, ten").limit(2000);
    const m = new Map((ds ?? []).map((x) => [x.id as string, x.ten as string]));
    ten = (r) => m.get(String(r[muc.tieuDe])) ?? "";
  }
  let ds = ((data ?? []) as Record<string, unknown>[]).map((r) => ({ id: String(r.id), ten: ten(r) }));
  const k = q.trim().toLowerCase();
  if (k) ds = ds.filter((x) => x.id === k || x.ten.toLowerCase().includes(k));
  return { ds };
}
