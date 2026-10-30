import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layThongBao } from "@/lib/data";
import { dbHr } from "@/lib/hr-db";

export const dynamic = "force-dynamic";

/** Thông báo của người đang đăng nhập — chuông ở đầu trang gọi sau khi trang đã hiện, nên không làm chậm việc chuyển trang. */
export async function GET() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || nguoiDung.vaiTro === "cho_duyet") {
    return NextResponse.json({ thongBao: [], dem: {} }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  const kq = await layThongBao({ id: nguoiDung.id, vaiTro: nguoiDung.vaiTro }).catch(() => ({ ds: [], dem: {} as Record<string, number> }));
  // Thông báo phê duyệt (bảng thong_bao_app) + số phiếu đang chờ người này duyệt cho dấu số ở menu.
  const db = dbHr();
  const [tb, cho] = await Promise.all([
    db.from("thong_bao_app").select("id, tieu_de, noi_dung, url, tao_luc").eq("user_id", nguoiDung.id).order("tao_luc", { ascending: false }).limit(20),
    db.from("pd_buoc").select("id, phieu_id, buoc, pd_phieu!inner(buoc_hien_tai, trang_thai)").eq("user_id", nguoiDung.id).eq("trang_thai", "Chờ").neq("kieu", "CC").eq("pd_phieu.trang_thai", "Chờ duyệt"),
  ]);
  const phieuTb = ((tb.data ?? []) as { id: string; tieu_de: string; noi_dung: string | null; url: string | null; tao_luc: string }[]).map((t) => ({
    id: `pd-${t.id}`, loai: "phe_duyet" as const, tieuDe: t.tieu_de, noiDung: t.noi_dung ?? "", thoiDiem: t.tao_luc, href: t.url ?? "/phe-duyet",
  }));
  const choDuyet = ((cho.data ?? []) as unknown as { buoc: number; pd_phieu: { buoc_hien_tai: number } | { buoc_hien_tai: number }[] }[]).filter((r) => (Array.isArray(r.pd_phieu) ? r.pd_phieu[0] : r.pd_phieu)?.buoc_hien_tai === r.buoc).length;
  const ds = [...kq.ds, ...phieuTb].sort((a, b) => b.thoiDiem.localeCompare(a.thoiDiem)).slice(0, 40);
  return NextResponse.json({ thongBao: ds, dem: { ...kq.dem, ...(choDuyet > 0 ? { "/phe-duyet": choDuyet } : {}) } }, { headers: { "Cache-Control": "private, no-store" } });
}
