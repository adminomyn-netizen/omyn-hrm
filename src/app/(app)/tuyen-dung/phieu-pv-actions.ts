"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbHr } from "@/lib/hr-db";
import { KET_LUAN_PV, VONG_PV, ghepTieuChi } from "@/lib/phieu-pv";

export type KetQuaPv = { loi?: string; ok?: boolean };

const KHONG_QUYEN: KetQuaPv = { loi: "Bạn không có quyền thực hiện thao tác này." };
const chuoi = (fd: FormData, k: string, toiDa = 500) => String(fd.get(k) ?? "").trim().slice(0, toiDa);
const ngay = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? s : null);
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

/** Chỉ quản trị / kỹ thuật (nhân sự nhập phiếu hộ người phỏng vấn). */
async function nguoiNhap() {
  const nd = await layNguoiDungHienTai();
  return nd && !nd.phaiDoiMatKhau && (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") ? nd : null;
}

/** Thêm hoặc sửa phiếu đánh giá phỏng vấn (có `id` = sửa). Không tự đổi bước của ứng viên. */
export async function luuPhieuPv(fd: FormData): Promise<KetQuaPv> {
  const nd = await nguoiNhap();
  if (!nd) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  const uvId = chuoi(fd, "ung_vien_id", 40);
  const vong = chuoi(fd, "vong", 30);
  const nguoiPv = chuoi(fd, "nguoi_phong_van_id", 40);
  const ngayPv = chuoi(fd, "ngay", 10);
  const luong = chuoi(fd, "luong_mong_muon", 120);
  const ngayDi = chuoi(fd, "ngay_co_the_di_lam", 10);
  const ketLuan = chuoi(fd, "ket_luan", 20);
  if (!uuid(uvId)) return { loi: "Thiếu ứng viên." };
  if (id && !uuid(id)) return { loi: "Phiếu không hợp lệ." };
  if (!(VONG_PV as readonly string[]).includes(vong)) return { loi: "Chọn vòng phỏng vấn." };
  if (!(KET_LUAN_PV as readonly string[]).includes(ketLuan)) return { loi: "Chọn kết luận của người phỏng vấn." };
  if (nguoiPv && !uuid(nguoiPv)) return { loi: "Người phỏng vấn không hợp lệ." };
  if (!ngay(ngayPv)) return { loi: "Ngày phỏng vấn chưa đúng." };
  if (ngayDi && !ngay(ngayDi)) return { loi: "Ngày có thể đi làm chưa đúng." };
  const { tc, loi } = ghepTieuChi((i) => chuoi(fd, `d${i}`, 2));
  if (loi || !tc) return { loi };

  const du = {
    vong, nguoi_phong_van_id: nguoiPv || null, ngay: ngayPv, tieu_chi: tc,
    luong_mong_muon: luong || null, ngay_co_the_di_lam: ngayDi || null,
    diem_manh: chuoi(fd, "diem_manh", 1500) || null, diem_can_luu_y: chuoi(fd, "diem_can_luu_y", 1500) || null,
    nhan_xet: chuoi(fd, "nhan_xet", 3000) || null, ket_luan: ketLuan, cap_nhat_luc: new Date().toISOString(),
  };
  const db = dbHr();
  const { data: uv } = await db.from("ung_vien").select("id, ho_ten").eq("id", uvId).maybeSingle();
  if (!uv) return { loi: "Không tìm thấy ứng viên." };
  let truoc: unknown = null;
  let phieuId = id;
  if (id) {
    const { data: cu } = await db.from("danh_gia_phong_van").select("*").eq("id", id).eq("ung_vien_id", uvId).maybeSingle();
    if (!cu) return { loi: "Không tìm thấy phiếu." };
    truoc = cu;
    const { error } = await db.from("danh_gia_phong_van").update(du).eq("id", id);
    if (error) return { loi: "Chưa lưu được phiếu. Thử lại sau." };
  } else {
    const { data: moi, error } = await db.from("danh_gia_phong_van").insert({ ...du, ung_vien_id: uvId, tao_boi: nd.id }).select("id").maybeSingle();
    if (error || !moi) return { loi: "Chưa lưu được phiếu. Thử lại sau." };
    phieuId = moi.id;
  }
  await createAdminClient().from("nhat_ky").insert({
    nguoi_thuc_hien: nd.id, bang: "danh_gia_phong_van", hanh_dong: id ? "SUA" : "TAO", ban_ghi: phieuId,
    truoc: truoc as never, sau: { ung_vien: uv.ho_ten, ...du, nguoi_nhap: nd.hoTen } as never,
  });
  revalidatePath("/tuyen-dung");
  return { ok: true };
}

export async function xoaPhieuPv(fd: FormData): Promise<KetQuaPv> {
  const nd = await nguoiNhap();
  if (!nd) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  if (!uuid(id)) return { loi: "Phiếu không hợp lệ." };
  const db = dbHr();
  const { data: cu } = await db.from("danh_gia_phong_van").select("*").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy phiếu." };
  const { error } = await db.from("danh_gia_phong_van").delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được phiếu. Thử lại sau." };
  await createAdminClient().from("nhat_ky").insert({ nguoi_thuc_hien: nd.id, bang: "danh_gia_phong_van", hanh_dong: "XOA", ban_ghi: id, truoc: cu as never, sau: { nguoi_xoa: nd.hoTen } as never });
  revalidatePath("/tuyen-dung");
  return { ok: true };
}
