import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { laGiamDoc } from "@/lib/chuc-danh";

/** Máy khách Supabase không gắn kiểu cho các bảng HR vận hành (0017+), vì danh sách bảng đọc từ cấu hình trong hr-module.ts. Kiểm tra cột/kiểu làm ở chuanHoaGiaTri. */
export const dbHr = () => createAdminClient() as unknown as SupabaseClient;

/** Tài khoản này có phải giám đốc (theo chức danh trong hồ sơ nhân sự) không. */
export async function laGiamDocTaiKhoan(userId: string): Promise<boolean> {
  const { data } = await dbHr().from("nhan_vien").select("chuc_danh, trang_thai, quyen_giam_doc").eq("user_id", userId).maybeSingle();
  return !!data && data.trang_thai !== "Đã nghỉ" && laGiamDoc(data.chuc_danh, data.quyen_giam_doc);
}

/** Đọc HẾT các dòng của một bảng (có thể kèm lọc): máy chủ chỉ trả tối đa 1000 dòng một lần nên đọc từng trang, sắp theo `id` (hoặc cột khoá truyền vào) để không sót hay lặp.
 * Dùng cho mọi màn cộng dồn số (tồn kho, công nợ, doanh số) — `.limit(n)` lớn hơn 1000 vẫn bị cắt ở 1000 và cho số sai mà không báo lỗi. */
export async function docTatCa<T>(bang: string, cot: string, loc?: (q: any) => any, sapXep: string[] = ["id"]): Promise<T[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const ra: T[] = [];
  for (let i = 0; i < 500_000; i += 1000) {
    let q = dbHr().from(bang).select(cot);
    if (loc) q = loc(q);
    for (const c of sapXep) q = q.order(c);
    const { data } = await q.range(i, i + 999);
    ra.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return ra;
}
