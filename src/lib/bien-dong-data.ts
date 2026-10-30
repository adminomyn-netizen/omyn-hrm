import { dbHr } from "@/lib/hr-db";
import { tinhBienDong, type KetQuaBienDong } from "@/lib/bien-dong";

/** Đọc nhân viên + các hồ sơ nghỉ việc đã đóng rồi tính biến động 12 tháng tới tháng hiện tại (giờ Việt Nam). */
export async function layBienDong(): Promise<KetQuaBienDong> {
  const db = dbHr();
  const [nv, nghi] = await Promise.all([
    db.from("nhan_vien").select("id, ngay_vao_lam, trang_thai, khoi(ten)"),
    db.from("nghi_viec").select("nhan_vien_id, ngay_lam_viec_cuoi").eq("trang_thai", "Đã đóng"),
  ]);
  const thangNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 7);
  return tinhBienDong(
    ((nv.data ?? []) as unknown as { id: string; ngay_vao_lam: string | null; trang_thai: string; khoi: { ten: string } | null }[]).map((n) => ({ id: n.id, ngayVao: n.ngay_vao_lam, khoi: n.khoi?.ten ?? null, daNghi: n.trang_thai === "Đã nghỉ" })),
    ((nghi.data ?? []) as { nhan_vien_id: string; ngay_lam_viec_cuoi: string }[]).map((n) => ({ nhanVienId: n.nhan_vien_id, ngayCuoi: n.ngay_lam_viec_cuoi })),
    thangNay,
  );
}
