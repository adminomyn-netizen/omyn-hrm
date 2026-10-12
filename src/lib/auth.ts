import "server-only";
import { createClient } from "@/lib/supabase/server";

export type VaiTro = "admin" | "ky_thuat";

export async function layNguoiDungHienTai() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    hoTen: (user.app_metadata?.ho_ten as string) || (user.email ?? ""),
    vaiTro: (user.app_metadata?.vai_tro as VaiTro) ?? "admin",
  };
}
