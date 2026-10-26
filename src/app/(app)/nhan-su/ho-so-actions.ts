"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { KHO_HO_SO, quyenHoSo } from "@/lib/data-ho-so";
import { LOAI_TAI_LIEU, TRANG_THAI_TAI_LIEU, duoiTep, kiemTraHoSo, kiemTraTep } from "@/lib/ho-so";

export type KetQua = { loi?: string; ok?: boolean };
const KHONG_QUYEN: KetQua = { loi: "Bạn không có quyền thực hiện thao tác này." };
const chuoi = (fd: FormData, k: string, toiDa = 300) => String(fd.get(k) ?? "").trim().slice(0, toiDa);
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const lamMoi = (id: string) => { revalidatePath(`/nhan-su/${id}`); revalidatePath("/ho-so-cua-toi"); revalidatePath("/nhan-su"); revalidatePath("/tong-hop"); };

async function nguoiVaQuyen(nhanVienId: string) {
  const nd = await layNguoiDungHienTai();
  if (!nd || !uuid(nhanVienId)) return null;
  const q = await quyenHoSo(nd, nhanVienId);
  return q.xem ? { nd, ...q } : null;
}

const TRUONG_HO_SO = ["gioi_tinh", "ngay_sinh", "dan_toc", "ton_giao", "tinh_trang_hon_nhan", "dien_thoai", "cccd", "ngay_cap_cccd", "noi_cap_cccd", "dia_chi_thuong_tru", "dia_chi_hien_tai",
  "nguoi_than_ten", "nguoi_than_quan_he", "nguoi_than_dien_thoai", "trinh_do", "truong", "nganh", "ma_so_thue", "so_bhxh", "ngan_hang", "so_tai_khoan"] as const;

export async function luuHoSoCaNhan(fd: FormData): Promise<KetQua> {
  const nhanVienId = chuoi(fd, "nhan_vien_id", 40);
  const ctx = await nguoiVaQuyen(nhanVienId);
  if (!ctx) return KHONG_QUYEN;
  const v: Record<string, string> = {};
  for (const k of TRUONG_HO_SO) v[k] = chuoi(fd, k, k.startsWith("dia_chi") ? 300 : 120);
  if (v.gioi_tinh && !["Nam", "Nữ"].includes(v.gioi_tinh)) return { loi: "Giới tính chưa đúng." };
  if (v.tinh_trang_hon_nhan && !["Độc thân", "Đã lập gia đình", "Đã lập gia đình, có con", "Khác"].includes(v.tinh_trang_hon_nhan)) return { loi: "Tình trạng hôn nhân chưa đúng." };
  const loi = kiemTraHoSo(v);
  if (loi) return { loi };
  const du = Object.fromEntries(TRUONG_HO_SO.map((k) => [k, v[k] || null]));
  const { error } = await createAdminClient().from("ho_so_ca_nhan").upsert({ nhan_vien_id: nhanVienId, ...du, cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: ctx.nd.id }, { onConflict: "nhan_vien_id" });
  if (error) return { loi: "Chưa lưu được hồ sơ. Thử lại sau." };
  lamMoi(nhanVienId);
  return { ok: true };
}

export async function themThanNhan(fd: FormData): Promise<KetQua> {
  const nhanVienId = chuoi(fd, "nhan_vien_id", 40);
  if (!(await nguoiVaQuyen(nhanVienId))) return KHONG_QUYEN;
  const hoTen = chuoi(fd, "ho_ten", 120);
  const quanHe = chuoi(fd, "quan_he", 30);
  const ns = chuoi(fd, "ngay_sinh", 10);
  const cccd = chuoi(fd, "cccd", 20);
  if (hoTen.length < 2) return { loi: "Nhập họ tên người thân." };
  if (!["Vợ", "Chồng", "Con", "Cha", "Mẹ", "Anh chị em", "Người giám hộ"].includes(quanHe)) return { loi: "Chọn quan hệ." };
  const loi = kiemTraHoSo({ ngay_sinh: ns, cccd });
  if (loi) return { loi };
  const { error } = await createAdminClient().from("than_nhan").insert({ nhan_vien_id: nhanVienId, ho_ten: hoTen, quan_he: quanHe, ngay_sinh: ns || null, cccd: cccd || null, phu_thuoc: fd.get("phu_thuoc") === "1" });
  if (error) return { loi: "Chưa lưu được. Thử lại sau." };
  lamMoi(nhanVienId);
  return { ok: true };
}

export async function xoaThanNhan(fd: FormData): Promise<KetQua> {
  const nhanVienId = chuoi(fd, "nhan_vien_id", 40);
  const id = chuoi(fd, "id", 40);
  if (!(await nguoiVaQuyen(nhanVienId)) || !uuid(id)) return KHONG_QUYEN;
  const { error } = await createAdminClient().from("than_nhan").delete().eq("id", id).eq("nhan_vien_id", nhanVienId);
  if (error) return { loi: "Chưa xoá được. Thử lại sau." };
  lamMoi(nhanVienId);
  return { ok: true };
}

