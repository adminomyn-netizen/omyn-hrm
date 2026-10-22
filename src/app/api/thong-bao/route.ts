import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layThongBao } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Thông báo của người đang đăng nhập — chuông ở đầu trang gọi sau khi trang đã hiện, nên không làm chậm việc chuyển trang. */
export async function GET() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || nguoiDung.vaiTro === "cho_duyet") {
    return NextResponse.json({ thongBao: [], dem: {} }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  const kq = await layThongBao({ id: nguoiDung.id, vaiTro: nguoiDung.vaiTro }).catch(() => ({ ds: [], dem: {} }));
  return NextResponse.json({ thongBao: kq.ds, dem: kq.dem }, { headers: { "Cache-Control": "private, no-store" } });
}
