"use server";

import { randomBytes } from "node:crypto";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type TinChat = { id: string; vai: "nguoi" | "agent"; loai: "hoi" | "sua" | "duyet"; noiDung: string; trangThai: string; coTep: boolean; choDuyet: boolean; tenTep: string | null; luc: string };
export type TrangChat = { tin: TinChat[]; online: boolean; dangCho: boolean };
type KQ = { ok?: true; loi?: string };

const NHIP_SONG_GIAY = 90;
const GIOI_HAN_NGAY = 60;
const chuoi = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
/** Ở OMYN chỉ vai trò Kỹ thuật được nhờ Tula sửa ứng dụng (admin = Quản trị/Hành chính nhân sự vẫn hỏi đáp và xuất file). */
const laKyThuat = (v: string) => v === "ky_thuat";

/** Gửi một tin cho Tula. Vai trò và quyền "nhờ sửa" do máy chủ quyết, không tin trình duyệt; mỗi tin sinh một mã thông hành 15 phút để cổng công cụ biết đúng người đang hỏi. */
export async function guiTinChat(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet") return { loi: "Phiên đăng nhập đã hết." };
  const noiDung = chuoi(fd, "noi_dung");
  if (!noiDung) return { loi: "Gõ nội dung cần hỏi." };
  if (noiDung.length > 2000) return { loi: "Tin dài quá (tối đa 2000 ký tự). Chia nhỏ giúp em." };
  const loai = chuoi(fd, "loai") === "sua" ? "sua" : "hoi";
  if (loai === "sua" && !laKyThuat(nd.vaiTro)) return { loi: "Chỉ vai trò Kỹ thuật mới nhờ Omyn Bot sửa ứng dụng. Anh/chị vẫn hỏi đáp và xuất file bình thường." };
  const db = createAdminClient();
  const { data: cuoc, error: eC } = await db.from("chat_cuoc").upsert({ user_id: nd.id }, { onConflict: "user_id" }).select("id").single();
  if (eC || !cuoc) return { loi: "Chưa mở được cuộc chat, thử lại." };
  const [{ count: dangCho }, { count: homNay }] = await Promise.all([
    db.from("chat_tin").select("id", { count: "exact", head: true }).eq("cuoc_id", cuoc.id).eq("vai", "nguoi").in("trang_thai", ["cho", "dang_xu_ly"]),
    db.from("chat_tin").select("id", { count: "exact", head: true }).eq("cuoc_id", cuoc.id).eq("vai", "nguoi").gte("tao_luc", new Date(Date.now() - 86_400_000).toISOString()),
  ]);
  if ((dangCho ?? 0) > 0) return { loi: "Omyn Bot đang trả lời tin trước, đợi một chút nhé." };
  if ((homNay ?? 0) >= GIOI_HAN_NGAY) return { loi: `Hôm nay anh/chị đã gửi ${GIOI_HAN_NGAY} tin cho Omyn Bot, mai hỏi tiếp nhé.` };
  const { error } = await db.from("chat_tin").insert({
    cuoc_id: cuoc.id, user_id: nd.id, vai: "nguoi", loai, vai_tro_chup: nd.vaiTro, noi_dung: noiDung, trang_thai: "cho",
    thong_hanh: randomBytes(24).toString("hex"), han_thong_hanh: new Date(Date.now() + 15 * 60_000).toISOString(),
  });
  return error ? { loi: "Chưa gửi được, thử lại." } : { ok: true };
}

/** Đọc cuộc chat của chính mình (40 tin gần nhất) và xem Tula có đang online không (nhịp tim của máy chạy Tula trong 90 giây). */
export async function layChat(): Promise<TrangChat | { loi: string }> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet") return { loi: "Phiên đăng nhập đã hết." };
  const db = createAdminClient();
  const [{ data: cuoc }, { data: nhip }] = await Promise.all([db.from("chat_cuoc").select("id").eq("user_id", nd.id).maybeSingle(), db.from("chat_nhip").select("luc").eq("id", 1).maybeSingle()]);
  const online = !!nhip && Date.now() - new Date(nhip.luc).getTime() < NHIP_SONG_GIAY * 1000;
  if (!cuoc) return { tin: [], online, dangCho: false };
  const { data } = await db.from("chat_tin").select("id, vai, loai, noi_dung, trang_thai, tep_duong_dan, tep_ten, tao_luc, nhanh_sua, da_duyet_luc").eq("cuoc_id", cuoc.id).order("tao_luc", { ascending: false }).limit(40);
  const tin = (data ?? []).reverse().map((t) => ({ id: t.id, vai: t.vai as "nguoi" | "agent", loai: t.loai as "hoi" | "sua" | "duyet", noiDung: t.noi_dung, trangThai: t.trang_thai, coTep: !!t.tep_duong_dan, choDuyet: t.vai === "agent" && !!t.nhanh_sua && !t.da_duyet_luc, tenTep: t.tep_ten, luc: t.tao_luc }));
  return { tin, online, dangCho: tin.some((t) => t.vai === "nguoi" && ["cho", "dang_xu_ly"].includes(t.trangThai)) };
}

/** Kỹ thuật bấm "Duyệt đưa lên" dưới câu trả lời của Tula có nhánh sửa: sinh một tin loại 'duyet' để máy Tula tạo và gộp yêu cầu thay đổi (PR). Mỗi nhánh chỉ duyệt một lần. */
export async function duyetSuaChat(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !laKyThuat(nd.vaiTro)) return { loi: "Chỉ vai trò Kỹ thuật mới duyệt đưa lên." };
  const db = createAdminClient(), id = chuoi(fd, "id");
  const { data: t } = await db.from("chat_tin").select("id, cuoc_id, nhanh_sua, da_duyet_luc, user_id").eq("id", id).maybeSingle();
  if (!t?.nhanh_sua || t.da_duyet_luc || t.user_id !== nd.id) return { loi: "Bản sửa này đã được duyệt hoặc không còn." };
  const { data: da } = await db.from("chat_tin").update({ da_duyet_luc: new Date().toISOString() }).eq("id", id).is("da_duyet_luc", null).select("id");
  if (!da?.length) return { loi: "Bản sửa này đã được duyệt." };
  const { error } = await db.from("chat_tin").insert({ cuoc_id: t.cuoc_id, user_id: nd.id, vai: "nguoi", loai: "duyet", vai_tro_chup: nd.vaiTro, noi_dung: `Duyệt đưa lên: ${t.nhanh_sua}`, nhanh_sua: t.nhanh_sua, trang_thai: "cho", hoi_tin_id: id });
  return error ? { loi: "Chưa gửi được, thử lại." } : { ok: true };
}
