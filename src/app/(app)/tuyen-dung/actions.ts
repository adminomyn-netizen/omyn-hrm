"use server";

import { revalidatePath } from "next/cache";
import { coVaiTro } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUOC_UNG_VIEN, TRANG_THAI_TIN } from "@/lib/tuyen-dung";

export type KetQua = { loi?: string; ok?: boolean; id?: string };

const KHONG_QUYEN: KetQua = { loi: "Bạn không có quyền thực hiện thao tác này." };
const cho = async () => coVaiTro(["admin", "ky_thuat"]);

const chuoi = (fd: FormData, k: string, toiDa = 500) => String(fd.get(k) ?? "").trim().slice(0, toiDa);
const ngay = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? s : null);
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const xong = () => {
  revalidatePath("/tuyen-dung");
  revalidatePath("/dashboard");
};

/** Thêm hoặc sửa tin tuyển dụng (có `id` = sửa). */
export async function luuTin(fd: FormData): Promise<KetQua> {
  if (!(await cho())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  const viTri = chuoi(fd, "vi_tri", 120);
  const khoiId = chuoi(fd, "khoi_id", 40);
  const soLuong = Number(chuoi(fd, "so_luong_can", 4));
  const trangThai = chuoi(fd, "trang_thai", 30);
  const hanNop = chuoi(fd, "han_nop", 10);
  const moTa = chuoi(fd, "mo_ta", 4000);

  if (viTri.length < 2) return { loi: "Nhập tên vị trí cần tuyển." };
  if (!uuid(khoiId)) return { loi: "Chọn khối cho vị trí này." };
  if (!Number.isInteger(soLuong) || soLuong < 1 || soLuong > 99) return { loi: "Số lượng cần tuyển từ 1 đến 99." };
  if (!(TRANG_THAI_TIN as readonly string[]).includes(trangThai)) return { loi: "Trạng thái không hợp lệ." };
  if (hanNop && !ngay(hanNop)) return { loi: "Hạn nộp hồ sơ chưa đúng ngày." };

  const du = {
    vi_tri: viTri,
    khoi_id: khoiId,
    so_luong_can: soLuong,
    trang_thai: trangThai,
    han_nop: hanNop || null,
    mo_ta: moTa || null,
  };
  const db = createAdminClient();
  const { error } = id ? await db.from("tin_tuyen_dung").update(du).eq("id", id) : await db.from("tin_tuyen_dung").insert(du);
  if (error) return { loi: "Chưa lưu được tin tuyển dụng. Thử lại sau." };
  xong();
  return { ok: true };
}

export async function xoaTin(fd: FormData): Promise<KetQua> {
  if (!(await cho())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  if (!uuid(id)) return { loi: "Thiếu mã tin." };
  const db = createAdminClient();
  const { count } = await db.from("ung_vien").select("id", { count: "exact", head: true }).eq("tin_tuyen_dung_id", id);
  if ((count ?? 0) > 0) {
    return { loi: "Tin này đã có ứng viên nên không xoá được. Hãy chuyển sang \"Đã đóng\" để giữ lại hồ sơ." };
  }
  const { error } = await db.from("tin_tuyen_dung").delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được tin. Thử lại sau." };
  xong();
  return { ok: true };
}

/** Thêm hoặc sửa ứng viên (có `id` = sửa). */
export async function luuUngVien(fd: FormData): Promise<KetQua> {
  if (!(await cho())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  const tinId = chuoi(fd, "tin_tuyen_dung_id", 40);
  const hoTen = chuoi(fd, "ho_ten", 120);
  const email = chuoi(fd, "email", 120);
  const dienThoai = chuoi(fd, "dien_thoai", 20);
  const namSinhTho = chuoi(fd, "nam_sinh", 4);
  const nguon = chuoi(fd, "nguon", 40);
  const linkCv = chuoi(fd, "link_cv", 500);
  const ghiChu = chuoi(fd, "ghi_chu", 2000);
  const ngayPv = chuoi(fd, "ngay_phong_van", 10);
  const ngayNhan = chuoi(fd, "ngay_nhan_ho_so", 10);
  const buoc = chuoi(fd, "trang_thai", 30) || "Mới nộp";

  if (!uuid(tinId)) return { loi: "Thiếu tin tuyển dụng." };
  if (hoTen.length < 2) return { loi: "Nhập họ tên ứng viên." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { loi: "Email chưa đúng định dạng." };
  if (dienThoai && !/^[0-9+\s.()-]{8,20}$/.test(dienThoai)) return { loi: "Số điện thoại chưa đúng." };
  const namSinh = namSinhTho ? Number(namSinhTho) : null;
  if (namSinh !== null && (!Number.isInteger(namSinh) || namSinh < 1940 || namSinh > 2020)) return { loi: "Năm sinh chưa đúng." };
  if (linkCv && !/^https?:\/\/\S+$/i.test(linkCv)) return { loi: "Link CV cần bắt đầu bằng http:// hoặc https://." };
  if (ngayPv && !ngay(ngayPv)) return { loi: "Ngày phỏng vấn chưa đúng." };
  if (ngayNhan && !ngay(ngayNhan)) return { loi: "Ngày nhận hồ sơ chưa đúng." };
  if (!(BUOC_UNG_VIEN as readonly string[]).includes(buoc)) return { loi: "Bước tuyển dụng không hợp lệ." };

  const du = {
    ho_ten: hoTen,
    email: email || null,
    dien_thoai: dienThoai || null,
    nam_sinh: namSinh,
    nguon: nguon || null,
    link_cv: linkCv || null,
    ghi_chu: ghiChu || null,
    ngay_phong_van: ngayPv || null,
    trang_thai: buoc,
  };
  const db = createAdminClient();
  const { data: moi, error } = id
    ? await db.from("ung_vien").update(du).eq("id", id).select("id").maybeSingle()
    : await db.from("ung_vien").insert({ ...du, tin_tuyen_dung_id: tinId, ...(ngayNhan ? { ngay_nhan_ho_so: ngayNhan } : {}) }).select("id").maybeSingle();
  if (error) return { loi: "Chưa lưu được ứng viên. Thử lại sau." };
  if (id) {
    // Ngày nhận việc: đặt khi chuyển sang "Nhận việc" (không ghi đè nếu đã có), xoá khi rời khỏi bước đó.
    const hom = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
    if (buoc === "Nhận việc") await db.from("ung_vien").update({ ngay_nhan_viec: hom }).eq("id", id).is("ngay_nhan_viec", null);
    else await db.from("ung_vien").update({ ngay_nhan_viec: null }).eq("id", id);
  }
  xong();
  return { ok: true, id: moi?.id ?? id };
}

export async function doiBuocUngVien(fd: FormData): Promise<KetQua> {
  if (!(await cho())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  const buoc = chuoi(fd, "trang_thai", 30);
  const lyDo = chuoi(fd, "ly_do", 300);
  if (!uuid(id) || !(BUOC_UNG_VIEN as readonly string[]).includes(buoc)) return { loi: "Dữ liệu không hợp lệ." };
  // Nhận việc ghi ngày để tính thời gian tuyển; rời khỏi "Nhận việc" thì xoá ngày; "Không đạt" ghi lý do nếu có.
  const hom = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const du: { trang_thai: string; ngay_nhan_viec?: string | null; ly_do_khong_dat?: string | null } = { trang_thai: buoc };
  if (buoc === "Nhận việc") du.ngay_nhan_viec = hom;
  else du.ngay_nhan_viec = null;
  if (buoc === "Không đạt") du.ly_do_khong_dat = lyDo || null;
  else du.ly_do_khong_dat = null;
  const { error } = await createAdminClient().from("ung_vien").update(du).eq("id", id);
  if (error) return { loi: "Chưa đổi được bước. Thử lại sau." };
  xong();
  return { ok: true };
}

export async function xoaUngVien(fd: FormData): Promise<KetQua> {
  if (!(await cho())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  if (!uuid(id)) return { loi: "Thiếu mã ứng viên." };
  const { error } = await createAdminClient().from("ung_vien").delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được ứng viên. Thử lại sau." };
  xong();
  return { ok: true };
}
