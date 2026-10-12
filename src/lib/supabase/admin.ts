import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// CHỈ dùng trong Server Component / Server Action — dùng service_role nên bỏ qua
// mọi RLS. Chưa có hệ thống đăng nhập/phân quyền nên tạm đọc bằng quyền này ở
// phía server (khoá service_role không bao giờ lộ ra trình duyệt). Khi có đăng
// nhập thật, đổi các trang sang dùng supabase/server.ts (quyền theo người dùng)
// và viết policy RLS cụ thể cho từng vai trò.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
