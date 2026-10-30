import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chayDongBo } from "@/lib/quang-cao-dong-bo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Kéo số quảng cáo + bán hàng Facebook, TikTok, Shopee mỗi đêm (lịch pg_cron ở Supabase, cùng mã bí mật với /api/cron/nhac). Chưa có khoá thì ghi nhật ký "Bỏ qua". */
export async function GET(req: Request) {
  const mang = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const duoc = (!!process.env.CRON_SECRET && mang === process.env.CRON_SECRET) || (mang.length > 0 && (await createAdminClient().rpc("kiem_token_cron", { p: mang })).data === true);
  if (!duoc) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  const [fb, tt, sp] = await Promise.all([chayDongBo("Facebook"), chayDongBo("TikTok"), chayDongBo("Shopee")]);
  return NextResponse.json({ facebook: fb, tiktok: tt, shopee: sp });
}