/** Bước 1 của tải giấy tờ: kiểm loại/dung lượng rồi cấp link tải lên trực tiếp vào kho riêng tư (tệp không đi qua máy chủ app). */
export async function xinLinkTaiLen(fd: FormData): Promise<KetQua & { duongDan?: string; token?: string }> {
  const nhanVienId = chuoi(fd, "nhan_vien_id", 40);
  if (!(await nguoiVaQuyen(nhanVienId))) return KHONG_QUYEN;
  const loai = chuoi(fd, "loai", 40);
  const mime = chuoi(fd, "mime", 60);
  const kichThuoc = Number(chuoi(fd, "kich_thuoc", 12));
  if (!(LOAI_TAI_LIEU as readonly string[]).includes(loai)) return { loi: "Chọn loại giấy tờ." };
  const sai = kiemTraTep(mime, kichThuoc);
  if (sai) return { loi: sai };
  const duongDan = `${nhanVienId}/${randomUUID()}.${duoiTep(mime)}`;
  const { data, error } = await createAdminClient().storage.from(KHO_HO_SO).createSignedUploadUrl(duongDan);
  if (error || !data) return { loi: "Chưa mở được kho tệp. Thử lại sau." };
  return { ok: true, duongDan, token: data.token };
}

/** Bước 2: sau khi tệp đã lên kho, kiểm tệp có thật (đúng loại, đúng dung lượng kho ghi nhận) rồi mới ghi vào hồ sơ. */
export async function xacNhanTaiLen(fd: FormData): Promise<KetQua> {
  const nhanVienId = chuoi(fd, "nhan_vien_id", 40);
  const ctx = await nguoiVaQuyen(nhanVienId);
  if (!ctx) return KHONG_QUYEN;
  const duongDan = chuoi(fd, "duong_dan", 200);
  const loai = chuoi(fd, "loai", 40);
  const tenTep = chuoi(fd, "ten_tep", 200) || "tai-lieu";
  if (!duongDan.startsWith(`${nhanVienId}/`) || duongDan.includes("..") || !(LOAI_TAI_LIEU as readonly string[]).includes(loai)) return { loi: "Dữ liệu không hợp lệ." };
  const db = createAdminClient();
  const ten = duongDan.slice(nhanVienId.length + 1);
  const { data: ds } = await db.storage.from(KHO_HO_SO).list(nhanVienId, { search: ten, limit: 5 });
  const tep = (ds ?? []).find((x) => x.name === ten);
  const mime = (tep?.metadata as { mimetype?: string; size?: number } | undefined)?.mimetype ?? "";
  const size = Number((tep?.metadata as { size?: number } | undefined)?.size ?? 0);
  if (!tep) return { loi: "Chưa thấy tệp trong kho. Thử tải lại." };
  const sai = kiemTraTep(mime, size);
  if (sai) { await db.storage.from(KHO_HO_SO).remove([duongDan]); return { loi: sai }; }
  const { error } = await db.from("tai_lieu_nhan_vien").insert({ nhan_vien_id: nhanVienId, loai, ten_tep: tenTep, duong_dan: duongDan, mime, kich_thuoc: size, tai_boi: ctx.nd.id });
  if (error) { await db.storage.from(KHO_HO_SO).remove([duongDan]); return { loi: "Chưa ghi được giấy tờ vào hồ sơ. Thử lại sau." }; }
  lamMoi(nhanVienId);
  return { ok: true };
}

/** HCNS xác nhận giấy tờ hợp lệ hoặc yêu cầu bổ sung (kèm ghi chú). */
export async function doiTrangThaiTaiLieu(fd: FormData): Promise<KetQua> {
  const id = chuoi(fd, "id", 40);
  const den = chuoi(fd, "den", 20);
  const ghiChu = chuoi(fd, "ghi_chu", 300);
  if (!uuid(id) || !(TRANG_THAI_TAI_LIEU as readonly string[]).includes(den)) return { loi: "Dữ liệu không hợp lệ." };
  const db = createAdminClient();
  const { data: tl } = await db.from("tai_lieu_nhan_vien").select("nhan_vien_id").eq("id", id).maybeSingle();
  const ctx = tl && (await nguoiVaQuyen(tl.nhan_vien_id));
  if (!tl || !ctx || !ctx.quanTri) return KHONG_QUYEN;
  if (den === "Cần bổ sung" && ghiChu.length < 3) return { loi: "Ghi rõ cần bổ sung gì." };
  const { error } = await db.from("tai_lieu_nhan_vien").update({ trang_thai: den, ghi_chu: ghiChu || null }).eq("id", id);
  if (error) return { loi: "Chưa lưu được. Thử lại sau." };
  lamMoi(tl.nhan_vien_id);
  return { ok: true };
}

/** Gỡ giấy tờ khỏi hồ sơ (kèm lý do). Không xoá cứng: tệp vẫn nằm trong kho để truy vết. Nhân viên chỉ gỡ được tệp mình vừa tải khi chưa được xác nhận. */
export async function goTaiLieu(fd: FormData): Promise<KetQua> {
  const id = chuoi(fd, "id", 40);
  const lyDo = chuoi(fd, "ly_do", 300);
  if (!uuid(id)) return { loi: "Thiếu mã giấy tờ." };
  const db = createAdminClient();
  const { data: tl } = await db.from("tai_lieu_nhan_vien").select("nhan_vien_id, trang_thai").eq("id", id).maybeSingle();
  const ctx = tl && (await nguoiVaQuyen(tl.nhan_vien_id));
  if (!tl || !ctx) return KHONG_QUYEN;
  if (!ctx.quanTri && tl.trang_thai === "Đã xác nhận") return { loi: "Giấy tờ đã được HCNS xác nhận, nhờ HCNS gỡ nếu cần." };
  if (lyDo.length < 3) return { loi: "Ghi lý do gỡ (từ 3 ký tự)." };
  const { error } = await db.from("tai_lieu_nhan_vien").update({ da_go: true, go_luc: new Date().toISOString(), go_boi: ctx.nd.id, ly_do_go: lyDo }).eq("id", id);
  if (error) return { loi: "Chưa gỡ được. Thử lại sau." };
  lamMoi(tl.nhan_vien_id);
  return { ok: true };
}
