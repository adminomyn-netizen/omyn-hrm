"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ngayHomNayHCM } from "@/lib/data";

export type KetQuaTaiKhoan = { loi?: string; ok?: boolean };

const VAI_TRO_HOP_LE = ["nhan_vien", "ky_thuat", "admin"] as const;
type VaiTroGan = (typeof VAI_TRO_HOP_LE)[number];

/** Duyệt tài khoản tự đăng ký: gán vai trò (+ gắn hồ sơ nhân sự).
 * Quản trị và Kỹ thuật cùng gán được mọi vai trò (chủ app chốt 22/10/2026: Kỹ thuật phân quyền tài khoản);
 * không ai tự duyệt tài khoản của chính mình. */
export async function duyetTaiKhoan(formData: FormData): Promise<KetQuaTaiKhoan> {
  const nguoiGoi = await layNguoiDungHienTai();
  if (!nguoiGoi || (nguoiGoi.vaiTro !== "admin" && nguoiGoi.vaiTro !== "ky_thuat")) {
    return { loi: "Bạn không có quyền duyệt tài khoản." };
  }

  const userId = String(formData.get("user_id") || "");
  const vaiTro = String(formData.get("vai_tro") || "") as VaiTroGan;
  const yeuTaoMoi = String(formData.get("nhan_vien_id") || "") === "__moi__";
  let hoSoId = yeuTaoMoi ? "" : String(formData.get("nhan_vien_id") || "");

  if (!userId || !VAI_TRO_HOP_LE.includes(vaiTro)) return { loi: "Thiếu tài khoản hoặc vai trò." };
  if (userId === nguoiGoi.id) return { loi: "Bạn không tự duyệt tài khoản của chính mình." };
  if (vaiTro === "nhan_vien" && !hoSoId && !yeuTaoMoi) {
    return { loi: "Chọn hồ sơ nhân sự để gắn cho nhân viên này." };
  }

  const supabase = createAdminClient();
  const { data: tk, error: loiLay } = await supabase.auth.admin.getUserById(userId);
  if (loiLay || !tk.user) return { loi: "Không tìm thấy tài khoản." };
  if (tk.user.app_metadata?.vai_tro) return { loi: "Tài khoản này đã được duyệt trước đó." };

  // Tạo hồ sơ mới theo phòng ban người đăng ký đã chọn (đọc từ tài khoản, không tin dữ liệu từ form).
  let hoSoMoiId = "";
  if (yeuTaoMoi) {
    const khoiId = String(tk.user.app_metadata?.yeu_cau_khoi_id ?? "") || null;
    const { data: moi, error: loiTao } = await supabase
      .from("nhan_vien")
      .insert({ ho_ten: String(tk.user.app_metadata?.ho_ten || tk.user.email || ""), email: tk.user.email ?? null, chuc_danh: "Nhân viên", khoi_id: khoiId, ngay_vao_lam: ngayHomNayHCM(), trang_thai: "Đang làm", user_id: userId })
      .select("id")
      .single();
    if (loiTao || !moi) return { loi: "Không tạo được hồ sơ nhân sự. Thử lại sau." };
    hoSoMoiId = moi.id;
    hoSoId = "";
  }

  // Gắn hồ sơ NGUYÊN TỬ: chỉ gắn khi hồ sơ còn trống (user_id is null) — hai người duyệt
  // cùng lúc thì một người thắng; nếu gán vai trò thất bại thì hoàn tác phần gắn.
  if (hoSoId) {
    const { data: hoSo } = await supabase
      .from("nhan_vien")
      .select("id, chuc_danh")
      .eq("id", hoSoId)
      .maybeSingle();
    if (!hoSo) return { loi: "Không tìm thấy hồ sơ nhân sự." };
    const { data: daGan, error: loiGan } = await supabase
      .from("nhan_vien")
      .update({ user_id: userId })
      .eq("id", hoSoId)
      .is("user_id", null)
      .select("id");
    if (loiGan) return { loi: "Không gắn được hồ sơ nhân sự." };
    if (!daGan || daGan.length === 0) return { loi: "Hồ sơ này vừa được gắn với tài khoản khác." };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { ...tk.user.app_metadata, vai_tro: vaiTro, cho_duyet: false },
  });
  if (error) {
    if (hoSoMoiId) await supabase.from("nhan_vien").delete().eq("id", hoSoMoiId).eq("user_id", userId);
    if (hoSoId) await supabase.from("nhan_vien").update({ user_id: null }).eq("id", hoSoId).eq("user_id", userId);
    return { loi: "Không gán được vai trò. Thử lại sau." };
  }

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
