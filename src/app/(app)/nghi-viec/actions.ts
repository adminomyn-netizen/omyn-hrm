"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { dieuKienDongHoSo } from "@/lib/nghi-viec";
import { moHoSoNghiViec } from "@/lib/nghi-viec-data";
import { ghiLichSuNhanSu } from "@/lib/nhan-su-lich-su";

export type KetQuaNghiViec = { ok?: boolean; loi?: string; id?: string; thieu?: string[] };
const UUID = /^[0-9a-f-]{36}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Chỉ Quản trị/Kỹ thuật (HCNS và người được giao) xử lý nghỉ việc. */
async function nguoiHcns() {
  const nd = await layNguoiDungHienTai();
  return nd && (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") ? nd : null;
}
const KHONG_QUYEN: KetQuaNghiViec = { loi: "Chỉ Quản trị và Kỹ thuật xử lý nghỉ việc." };
const lamMoi = (id?: string) => { revalidatePath("/nghi-viec"); if (id) revalidatePath(`/nghi-viec/${id}`); };
const cat = (v: string, n: number) => v.trim().slice(0, n);

export async function taoHoSoNghiViec(v: { nhanVienId: string; loai: string; ngayNop: string; ngayCuoi: string; lyDo: string }): Promise<KetQuaNghiViec> {
  const nd = await nguoiHcns();
  if (!nd) return KHONG_QUYEN;
  if (!UUID.test(v.nhanVienId)) return { loi: "Chọn nhân sự." };
  if (!NGAY.test(v.ngayNop) || !NGAY.test(v.ngayCuoi)) return { loi: "Nhập đủ ngày nộp đơn và ngày làm việc cuối cùng." };
  if (v.ngayCuoi < v.ngayNop) return { loi: "Ngày làm việc cuối cùng không được trước ngày nộp đơn." };
  const { data: nv } = await dbHr().from("nhan_vien").select("trang_thai").eq("id", v.nhanVienId).maybeSingle();
  if (!nv || (nv as { trang_thai: string }).trang_thai === "Đã nghỉ") return { loi: "Nhân sự này đã nghỉ hoặc không tồn tại." };
  const r = await moHoSoNghiViec({ nhanVienId: v.nhanVienId, loai: v.loai === "Trước hạn" ? "Trước hạn" : "Đúng hạn", ngayNop: v.ngayNop, ngayCuoi: v.ngayCuoi, lyDo: cat(v.lyDo, 400) }, { id: nd.id, hoTen: nd.hoTen });
  if (!r.id) return { loi: r.loi };
  lamMoi();
  return { ok: true, id: r.id };
}

async function hoSoMo(id: string) {
  if (!UUID.test(id)) return null;
  const { data } = await dbHr().from("nghi_viec").select("id, nhan_vien_id, trang_thai, pv_trang_thai, pv_ngay, pv_ly_do_that").eq("id", id).maybeSingle();
  const h = data as { id: string; nhan_vien_id: string; trang_thai: string; pv_trang_thai: string; pv_ngay: string | null; pv_ly_do_that: string | null } | null;
  return h && h.trang_thai === "Đang bàn giao" ? h : null;
}

export async function datMucNghiViec(id: string, mucId: string, xong: boolean, ghiChu: string): Promise<KetQuaNghiViec> {
  const nd = await nguoiHcns();
  if (!nd) return KHONG_QUYEN;
  const h = await hoSoMo(id);
  if (!h || !UUID.test(mucId)) return { loi: "Hồ sơ đã đóng hoặc không tồn tại." };
  const { data: m, error } = await dbHr().from("nghi_viec_muc").update({ xong, xong_luc: xong ? new Date().toISOString() : null, xong_boi_ten: xong ? nd.hoTen : null, ghi_chu: cat(ghiChu, 300) || null }).eq("id", mucId).eq("nghi_viec_id", id).select("nhom, ten").maybeSingle();
  if (error || !m) return { loi: "Chưa lưu được." };
  const mm = m as { nhom: string; ten: string };
  await ghiLichSuNhanSu({ nhanVienId: h.nhan_vien_id, doiTuong: "Nghỉ việc", doiTuongId: id, hanhDong: "Sửa", moTa: `${xong ? "Hoàn thành" : "Bỏ hoàn thành"}: ${mm.nhom} — ${mm.ten}`.slice(0, 300), nguoi: { id: nd.id, hoTen: nd.hoTen } });
  lamMoi(id);
  return { ok: true };
}

export async function themMucNghiViec(id: string, nhom: string, ten: string, batBuoc: boolean): Promise<KetQuaNghiViec> {
  const nd = await nguoiHcns();
  if (!nd) return KHONG_QUYEN;
  const h = await hoSoMo(id);
  if (!h) return { loi: "Hồ sơ đã đóng hoặc không tồn tại." };
  if (!cat(nhom, 60) || !cat(ten, 200)) return { loi: "Nhập nhóm và nội dung mục." };
  const { error } = await dbHr().from("nghi_viec_muc").insert({ nghi_viec_id: id, nhom: cat(nhom, 60), ten: cat(ten, 200), bat_buoc: batBuoc, thu_tu: 100 });
  if (error) return { loi: "Chưa thêm được." };
  await ghiLichSuNhanSu({ nhanVienId: h.nhan_vien_id, doiTuong: "Nghỉ việc", doiTuongId: id, hanhDong: "Thêm", moTa: `Thêm mục: ${cat(nhom, 60)} — ${cat(ten, 200)}`, nguoi: { id: nd.id, hoTen: nd.hoTen } });
  lamMoi(id);
  return { ok: true };
}

export async function luuPhongVanThoiViec(id: string, v: { trangThai: string; ngay: string; nguoiId: string; lyDoThat: string; ghiChu: string; coTheQuayLai: string }): Promise<KetQuaNghiViec> {
  const nd = await nguoiHcns();
  if (!nd) return KHONG_QUYEN;
  const h = await hoSoMo(id);
  if (!h) return { loi: "Hồ sơ đã đóng hoặc không tồn tại." };
  if (!["Chưa phỏng vấn", "Đã phỏng vấn", "Từ chối phỏng vấn"].includes(v.trangThai)) return { loi: "Trạng thái không hợp lệ." };
  if (v.trangThai === "Đã phỏng vấn" && (!NGAY.test(v.ngay) || !cat(v.lyDoThat, 500))) return { loi: "Đã phỏng vấn thì cần ngày phỏng vấn và lý do thật." };
  const dong = { pv_trang_thai: v.trangThai, pv_ngay: NGAY.test(v.ngay) ? v.ngay : null, pv_nguoi_id: UUID.test(v.nguoiId) ? v.nguoiId : null, pv_ly_do_that: cat(v.lyDoThat, 500) || null, pv_ghi_chu: cat(v.ghiChu, 1000) || null, pv_co_the_quay_lai: v.coTheQuayLai === "Có" ? true : v.coTheQuayLai === "Không" ? false : null };
  const { error } = await dbHr().from("nghi_viec").update(dong).eq("id", id);
  if (error) return { loi: "Chưa lưu được." };
  await ghiLichSuNhanSu({ nhanVienId: h.nhan_vien_id, doiTuong: "Nghỉ việc", doiTuongId: id, hanhDong: "Sửa", moTa: `Phỏng vấn thôi việc: ${v.trangThai}`, nguoi: { id: nd.id, hoTen: nd.hoTen } });
  lamMoi(id);
  return { ok: true };
}

/** Đóng hồ sơ: chỉ khi checklist bắt buộc đã xong, không còn tài sản đang giữ và đã phỏng vấn thôi việc (hoặc ghi nhận từ chối). Rồi chuyển người đó sang "Đã nghỉ" và chấm dứt hợp đồng đang hiệu lực. */
export async function dongHoSoNghiViec(id: string): Promise<KetQuaNghiViec> {
  const nd = await nguoiHcns();
  if (!nd) return KHONG_QUYEN;
  const h = await hoSoMo(id);
  if (!h) return { loi: "Hồ sơ đã đóng hoặc không tồn tại." };
  const db = dbHr();
  const [{ data: muc }, { count }] = await Promise.all([
    db.from("nghi_viec_muc").select("nhom, ten, bat_buoc, xong").eq("nghi_viec_id", id),
    db.from("tai_san_cap_phat").select("id", { count: "exact", head: true }).eq("nhan_vien_id", h.nhan_vien_id).eq("tinh_trang", "Đang giữ"),
  ]);
  const thieu = dieuKienDongHoSo({ pvTrangThai: h.pv_trang_thai, pvNgay: h.pv_ngay, pvLyDoThat: h.pv_ly_do_that }, ((muc ?? []) as { nhom: string; ten: string; bat_buoc: boolean; xong: boolean }[]).map((m) => ({ nhom: m.nhom, ten: m.ten, batBuoc: m.bat_buoc, xong: m.xong })), count ?? 0);
  if (thieu.length > 0) return { loi: "Chưa chốt đủ nên chưa đóng được hồ sơ.", thieu };
  const luc = new Date().toISOString();
  // Giữ chỗ: chỉ một lần đóng thành công.
  const { data: cas } = await db.from("nghi_viec").update({ trang_thai: "Đã đóng", dong_luc: luc, dong_boi_ten: nd.hoTen }).eq("id", id).eq("trang_thai", "Đang bàn giao").select("id");
  if (!cas || cas.length === 0) return { loi: "Hồ sơ vừa được xử lý, tải lại trang." };
  await db.from("nhan_vien").update({ trang_thai: "Đã nghỉ" }).eq("id", h.nhan_vien_id);
  await db.from("hop_dong_lao_dong").update({ trang_thai: "Đã chấm dứt" }).eq("nhan_vien_id", h.nhan_vien_id).eq("trang_thai", "Đang hiệu lực");
  await ghiLichSuNhanSu({ nhanVienId: h.nhan_vien_id, doiTuong: "Nghỉ việc", doiTuongId: id, hanhDong: "Sửa", moTa: "Đóng hồ sơ nghỉ việc: chuyển sang Đã nghỉ, chấm dứt hợp đồng đang hiệu lực", nguoi: { id: nd.id, hoTen: nd.hoTen } });
  lamMoi(id);
  revalidatePath("/nhan-su");
  return { ok: true };
}

export async function huyHoSoNghiViec(id: string): Promise<KetQuaNghiViec> {
  const nd = await nguoiHcns();
  if (!nd) return KHONG_QUYEN;
  const h = await hoSoMo(id);
  if (!h) return { loi: "Hồ sơ đã đóng hoặc không tồn tại." };
  const { error } = await dbHr().from("nghi_viec").update({ trang_thai: "Huỷ" }).eq("id", id);
  if (error) return { loi: "Chưa huỷ được." };
  await ghiLichSuNhanSu({ nhanVienId: h.nhan_vien_id, doiTuong: "Nghỉ việc", doiTuongId: id, hanhDong: "Sửa", moTa: "Huỷ hồ sơ nghỉ việc (người ở lại)", nguoi: { id: nd.id, hoTen: nd.hoTen } });
  lamMoi(id);
  return { ok: true };
}
