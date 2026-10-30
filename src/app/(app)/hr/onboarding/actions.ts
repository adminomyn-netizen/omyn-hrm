"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { GIAI_DOAN, NHIEM_VU_MAU, TINH_TRANG_ONB, TT_HO_SO, hanGiaiDoan } from "@/lib/onboarding";

type KQ = { loi?: string; ok?: boolean; id?: string };
const KHONG_QUYEN: KQ = { loi: "Bạn không có quyền thực hiện thao tác này." };
const chuoi = (fd: FormData, k: string, toiDa = 200) => String(fd.get(k) ?? "").trim().slice(0, toiDa);
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const ngay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const hoac = (s: string) => (uuid(s) ? s : null);
async function quanTri() { const nd = await layNguoiDungHienTai(); return nd && (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") ? nd : null; }
const lamMoi = (id?: string) => { revalidatePath("/hr/onboarding"); revalidatePath("/hr"); if (id) revalidatePath(`/hr/onboarding/${id}`); };

export async function themNguoiMoi(fd: FormData): Promise<KQ> {
  if (!(await quanTri())) return KHONG_QUYEN;
  const hoTen = chuoi(fd, "ho_ten"); const batDau = chuoi(fd, "ngay_bat_dau");
  if (!hoTen) return { loi: "Nhập họ tên người mới." };
  if (!ngay(batDau)) return { loi: "Chọn ngày bắt đầu." };
  const soNgay = Math.min(180, Math.max(1, Number(chuoi(fd, "so_ngay_thu_viec", 4)) || 60));
  const db = dbHr();
  const { data, error } = await db.from("theo_doi_onboarding").insert({
    ho_ten: hoTen, vi_tri: chuoi(fd, "vi_tri") || null, email: chuoi(fd, "email") || null, dien_thoai: chuoi(fd, "dien_thoai", 30) || null,
    khoi_id: hoac(chuoi(fd, "khoi_id", 40)), quan_ly_id: hoac(chuoi(fd, "quan_ly_id", 40)), mentor_id: hoac(chuoi(fd, "mentor_id", 40)),
    ngay_bat_dau: batDau, so_ngay_thu_viec: soNgay, tinh_trang: "Chuẩn bị",
  }).select("id").single();
  if (error || !data) return { loi: "Chưa tạo được. Thử lại sau." };
  const nv = NHIEM_VU_MAU.map((n, i) => ({ onb_id: data.id, giai_doan: n.giaiDoan, noi_dung: n.noiDung, han: hanGiaiDoan(n.giaiDoan, batDau, soNgay), thu_tu: i }));
  await db.from("onb_nhiem_vu").insert(nv);
  lamMoi();
  return { ok: true, id: data.id };
}

export async function doiNhiemVu(onbId: string, nhiemVuId: string, xong: boolean): Promise<KQ> {
  if (!(await quanTri()) || !uuid(onbId) || !uuid(nhiemVuId)) return KHONG_QUYEN;
  const { error } = await dbHr().from("onb_nhiem_vu").update({ xong, xong_luc: xong ? new Date().toISOString() : null }).eq("id", nhiemVuId).eq("onb_id", onbId);
  if (error) return { loi: "Chưa lưu được." };
  lamMoi(onbId);
  return { ok: true };
}

export async function themNhiemVu(fd: FormData): Promise<KQ> {
  if (!(await quanTri())) return KHONG_QUYEN;
  const onbId = chuoi(fd, "onb_id", 40); const gd = chuoi(fd, "giai_doan"); const nd = chuoi(fd, "noi_dung", 300); const han = chuoi(fd, "han");
  if (!uuid(onbId) || !(GIAI_DOAN as readonly string[]).includes(gd)) return { loi: "Dữ liệu chưa hợp lệ." };
  if (!nd) return { loi: "Nhập nội dung việc cần làm." };
  const { error } = await dbHr().from("onb_nhiem_vu").insert({ onb_id: onbId, giai_doan: gd, noi_dung: nd, han: ngay(han) ? han : null, thu_tu: 1000 + Date.now() % 100000 });
  if (error) return { loi: "Chưa thêm được." };
  lamMoi(onbId);
  return { ok: true };
}

export async function luuDanhGiaThuViec(fd: FormData): Promise<KQ> {
  if (!(await quanTri())) return KHONG_QUYEN;
  const onbId = chuoi(fd, "onb_id", 40); const moc = chuoi(fd, "moc"); const ai = chuoi(fd, "nguoi_danh_gia"); const kq = chuoi(fd, "ket_qua");
  const diem = Number(chuoi(fd, "diem", 2));
  if (!uuid(onbId) || !["30 ngày", "60 ngày"].includes(moc) || !["Mentor", "Quản lý", "Nhân sự"].includes(ai) || !["Chờ", "Đạt", "Cần theo dõi", "Không đạt"].includes(kq)) return { loi: "Dữ liệu chưa hợp lệ." };
  if (!(diem >= 1 && diem <= 5)) return { loi: "Chấm điểm từ 1 đến 5." };
  const { error } = await dbHr().from("danh_gia_thu_viec").insert({ onb_id: onbId, moc, nguoi_danh_gia: ai, ket_qua: kq, diem, diem_manh: chuoi(fd, "diem_manh", 1000) || null, can_cai_thien: chuoi(fd, "can_cai_thien", 1000) || null });
  if (error) return { loi: "Chưa lưu được đánh giá." };
  lamMoi(onbId);
  return { ok: true };
}

export async function capNhatOnb(fd: FormData): Promise<KQ> {
  if (!(await quanTri())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40); const tt = chuoi(fd, "tinh_trang"); const hs = chuoi(fd, "trang_thai_ho_so");
  if (!uuid(id) || !(TINH_TRANG_ONB as readonly string[]).includes(tt) || !(TT_HO_SO as readonly string[]).includes(hs)) return { loi: "Dữ liệu chưa hợp lệ." };
  const xongThu = tt === "Đạt, lên chính thức" || tt === "Không đạt" || tt === "Nghỉ giữa chừng";
  const { error } = await dbHr().from("theo_doi_onboarding").update({
    tinh_trang: tt, trang_thai_ho_so: hs, thong_tin_con_thieu: chuoi(fd, "thong_tin_con_thieu", 500) || null,
    tk_lark_da_tao: fd.get("tk_lark_da_tao") === "1", da_gioi_thieu_cong_ty: fd.get("da_gioi_thieu_cong_ty") === "1",
    mentor_id: hoac(chuoi(fd, "mentor_id", 40)), quan_ly_id: hoac(chuoi(fd, "quan_ly_id", 40)), ghi_chu: chuoi(fd, "ghi_chu", 1000) || null,
    ngay_hoan_tat: xongThu ? new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }) : null,
  }).eq("id", id);
  if (error) return { loi: "Chưa lưu được." };
  lamMoi(id);
  return { ok: true };
}

export async function xoaOnb(id: string): Promise<KQ> {
  if (!(await quanTri()) || !uuid(id)) return KHONG_QUYEN;
  const { error } = await dbHr().from("theo_doi_onboarding").delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được." };
  lamMoi();
  return { ok: true };
}
