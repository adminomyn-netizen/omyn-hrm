import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gioHienTaiHCM, ngayHomNayHCM } from "@/lib/data";
import { guiChoNguoiDung } from "@/lib/push";
import { NHAN_THIEU, layNguoiQuanLy, nguoiPhaiChamCong, nhacHienTai, ngayLamViecTruoc, thieuNgayTruoc } from "@/lib/nhac-cong";
import { nhacHr } from "@/lib/nhac-hr-data";
import { kyCanBaoHomNay, tinhTongHop } from "@/lib/tong-hop-hieu-suat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Nhắc việc bằng thông báo đẩy, chạy mỗi 5 phút (lịch pg_cron ở Supabase gọi vào đây, mã bí mật trong Vault).
 *  Mỗi người mỗi ngày mỗi khung nhắc đúng một lần (bảng nhac_da_gui), nên chạy lặp hay trễ vài phút cũng không gửi trùng.
 *  · Người phải chấm công: 10 và 5 phút trước 08:00, rồi cứ 10 phút một lần đến khi chấm công vào (dừng lúc 11:05); 10/5 phút trước 17:00 và cứ 10 phút một lần sau 17:00 đến khi chấm công ra (dừng lúc 20:00).
 *  · 08:30: ai thiếu check in/check out ở ngày làm việc trước mà chưa gửi đơn Giải trình công.
 *  · HCNS & KPI (lib/nhac-hr-data.ts): nhắc phỏng vấn, tóm tắt HCNS sáng, đánh giá thử việc 30/60 ngày, xếp hạng KPI, nhắc nhập KPI.
 *  · Quản lý: 09:00 số người chưa chấm công; tổng hợp hiệu suất tuần (Thứ Hai), tháng (ngày 1), năm (1/1) lúc 08:00. */
export async function GET(req: Request) {
  const mang = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const db = createAdminClient();
  const duoc = (!!process.env.CRON_SECRET && mang === process.env.CRON_SECRET) || (mang.length > 0 && (await db.rpc("kiem_token_cron", { p: mang })).data === true);
  if (!duoc) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });

  const hom = ngayHomNayHCM(), g = gioHienTaiHCM(), phut = Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5));
  let daGui = 0;
  const gui = async (userId: string, khung: string, tin: Parameters<typeof guiChoNguoiDung>[1]) => {
    // Chèn trước, trùng khoá thì đã gửi rồi: bỏ qua.
    const { error } = await db.from("nhac_da_gui").insert({ user_id: userId, ngay: hom, khung });
    if (error) return;
    daGui += (await guiChoNguoiDung([userId], { ...tin, tag: `${khung}-${hom}` })).thanhCong;
  };

  const ds = await nguoiPhaiChamCong(hom);
  for (const n of ds) {
    const nhac = nhacHienTai(n, phut);
    if (nhac) await gui(n.userId, nhac.khung, { tieuDe: nhac.tieuDe, noiDung: nhac.noiDung, url: nhac.url });
  }

  if (phut >= 8 * 60 + 30 && phut < 9 * 60 + 30) {
    const truoc = await ngayLamViecTruoc(hom);
    for (const n of await thieuNgayTruoc(truoc)) {
      await gui(n.userId, "quen_hom_qua", { tieuDe: "Hôm qua thiếu chấm công", noiDung: `Bạn thiếu ${NHAN_THIEU[n.thieu]} ngày ${truoc.slice(8)}/${truoc.slice(5, 7)}. Gửi đơn Giải trình công để được tính công.`, url: "/don-tu" });
    }
  }

  // Quản lý: số người chưa chấm công lúc 09:00; tổng hợp tuần/tháng/năm từ 08:00 (cửa sổ rộng đến 12:00, mỗi kỳ chỉ ghi và báo một lần nên trễ giờ cũng không sao).
  const baoChua = phut >= 9 * 60 && phut < 10 * 60 && ds.some((n) => !n.vao);
  const baoTongHop = phut >= 8 * 60 && phut < 12 * 60 ? kyCanBaoHomNay(hom) : [];
  if (baoChua || baoTongHop.length) {
    const quanLy = await layNguoiQuanLy();
    if (baoChua) {
      const chua = ds.filter((n) => !n.vao).length;
      for (const u of quanLy) await gui(u, "chua_cham_09", { tieuDe: "Chấm công lúc 09:00", noiDung: `Còn ${chua}/${ds.length} người chưa chấm công vào hôm nay.`, url: "/dashboard" });
    }
    for (const k of baoTongHop) {
      const tt = await tinhTongHop(k);
      const { data: moi } = await db.from("tong_hop_hieu_suat").upsert({ loai: k.loai, ky: k.ky, tieu_de: tt.tieuDe, noi_dung: tt.noiDung, chi_tiet: tt.chiTiet }, { onConflict: "loai,ky", ignoreDuplicates: true }).select("id");
      // Chỉ báo khi kỳ này vừa được ghi lần đầu (đã có từ lần chạy trước thì bỏ qua).
      if (moi?.length) for (const u of quanLy) await gui(u, `tong_hop_${k.loai}`, { tieuDe: tt.tieuDe, noiDung: tt.noiDung, url: "/tong-hop" });
    }
  }
  let hr = 0;
  try { hr = await nhacHr({ hom, phut, nowMs: Date.now(), gui, layQuanLy: layNguoiQuanLy }); } catch (e) { console.error("[nhac-hr] lỗi", (e as Error).message); }
  await db.from("nhac_da_gui").delete().lt("ngay", new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10));
  return NextResponse.json({ ngay: hom, phut, canCham: ds.length, daGui, hr });
}
