"use server";

import { revalidatePath } from "next/cache";
import { coVaiTro, layNguoiDungHienTai } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { layNhanVienIdTheoUser } from "@/lib/data";
import { coQuyenGuiYeuCau } from "@/lib/data-tuyen-dung";
import { KENH_DANG, LOAI_TUYEN, chuyenYeuCauHopLe } from "@/lib/tuyen-dung";

export type KetQua = { loi?: string; ok?: boolean };
const KHONG_QUYEN: KetQua = { loi: "Bạn không có quyền thực hiện thao tác này." };

const chuoi = (fd: FormData, k: string, toiDa = 500) => String(fd.get(k) ?? "").trim().slice(0, toiDa);
const ngay = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? s : null);
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const lamMoi = () => { revalidatePath("/tuyen-dung"); revalidatePath("/yeu-cau-tuyen-dung"); revalidatePath("/tong-hop"); revalidatePath("/dashboard"); };

const quanTri = () => coVaiTro(["admin", "ky_thuat"]);

export async function guiYeuCau(fd: FormData): Promise<KetQua> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet") return KHONG_QUYEN;
  const { ok, nhanVienId } = await coQuyenGuiYeuCau(nd.id, nd.vaiTro);
  if (!ok) return { loi: "Chỉ trưởng bộ phận (người quản lý ít nhất một nhân viên) hoặc Quản trị mới gửi được yêu cầu tuyển dụng." };

  const viTri = chuoi(fd, "vi_tri", 120);
  const khoiId = chuoi(fd, "khoi_id", 40);
  const soLuong = Number(chuoi(fd, "so_luong", 4));
  const loai = chuoi(fd, "loai_tuyen", 30);
  const han = chuoi(fd, "han_can_nhan_su", 10);
  if (viTri.length < 2) return { loi: "Nhập vị trí cần tuyển." };
  if (!uuid(khoiId)) return { loi: "Chọn bộ phận cần người." };
  if (!Number.isInteger(soLuong) || soLuong < 1 || soLuong > 99) return { loi: "Số lượng cần từ 1 đến 99." };
  if (!(LOAI_TUYEN as readonly string[]).includes(loai)) return { loi: "Chọn loại tuyển dụng." };
  if (han && !ngay(han)) return { loi: "Ngày cần nhân sự chưa đúng." };
  if (loai === "Thay thế" && chuoi(fd, "thay_the_cho", 120).length < 2) return { loi: "Tuyển thay thế thì ghi rõ thay cho ai." };

  const { error } = await createAdminClient().from("yeu_cau_tuyen_dung").insert({
    vi_tri: viTri, khoi_id: khoiId, so_luong: soLuong, loai_tuyen: loai,
    thay_the_cho: chuoi(fd, "thay_the_cho", 120) || null,
    muc_luong: chuoi(fd, "muc_luong", 120) || null,
    mo_ta_ngan: chuoi(fd, "mo_ta_ngan", 2000) || null,
    yeu_cau_chinh: chuoi(fd, "yeu_cau_chinh", 2000) || null,
    han_can_nhan_su: han || null,
    nguoi_yeu_cau_id: nhanVienId,
    nguoi_yeu_cau_ten: nd.hoTen,
  });
  if (error) return { loi: "Chưa gửi được yêu cầu. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

/** HCNS đổi trạng thái yêu cầu: tiếp nhận / từ chối (bắt buộc ghi lý do) / huỷ / hoàn thành. Chỉ đi tiến, không xoá. */
export async function doiTrangThaiYeuCau(fd: FormData): Promise<KetQua> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !(await quanTri())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  const den = chuoi(fd, "den", 30);
  const lyDo = chuoi(fd, "ly_do", 500);
  if (!uuid(id)) return { loi: "Thiếu mã yêu cầu." };
  const db = createAdminClient();
  const { data: yc } = await db.from("yeu_cau_tuyen_dung").select("trang_thai").eq("id", id).maybeSingle();
  if (!yc) return { loi: "Không tìm thấy yêu cầu." };
  if (!chuyenYeuCauHopLe(yc.trang_thai, den)) return { loi: `Yêu cầu đang "${yc.trang_thai}", không chuyển sang "${den}" được.` };
  if ((den === "Từ chối" || den === "Huỷ") && lyDo.length < 3) return { loi: "Ghi lý do (từ 3 ký tự) để người gửi biết." };
  const nhanVienId = await layNhanVienIdTheoUser(nd.id);
  const capNhat: TablesUpdate<"yeu_cau_tuyen_dung"> = { trang_thai: den, cap_nhat_luc: new Date().toISOString() };
  if (den === "Đã tiếp nhận") { capNhat.nguoi_tiep_nhan_id = nhanVienId; capNhat.ngay_tiep_nhan = new Date().toISOString(); }
  if (den === "Từ chối" || den === "Huỷ") capNhat.ly_do_tu_choi = lyDo;
  if (den === "Hoàn thành") capNhat.ngay_hoan_thanh = new Date().toISOString();
  const { error } = await db.from("yeu_cau_tuyen_dung").update(capNhat).eq("id", id).eq("trang_thai", yc.trang_thai);
  if (error) return { loi: "Chưa đổi được trạng thái. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

/** Tạo tin tuyển dụng từ một yêu cầu đã tiếp nhận (sao vị trí, bộ phận, số lượng, mô tả) và đẩy yêu cầu sang "Đang đăng tin". */
export async function taoTinTuYeuCau(fd: FormData): Promise<KetQua & { tinId?: string }> {
  if (!(await quanTri())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  if (!uuid(id)) return { loi: "Thiếu mã yêu cầu." };
  const db = createAdminClient();
  const { data: yc } = await db.from("yeu_cau_tuyen_dung").select("*").eq("id", id).maybeSingle();
  if (!yc) return { loi: "Không tìm thấy yêu cầu." };
  if (yc.trang_thai !== "Đã tiếp nhận" && yc.trang_thai !== "Đang đăng tin") return { loi: "Tiếp nhận yêu cầu trước rồi mới tạo tin." };
  const moTa = [yc.mo_ta_ngan, yc.yeu_cau_chinh && `Yêu cầu: ${yc.yeu_cau_chinh}`, yc.muc_luong && `Mức lương: ${yc.muc_luong}`].filter(Boolean).join("\n\n");
  const { data: tin, error } = await db.from("tin_tuyen_dung").insert({
    vi_tri: yc.vi_tri, khoi_id: yc.khoi_id, so_luong_can: yc.so_luong, mo_ta: moTa || null, han_nop: yc.han_can_nhan_su, yeu_cau_id: yc.id,
  }).select("id").single();
  if (error || !tin) return { loi: "Chưa tạo được tin. Thử lại sau." };
  if (yc.trang_thai === "Đã tiếp nhận") await db.from("yeu_cau_tuyen_dung").update({ trang_thai: "Đang đăng tin", cap_nhat_luc: new Date().toISOString() }).eq("id", id);
  lamMoi();
  return { ok: true, tinId: tin.id };
}

/** Ghi lại một lần đăng tin lên một kênh (link bài + chi phí). Không xoá được, chỉ "gỡ" để giữ số chi phí đã tiêu. */
export async function ghiKenhDang(fd: FormData): Promise<KetQua> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !(await quanTri())) return KHONG_QUYEN;
  const tinId = chuoi(fd, "tin_id", 40);
  const kenh = chuoi(fd, "kenh", 30);
  const link = chuoi(fd, "link_bai", 500);
  const ngayDang = chuoi(fd, "ngay_dang", 10);
  const chiPhi = Number(chuoi(fd, "chi_phi", 20).replace(/[^\d]/g, "") || "0");
  if (!uuid(tinId)) return { loi: "Thiếu tin tuyển dụng." };
  if (!(KENH_DANG as readonly string[]).includes(kenh)) return { loi: "Chọn kênh đăng." };
  if (link && !/^https?:\/\/\S+$/i.test(link)) return { loi: "Link bài cần bắt đầu bằng http:// hoặc https://." };
  if (ngayDang && !ngay(ngayDang)) return { loi: "Ngày đăng chưa đúng." };
  if (!Number.isInteger(chiPhi) || chiPhi < 0 || chiPhi > 10_000_000_000) return { loi: "Chi phí là số nguyên đồng, không âm." };
  const nhanVienId = await layNhanVienIdTheoUser(nd.id);
  const { error } = await createAdminClient().from("dang_tin_kenh").insert({
    tin_tuyen_dung_id: tinId, kenh, link_bai: link || null, ngay_dang: ngayDang || undefined, chi_phi: chiPhi, ghi_chu: chuoi(fd, "ghi_chu", 500) || null, nguoi_dang_id: nhanVienId,
  });
  if (error) return { loi: "Chưa ghi được lần đăng. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

export async function goKenhDang(fd: FormData): Promise<KetQua> {
  if (!(await quanTri())) return KHONG_QUYEN;
  const id = chuoi(fd, "id", 40);
  if (!uuid(id)) return { loi: "Thiếu mã." };
  const { error } = await createAdminClient().from("dang_tin_kenh").update({ trang_thai: "Đã gỡ" }).eq("id", id);
  if (error) return { loi: "Chưa gỡ được. Thử lại sau." };
  lamMoi();
  return { ok: true };
}
