import { NextResponse } from "next/server";
import { khoaHopLe, taoLinkTaiLen, timDong } from "@/lib/tep-dinh-kem-data";
import { laUuid } from "@/lib/tep-dinh-kem";

export const dynamic = "force-dynamic";

/** Máy khác (Flora) xin link tải tệp lên. Khoá riêng nằm ở header x-khoa-tai-len, hệ thống chỉ lưu dấu vân tay của khoá.
 * `dong` là mã dòng hoặc đoạn tên (phải ra đúng 1 dòng). */
export async function POST(req: Request) {
  if (!(await khoaHopLe(req.headers.get("x-khoa-tai-len")))) return NextResponse.json({ loi: "Khoá không đúng." }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { man?: string; dong?: string; loai?: string; ten_tep?: string; kich_thuoc?: number } | null;
  if (!b?.man || !b.dong || !b.loai || !b.ten_tep || !b.kich_thuoc) return NextResponse.json({ loi: "Thiếu man, dong, loai, ten_tep hoặc kich_thuoc." }, { status: 400 });
  let dongId = b.dong;
  if (!laUuid(dongId)) {
    const t = await timDong(b.man, b.dong);
    if ("loi" in t) return NextResponse.json(t, { status: 400 });
    if (t.ds.length !== 1) return NextResponse.json({ loi: t.ds.length ? "Tên khớp nhiều dòng, dùng mã dòng." : "Không có dòng nào khớp.", ds: t.ds.slice(0, 20) }, { status: 409 });
    dongId = t.ds[0].id;
  }
  const kq = await taoLinkTaiLen({ man: b.man, dongId, loai: b.loai, tenTep: b.ten_tep, kichThuoc: Number(b.kich_thuoc) });
  if ("loi" in kq) return NextResponse.json(kq, { status: 400 });
  return NextResponse.json({ dong_id: dongId, duong_dan: kq.duongDan, link_tai: kq.linkTai });
}
