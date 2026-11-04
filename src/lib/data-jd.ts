import "server-only";
import { dbHr } from "@/lib/hr-db";
import { jdThanhVanBan, type DongJd } from "@/lib/jd";

/** Các JD đang dùng, để chọn khi đăng tin. */
export async function layJd(): Promise<{ vi_tri: string; noi_dung: string }[]> {
  const { data } = await dbHr().from("jd_vi_tri").select("vi_tri, muc_dich, nhiem_vu, yeu_cau, ky_nang, quyen_loi, muc_luong").eq("trang_thai", "Đang dùng").order("vi_tri");
  return ((data ?? []) as DongJd[]).map((j) => ({ vi_tri: j.vi_tri, noi_dung: jdThanhVanBan(j).slice(0, 4000) })).filter((j) => j.noi_dung);
}
