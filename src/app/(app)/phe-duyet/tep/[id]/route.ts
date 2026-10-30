import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbHr } from "@/lib/hr-db";
import { KHO_TEP, taiPhieuDeXem } from "@/lib/phe-duyet-data";

export const dynamic = "force-dynamic";

/** Tải một tệp đính kèm: chỉ người có quyền xem phiếu mới nhận được đường tải (hết hạn sau 60 giây). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet") return new NextResponse("Cần đăng nhập", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Không có tệp", { status: 404 });
  const { data } = await dbHr().from("pd_tep").select("phieu_id, ten_tep, duong_dan").eq("id", id).maybeSingle();
  const t = data as { phieu_id: string; ten_tep: string; duong_dan: string } | null;
  if (!t || !(await taiPhieuDeXem(t.phieu_id, nd))) return new NextResponse("Không có tệp", { status: 404 });
  const { data: ky } = await createAdminClient().storage.from(KHO_TEP).createSignedUrl(t.duong_dan, 60, { download: t.ten_tep });
  if (!ky?.signedUrl) return new NextResponse("Không lấy được tệp", { status: 502 });
  return NextResponse.redirect(ky.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}
