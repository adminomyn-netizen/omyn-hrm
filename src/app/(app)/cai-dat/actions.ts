"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type KetQuaVaiTro = { loi?: string; ok?: boolean };
const VAI_TRO = ["admin", "ky_thuat", "nhan_vien"] as const;

/** Đổi vai trò của tài khoản ĐÃ duyệt. Quản trị và Kỹ thuật cùng làm được (chủ app chốt 22/10/2026).
 * Không tự đổi vai trò của chính mình; không để hệ thống hết tài khoản Kỹ thuật/Quản trị. */
export async function doiVaiTro(fd: FormData): Promise<KetQuaVaiTro> {
  const nguoiGoi = await layNguoiDungHienTai();
  if (!nguoiGoi || (nguoiGoi.vaiTro !== "admin" && nguoiGoi.vaiTro !== "ky_thuat")) return { loi: "Bạn không có quyền phân quyền tài khoản." };
  const userId = String(fd.get("user_id") || "");
  const vaiTro = String(fd.get("vai_tro") || "");
  if (!userId || !(VAI_TRO as readonly string[]).includes(vaiTro)) return { loi: "Tài khoản hoặc vai trò không hợp lệ." };
  if (userId === nguoiGoi.id) return { loi: "Không tự đổi vai trò của chính mình." };

  const db = createAdminClient();
  const { data: ds, error } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return { loi: "Chưa đọc được danh sách tài khoản. Thử lại sau." };
  const muc = ds.users.find((u) => u.id === userId);
  if (!muc) return { loi: "Không tìm thấy tài khoản." };
  if (!muc.app_metadata?.vai_tro) return { loi: "Tài khoản này đang chờ duyệt: duyệt ở trang Tổng quan." };
  if (muc.app_metadata.vai_tro === vaiTro) return { ok: true };
  const caoCap = (v: unknown) => v === "admin" || v === "ky_thuat";
  const soCaoCap = ds.users.filter((u) => caoCap(u.app_metadata?.vai_tro)).length;
  if (caoCap(muc.app_metadata.vai_tro) && !caoCap(vaiTro) && soCaoCap <= 1) return { loi: "Đây là tài khoản Kỹ thuật/Quản trị cuối cùng, không hạ vai trò được." };

  const { error: loi } = await db.auth.admin.updateUserById(userId, { app_metadata: { ...muc.app_metadata, vai_tro: vaiTro } });
  if (loi) return { loi: "Chưa đổi được vai trò. Thử lại sau." };
  revalidatePath("/cai-dat");
  return { ok: true };
}
