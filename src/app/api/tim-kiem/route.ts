import { NextResponse, type NextRequest } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export type KetQuaTim = { loai: "nhan_vien" | "ung_vien" | "tin"; id: string; tieuDe: string; phu: string; href: string };

/** Tìm nhanh toàn hệ thống cho Quản trị/Kỹ thuật (hộp ⌘K). Mỗi bảng một truy vấn riêng, có giới hạn; từ khoá được thoát ký tự đặc biệt. */
export async function GET(req: NextRequest) {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || (nguoiDung.vaiTro !== "admin" && nguoiDung.vaiTro !== "ky_thuat")) {
    return NextResponse.json({ ketQua: [] }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  const tho = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (tho.length < 2) return NextResponse.json({ ketQua: [] }, { headers: { "Cache-Control": "private, no-store" } });
  const mau = `%${tho.replace(/[\\%_]/g, (c) => "\\" + c)}%`;

  const db = createAdminClient();
  const [nv1, nv2, nv3, uv, tin] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien, chuc_danh, email").ilike("ho_ten", mau).limit(5),
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien, chuc_danh, email").ilike("email", mau).limit(3),
    db.from("nhan_vien").select("id, ho_ten, ma_nhan_vien, chuc_danh, email").ilike("chuc_danh", mau).limit(3),
    db.from("ung_vien").select("id, ho_ten, trang_thai, tin_tuyen_dung_id, tin:tin_tuyen_dung_id(vi_tri)").ilike("ho_ten", mau).limit(5),
    db.from("tin_tuyen_dung").select("id, vi_tri, trang_thai").ilike("vi_tri", mau).limit(4),
  ]);

  const nhanVien = new Map<string, NonNullable<typeof nv1.data>[number]>();
  for (const n of [...(nv1.data ?? []), ...(nv2.data ?? []), ...(nv3.data ?? [])]) nhanVien.set(n.id, n);

  const ketQua: KetQuaTim[] = [
    ...[...nhanVien.values()].slice(0, 6).map((n) => ({
      loai: "nhan_vien" as const,
      id: n.id,
      tieuDe: n.ho_ten,
      phu: [n.ma_nhan_vien, n.chuc_danh].filter(Boolean).join(" · "),
      href: `/nhan-su?q=${encodeURIComponent(n.ho_ten)}`,
    })),
    ...(uv.data ?? []).map((u) => ({
      loai: "ung_vien" as const,
      id: u.id,
      tieuDe: u.ho_ten,
      phu: `Ứng viên · ${(u.tin as { vi_tri?: string } | null)?.vi_tri ?? ""} · ${u.trang_thai}`,
      href: `/tuyen-dung?tin=${u.tin_tuyen_dung_id}`,
    })),
    ...(tin.data ?? []).map((t) => ({
      loai: "tin" as const,
      id: t.id,
      tieuDe: t.vi_tri,
      phu: `Tin tuyển dụng · ${t.trang_thai}`,
      href: `/tuyen-dung?tin=${t.id}`,
    })),
  ];
  return NextResponse.json({ ketQua }, { headers: { "Cache-Control": "private, no-store" } });
}
