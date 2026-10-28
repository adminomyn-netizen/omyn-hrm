import { NextResponse } from "next/server";
import { CONG_CU, chayCongCu, nguoiTuThongHanh } from "@/lib/chat-cong-cu";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cổng công cụ của Tula (chat nổi). KHÔNG dùng phiên đăng nhập: chỉ nhận mã thông hành sinh riêng cho từng tin chat, hết hạn sau 15 phút hoặc khi tin xong.
 *  Người hỏi và quyền của họ do máy chủ dựng từ mã đó; mô hình không có cách nào khai "tôi là người khác". */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { token?: string; ten?: string; tham_so?: Record<string, unknown> } | null;
  const ctx = await nguoiTuThongHanh(String(b?.token ?? ""));
  if (!ctx) return NextResponse.json({ loi: "Mã thông hành không hợp lệ hoặc đã hết hạn." }, { status: 401 });
  if (!b?.ten) return NextResponse.json({ cong_cu: CONG_CU });
  const kq = await chayCongCu(ctx, String(b.ten), b.tham_so && typeof b.tham_so === "object" ? b.tham_so : {});
  return NextResponse.json({ kq });
}
