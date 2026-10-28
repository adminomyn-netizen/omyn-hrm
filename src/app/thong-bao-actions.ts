"use server";

import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { guiChoNguoiDung, layVapid } from "@/lib/push";

type KQ = { ok?: true; loi?: string; thietBi?: number };
type DangKy = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
const tenThietBi = (ua: string) => (/iphone|ipad/i.test(ua) ? "iPhone/iPad" : /android/i.test(ua) ? "Android" : /mac/i.test(ua) ? "Mac" : /windows/i.test(ua) ? "Windows" : "Thiết bị khác");

/** Khoá công khai để trình duyệt đăng ký nhận thông báo (khoá riêng không bao giờ rời máy chủ). */
export async function layKhoaThongBao(): Promise<string | null> {
  if (!(await layNguoiDungHienTai())) return null;
  return (await layVapid())?.pub ?? null;
}

/** Lưu đăng ký nhận thông báo của thiết bị này cho người đang đăng nhập (một endpoint chỉ thuộc một người: đổi người dùng trên cùng máy thì chuyển sang người mới). */
export async function dangKyThongBao(sub: DangKy, userAgent: string): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet") return { loi: "Phiên đăng nhập đã hết. Đăng nhập lại." };
  const endpoint = String(sub?.endpoint ?? ""), p256dh = String(sub?.keys?.p256dh ?? ""), auth = String(sub?.keys?.auth ?? "");
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) return { loi: "Đăng ký thông báo không hợp lệ." };
  const { error } = await createAdminClient().from("dang_ky_thong_bao").upsert({ user_id: nd.id, endpoint, p256dh, auth, thiet_bi: tenThietBi(userAgent) }, { onConflict: "endpoint" });
  return error ? { loi: "Không lưu được đăng ký thông báo. Thử lại." } : { ok: true };
}

export async function huyThongBao(endpoint: string): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd) return { loi: "Phiên đăng nhập đã hết." };
  await createAdminClient().from("dang_ky_thong_bao").delete().eq("endpoint", String(endpoint)).eq("user_id", nd.id);
  return { ok: true };
}

/** Nút "Gửi thử": gửi một thông báo tới mọi thiết bị của chính mình để biết đã nhận được chưa. */
export async function guiThuThongBao(): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd) return { loi: "Phiên đăng nhập đã hết." };
  const kq = await guiChoNguoiDung([nd.id], { tieuDe: "OMYN · Nhân sự", noiDung: "Thông báo thử. Nếu bạn thấy dòng này là đã bật thành công.", url: "/dashboard", tag: "thu" });
  if (kq.thietBi === 0) return { loi: "Chưa có thiết bị nào bật thông báo cho tài khoản này." };
  return kq.thanhCong > 0 ? { ok: true, thietBi: kq.thanhCong } : { loi: "Đã gửi nhưng thiết bị chưa nhận được. Tắt rồi bật lại thông báo." };
}
