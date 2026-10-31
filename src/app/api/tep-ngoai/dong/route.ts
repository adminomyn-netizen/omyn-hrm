import { NextResponse } from "next/server";
import { khoaHopLe, timDong } from "@/lib/tep-dinh-kem-data";

export const dynamic = "force-dynamic";

/** Liệt kê dòng của một màn (mã dòng + tên) để biết gắn tệp vào đâu. ?man=so-hop-dong&q=melrose */
export async function GET(req: Request) {
  if (!(await khoaHopLe(req.headers.get("x-khoa-tai-len")))) return NextResponse.json({ loi: "Khoá không đúng." }, { status: 401 });
  const u = new URL(req.url);
  const kq = await timDong(u.searchParams.get("man") ?? "", u.searchParams.get("q") ?? "");
  if ("loi" in kq) return NextResponse.json(kq, { status: 400 });
  return NextResponse.json({ ds: kq.ds.slice(0, 200) });
}
