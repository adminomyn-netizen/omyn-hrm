import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { KHO_CHAT } from "@/lib/chat-cong-cu";

export const dynamic = "force-dynamic";

/** Tải tệp Tula tạo trong chat: chỉ chủ cuộc chat; link ký sống 60 giây. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet" || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Không có quyền", { status: 403 });
  const db = createAdminClient();
  const { data: tin } = await db.from("chat_tin").select("user_id, tep_duong_dan, tep_ten").eq("id", id).maybeSingle();
  if (!tin?.tep_duong_dan || tin.user_id !== nd.id) return new NextResponse("Không có quyền", { status: 403 });
  const { data, error } = await db.storage.from(KHO_CHAT).createSignedUrl(tin.tep_duong_dan, 60, { download: tin.tep_ten ?? true });
  if (error || !data) return new NextResponse("Chưa mở được tệp", { status: 502 });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
