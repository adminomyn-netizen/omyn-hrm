"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { chuanHoaGiaTri, timMucHr } from "@/lib/hr-module";

export type KetQuaHr = { loi?: string; ok?: boolean };
const KHONG_QUYEN: KetQuaHr = { loi: "Bạn không có quyền thực hiện thao tác này." };

/** Chỉ Quản trị/Kỹ thuật (phòng HCNS) được sửa dữ liệu vận hành HCNS. Cột lấy từ cấu hình, không nhận cột lạ từ trình duyệt. */
async function nguoiQuanTri() {
  const nd = await layNguoiDungHienTai();
  return nd && (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") ? nd : null;
}

export async function luuBanGhiHr(fd: FormData): Promise<KetQuaHr> {
  if (!(await nguoiQuanTri())) return KHONG_QUYEN;
  const muc = timMucHr(String(fd.get("ma") ?? ""));
  if (!muc) return { loi: "Không tìm thấy mục này." };
  const id = String(fd.get("id") ?? "");
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return { loi: "Bản ghi không hợp lệ." };
  const dong: Record<string, string | number | boolean | null> = {};
  for (const c of muc.cot) {
    const r = chuanHoaGiaTri(c, String(fd.get(c.k) ?? ""));
    if ("loi" in r) return { loi: r.loi };
    dong[c.k] = r.v;
  }
  const db = dbHr();
  const { error } = id ? await db.from(muc.bang).update(dong).eq("id", id) : await db.from(muc.bang).insert(dong);
  if (error) return { loi: "Chưa lưu được. Kiểm tra lại các ô rồi thử lại." };
  revalidatePath(`/hr/${muc.ma}`); revalidatePath("/hr");
  return { ok: true };
}

export async function xoaBanGhiHr(ma: string, id: string): Promise<KetQuaHr> {
  if (!(await nguoiQuanTri())) return KHONG_QUYEN;
  const muc = timMucHr(ma);
  if (!muc || !/^[0-9a-f-]{36}$/i.test(id)) return { loi: "Bản ghi không hợp lệ." };
  const { error } = await dbHr().from(muc.bang).delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được." };
  revalidatePath(`/hr/${muc.ma}`); revalidatePath("/hr");
  return { ok: true };
}
