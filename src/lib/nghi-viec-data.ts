import "server-only";
import { dbHr } from "@/lib/hr-db";
import { CHECKLIST_MAU } from "@/lib/nghi-viec";
import { ghiLichSuNhanSu, type NguoiSua } from "@/lib/nhan-su-lich-su";

export type MoHoSo = { nhanVienId: string; phieuId?: string | null; loai: "Đúng hạn" | "Trước hạn"; ngayNop: string; ngayCuoi: string; lyDo?: string | null };

/** Mở hồ sơ nghỉ việc kèm checklist mẫu. Người đó đã có hồ sơ đang mở thì trả lỗi (mỗi người một hồ sơ mở). */
export async function moHoSoNghiViec(v: MoHoSo, nguoi: NguoiSua): Promise<{ id?: string; loi?: string }> {
  const db = dbHr();
  const { data, error } = await db.from("nghi_viec").insert({ nhan_vien_id: v.nhanVienId, phieu_id: v.phieuId ?? null, loai: v.loai, ngay_nop: v.ngayNop, ngay_lam_viec_cuoi: v.ngayCuoi, ly_do: v.lyDo || null }).select("id").single();
  if (error || !data) return { loi: error?.code === "23505" ? "Người này đã có hồ sơ nghỉ việc đang mở." : "Không mở được hồ sơ nghỉ việc, kiểm tra lại ngày." };
  const id = (data as { id: string }).id;
  await db.from("nghi_viec_muc").insert(CHECKLIST_MAU.map((m, i) => ({ nghi_viec_id: id, nhom: m.nhom, ten: m.ten, bat_buoc: m.batBuoc, thu_tu: i })));
  await ghiLichSuNhanSu({ nhanVienId: v.nhanVienId, doiTuong: "Nghỉ việc", doiTuongId: id, hanhDong: "Thêm", moTa: `Mở hồ sơ nghỉ việc (${v.loai}, ngày làm việc cuối ${v.ngayCuoi})`, sau: v, nguoi });
  return { id };
}

/** Phiếu bàn giao đã duyệt: tick các mục của nhóm đó trong hồ sơ nghỉ việc đang mở của người nộp. Trả về mô tả kết quả. */
export async function tickBanGiaoTuPhieu(nhanVienId: string, nhom: string, soPhieu: string, nguoi: NguoiSua): Promise<string> {
  const db = dbHr();
  const { data: hs } = await db.from("nghi_viec").select("id").eq("nhan_vien_id", nhanVienId).eq("trang_thai", "Đang bàn giao").maybeSingle();
  if (!hs) return `chưa có hồ sơ nghỉ việc đang mở nên chưa tick “${nhom}”`;
  const id = (hs as { id: string }).id;
  const { data: muc } = await db.from("nghi_viec_muc").update({ xong: true, xong_luc: new Date().toISOString(), xong_boi_ten: `Phiếu ${soPhieu}`, ghi_chu: `Tự tick từ phiếu ${soPhieu}` }).eq("nghi_viec_id", id).eq("nhom", nhom).eq("xong", false).select("id");
  const n = (muc ?? []).length;
  if (n > 0) await ghiLichSuNhanSu({ nhanVienId, doiTuong: "Nghỉ việc", doiTuongId: id, hanhDong: "Sửa", moTa: `Tick ${n} mục “${nhom}” (từ phiếu ${soPhieu})`, nguoi });
  return n > 0 ? `tick ${n} mục “${nhom}” trong hồ sơ nghỉ việc` : `“${nhom}” đã tick sẵn`;
}
