import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ngayHomNayHCM } from "@/lib/data";

export const dynamic = "force-dynamic";

const BANG = ["khoi", "nhan_vien", "cham_cong", "don_tu", "ky_luong", "bang_luong", "luong_thoa_thuan", "tham_so_luong", "ngay_le", "tin_tuyen_dung", "ung_vien", "danh_gia_hieu_suat"] as const;

/** Tải về bản sao lưu dữ liệu (JSON) — CHỈ tải về, không có chức năng khôi phục. Chỉ Kỹ thuật vì có cả lương và dữ liệu cá nhân. Không gồm tài khoản đăng nhập. */
export async function GET() {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro !== "ky_thuat") return NextResponse.json({ loi: "Không có quyền." }, { status: 403 });
  const db = createAdminClient();
  const ra: Record<string, unknown[]> = {};
  for (const b of BANG) {
    const dong: unknown[] = [];
    for (let tu = 0; ; tu += 1000) {
      const { data, error } = await db.from(b).select("*").range(tu, tu + 999);
      if (error) return NextResponse.json({ loi: `Không đọc được bảng ${b}.` }, { status: 500 });
      dong.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    ra[b] = dong;
  }
  const hom = ngayHomNayHCM();
  return new NextResponse(JSON.stringify({ taoLuc: new Date().toISOString(), ghiChu: "Bản sao lưu để lưu trữ; ứng dụng không có chức năng khôi phục từ tệp này.", bang: ra }, null, 1), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="omyn-hrm-sao-luu-${hom}.json"`, "Cache-Control": "private, no-store" },
  });
}
