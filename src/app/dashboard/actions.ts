"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type KetQuaTaiKhoan = { loi?: string; ok?: boolean };

const VAI_TRO_HOP_LE = ["nhan_vien", "ky_thuat", "admin"] as const;
type VaiTroGan = (typeof VAI_TRO_HOP_LE)[number];

/** Duyệt tài khoản tự đăng ký: gán vai trò (+ gắn hồ sơ nhân sự).
 * Quản trị gán được mọi vai trò; Kỹ thuật CHỈ gán được "nhân viên" — không để
 * một vai trò tự nâng quyền cho người khác lên ngang hoặc trên mình. */
export async function duyetTaiKhoan(formData: FormData): Promise<KetQuaTaiKhoan> {
  const nguoiGoi = await layNguoiDungHienTai();
  if (!nguoiGoi || (nguoiGoi.vaiTro !== "admin" && nguoiGoi.vaiTro !== "ky_thuat")) {
    return { loi: "Bạn không có quyền duyệt tài khoản." };
  }

  const userId = String(formData.get("user_id") || "");
  const vaiTro = String(formData.get("vai_tro") || "") as VaiTroGan;
  const hoSoId = String(formData.get("nhan_vien_id") || "");

  if (!userId || !VAI_TRO_HOP_LE.includes(vaiTro)) return { loi: "Thiếu tài khoản hoặc vai trò." };
  if (userId === nguoiGoi.id) return { loi: "Bạn không tự duyệt tài khoản của chính mình." };
  if (vaiTro !== "nhan_vien" && nguoiGoi.vaiTro !== "admin") {
    return { loi: "Chỉ Quản trị mới gán được vai trò Quản trị hoặc Kỹ thuật." };
  }
  if (vaiTro === "nhan_vien" && !hoSoId) {
    return { loi: "Chọn hồ sơ nhân sự để gắn cho nhân viên này." };
  }

  const supabase = createAdminClient();
  const { data: tk, error: loiLay } = await supabase.auth.admin.getUserById(userId);
  if (loiLay || !tk.user) return { loi: "Không tìm thấy tài khoản." };
  if (tk.user.app_metadata?.vai_tro) return { loi: "Tài khoản này đã được duyệt trước đó." };

  if (hoSoId) {
    const { data: hoSo } = await supabase
      .from("nhan_vien")
      .select("id, user_id")
      .eq("id", hoSoId)
      .maybeSingle();
    if (!hoSo) return { loi: "Không tìm thấy hồ sơ nhân sự." };
    if (hoSo.user_id) return { loi: "Hồ sơ này đã gắn với một tài khoản khác." };
    const { error: loiGan } = await supabase.from("nhan_vien").update({ user_id: userId }).eq("id", hoSoId);
    if (loiGan) return { loi: "Không gắn được hồ sơ nhân sự." };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { ...tk.user.app_metadata, vai_tro: vaiTro, cho_duyet: false },
  });
  if (error) return { loi: "Không gán được vai trò. Thử lại sau." };

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Từ chối: xoá tài khoản CHƯA duyệt (không đụng tài khoản đã có vai trò). */
export async function tuChoiTaiKhoan(formData: FormData): Promise<KetQuaTaiKhoan> {
  const nguoiGoi = await layNguoiDungHienTai();
  if (!nguoiGoi || (nguoiGoi.vaiTro !== "admin" && nguoiGoi.vaiTro !== "ky_thuat")) {
    return { loi: "Bạn không có quyền từ chối tài khoản." };
  }
  const userId = String(formData.get("user_id") || "");
  if (!userId || userId === nguoiGoi.id) return { loi: "Tài khoản không hợp lệ." };

  const supabase = createAdminClient();
  const { data: tk } = await supabase.auth.admin.getUserById(userId);
  if (!tk?.user) return { loi: "Không tìm thấy tài khoản." };
  if (tk.user.app_metadata?.vai_tro) return { loi: "Tài khoản đã được duyệt, không từ chối được ở đây." };

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { loi: "Không xoá được tài khoản. Thử lại sau." };

  revalidatePath("/dashboard");
  return { ok: true };
}
