import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/** Máy khách Supabase không gắn kiểu cho các bảng HR vận hành (0017+), vì danh sách bảng đọc từ cấu hình trong hr-module.ts. Kiểm tra cột/kiểu làm ở chuanHoaGiaTri. */
export const dbHr = () => createAdminClient() as unknown as SupabaseClient;
