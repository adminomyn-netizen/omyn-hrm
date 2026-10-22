"use server";

import { revalidatePath } from "next/cache";
import { coVaiTro } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type KetQuaKhoi = { loi?: string; ok?: boolean };
const KHONG_QUYEN: KetQuaKhoi = { loi: "Bạn không có quyền thực hiện thao tác này." };
const chuoi = (fd: FormData, k: string, toiDa: number) => String(fd.get(k) ?? "").trim().slice(0, toiDa);
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const lamMoi = () => {
  for (const p of ["/khoi", "/nhan-su", "/tuyen-dung", "/dashboard"]) revalidatePath(p);
};

/** Thêm hoặc sửa một khối (có `id` = sửa). Tên khối không trùng nhau. */
export async function luuKhoi(fd: FormData): Promise<KetQuaKhoi> {
  if (!(await coVaiTro(["admin", "ky_thuat"]))) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  const ten = chuoi(fd, "ten", 60);
  const moTa = chuoi(fd, "mo_ta", 200);
  if (ten.length < 2) return { loi: "Nhập tên khối (ít nhất 2 ký tự)." };

  const db = createAdminClient();
  const { data: trung } = await db.from("khoi").select("id").ilike("ten", ten.replace(/[\\%_]/g, (c) => "\\" + c)).maybeSingle();
  if (trung && trung.id !== id) return { loi: "Đã có khối trùng tên này." };

  const { error } = id ? await db.from("khoi").update({ ten, mo_ta: moTa || null }).eq("id", id) : await db.from("khoi").insert({ ten, mo_ta: moTa || null });
  if (error) return { loi: "Chưa lưu được khối. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

/** Xoá khối CHỈ khi không còn nhân viên hoặc tin tuyển dụng nào thuộc khối. */
export async function xoaKhoi(fd: FormData): Promise<KetQuaKhoi> {
  if (!(await coVaiTro(["admin", "ky_thuat"]))) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  if (!uuid(id)) return { loi: "Thiếu mã khối." };
  const db = createAdminClient();
  const [nv, tin] = await Promise.all([
    db.from("nhan_vien").select("id", { count: "exact", head: true }).eq("khoi_id", id),
    db.from("tin_tuyen_dung").select("id", { count: "exact", head: true }).eq("khoi_id", id),
  ]);
  if ((nv.count ?? 0) > 0) return { loi: `Khối còn ${nv.count} nhân viên (kể cả người đã nghỉ). Chuyển họ sang khối khác trước khi xoá.` };
  if ((tin.count ?? 0) > 0) return { loi: `Khối còn ${tin.count} tin tuyển dụng. Xoá hoặc chuyển các tin đó trước.` };
  const { error } = await db.from("khoi").delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được khối. Thử lại sau." };
  lamMoi();
  return { ok: true };
}
