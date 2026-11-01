import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type Tin = { tieuDe: string; noiDung: string; url: string; tag?: string };
export type KetQuaGui = { thietBi: number; thanhCong: number; daGo: number };
type Vapid = { pub: string; pri: string; subject: string };

// Khoá VAPID nằm trong bảng cau_hinh_bi_mat (chỉ khoá service đọc được), không phải biến môi trường: đổi/xoay khoá chỉ cần sửa một dòng.
let boNho: { v: Vapid | null; het: number } | null = null;
export async function layVapid(): Promise<Vapid | null> {
  if (boNho && boNho.het > Date.now()) return boNho.v;
  const { data } = await createAdminClient().from("cau_hinh_bi_mat").select("khoa, gia_tri").in("khoa", ["vapid_public", "vapid_private", "vapid_subject"]);
  const m = new Map((data ?? []).map((r) => [r.khoa, r.gia_tri]));
  const v = m.get("vapid_public") && m.get("vapid_private") ? { pub: m.get("vapid_public")!, pri: m.get("vapid_private")!, subject: m.get("vapid_subject") ?? "mailto:adminomyn@gmail.com" } : null;
  boNho = { v, het: Date.now() + 5 * 60_000 };
  return v;
}

/** Gửi một thông báo tới mọi thiết bị đã đăng ký của các tài khoản. Thiết bị hết hạn (404/410) tự bị gỡ.
 *  Không bao giờ ném lỗi ra ngoài: thông báo hỏng không được làm hỏng nghiệp vụ. */
export async function guiChoNguoiDung(userIds: string[], tin: Tin): Promise<KetQuaGui> {
  const ra: KetQuaGui = { thietBi: 0, thanhCong: 0, daGo: 0 };
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return ra;
  try {
    const v = await layVapid();
    if (!v) return ra;
    const db = createAdminClient();
    const { data: ds } = await db.from("dang_ky_thong_bao").select("id, endpoint, p256dh, auth").in("user_id", ids);
    ra.thietBi = ds?.length ?? 0;
    const goi = JSON.stringify({ tieuDe: tin.tieuDe.slice(0, 80), noiDung: tin.noiDung.slice(0, 420), url: tin.url, tag: tin.tag });
    const hong: string[] = [], tot: string[] = [];
    await Promise.all((ds ?? []).map(async (d) => {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, goi, { TTL: 60 * 60 * 12, urgency: "high", vapidDetails: { subject: v.subject, publicKey: v.pub, privateKey: v.pri } });
        tot.push(d.id);
      } catch (e) {
        const ma = (e as { statusCode?: number }).statusCode;
        if (ma === 404 || ma === 410) hong.push(d.id); else console.error("[push] gửi lỗi", ma);
      }
    }));
    ra.thanhCong = tot.length; ra.daGo = hong.length;
    if (hong.length) await db.from("dang_ky_thong_bao").delete().in("id", hong);
    if (tot.length) await db.from("dang_ky_thong_bao").update({ gui_cuoi_luc: new Date().toISOString() }).in("id", tot);
  } catch (e) {
    console.error("[push] lỗi", (e as Error).message);
  }
  return ra;
}
