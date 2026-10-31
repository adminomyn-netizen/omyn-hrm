import { NextResponse } from "next/server";
import { khoaHopLe, xacNhanTep } from "@/lib/tep-dinh-kem-data";

export const dynamic = "force-dynamic";

/** Sau khi tải xong lên link ký: ghi tệp vào dòng. Dung lượng lấy từ kho, không tin số khai. */
export async function POST(req: Request) {
  if (!(await khoaHopLe(req.headers.get("x-khoa-tai-len")))) return NextResponse.json({ loi: "Khoá không đúng." }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { man?: string; dong_id?: string; loai?: string; ten_tep?: string; kieu?: string; duong_dan?: string } | null;
  if (!b?.man || !b.dong_id || !b.loai || !b.ten_tep || !b.duong_dan) return NextResponse.json({ loi: "Thiếu thông tin." }, { status: 400 });
  const kq = await xacNhanTep({ ten: "Flora (tải từ máy khác)", nguon: "Lệnh tải từ máy khác" }, null, { man: b.man, dongId: b.dong_id, loai: b.loai, tenTep: b.ten_tep, kieu: b.kieu ?? null, duongDan: b.duong_dan });
  if ("loi" in kq) return NextResponse.json(kq, { status: 400 });
  return NextResponse.json(kq);
}
