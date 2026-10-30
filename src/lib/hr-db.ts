import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { laGiamDoc } from "@/lib/chuc-danh";

/** Máy khách Supabase không gắn kiểu cho các bảng HR vận hành (0017+), vì danh sách bảng đọc từ cấu hình trong hr-module.ts. Kiểm tra cột/kiểu làm ở chuanHoaGiaTri. */
export const dbHr = () => createAdminClient() as unknown as SupabaseClient;

/** Tài khoản này có phải giám đốc (theo chức danh trong hồ sơ nhân sự) không. */
export async function laGiamDocTaiKhoan(userId: string): Promise<boolean> {
  const { data } = await dbHr().from("nhan_vien").select("chuc_danh, trang_thai").eq("user_id", userId).maybeSingle();
  return !!data && data.trang_thai !== "Đã nghỉ" && laGiamDoc(data.chuc_danh);
}
