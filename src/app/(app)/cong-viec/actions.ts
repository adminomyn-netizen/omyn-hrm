"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { apDungGhiNhan, trangThaiSauGhiNhan } from "@/lib/cong-viec";
import { dbHr } from "@/lib/hr-db";
import { homNayHcm } from "@/lib/kpi-data";

export type KetQuaCv = { loi?: string; ok?: boolean };
const UUID = /^[0-9a-f-]{36}$/i;
const UU_TIEN = ["Cao", "Trung bình", "Thấp"],
  LOAI = ["Hằng ngày", "Vận hành"],
  LAP = ["Không", "Hằng ngày"];

/** Người được thao tác công việc của `nguoiLamId`: chính họ, trưởng phòng trực tiếp của họ, hoặc Quản trị/Kỹ thuật. Kiểm lại ở máy chủ cho MỌI thao tác. */
async function duocThaoTac(nguoiLamId: string) {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.vaiTro === "cho_duyet") return null;
  if (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat")
    return { nd, toiId: null as string | null };
  const db = dbHr();
  const { data: toi } = await db
    .from("nhan_vien")
    .select("id")
    .eq("user_id", nd.id)
    .maybeSingle();
  if (!toi) return null;
  if (toi.id === nguoiLamId) return { nd, toiId: toi.id as string };
  const { data: cap } = await db
    .from("nhan_vien")
    .select("id")
    .eq("id", nguoiLamId)
    .eq("quan_ly_id", toi.id)
    .maybeSingle();
  return cap ? { nd, toiId: toi.id as string } : null;
}
const KHONG_QUYEN: KetQuaCv = { loi: "Bạn không có quyền với việc này." };
const lamMoi = () => {
  revalidatePath("/cong-viec");
};

export async function luuCongViec(fd: FormData): Promise<KetQuaCv> {
  const id = String(fd.get("id") ?? "");
  const nguoiLamId = String(fd.get("nguoi_lam_id") ?? "");
  const tieuDe = String(fd.get("tieu_de") ?? "")
    .trim()
    .slice(0, 200);
  if (!tieuDe) return { loi: "Nhập tên việc." };
  if (!UUID.test(nguoiLamId) || (id && !UUID.test(id)))
    return { loi: "Chọn người làm." };
  const uuTien = String(fd.get("uu_tien") ?? "Trung bình"),
    loai = String(fd.get("loai") ?? "Vận hành"),
    lap = String(fd.get("lap_lai") ?? "Không");
  if (!UU_TIEN.includes(uuTien) || !LOAI.includes(loai) || !LAP.includes(lap))
    return { loi: "Có ô chưa hợp lệ." };
  const muc = Math.trunc(
    Number(String(fd.get("muc_tieu_so") ?? "1").replace(/[.,\s]/g, "")),
  );
  if (!Number.isFinite(muc) || muc < 1 || muc > 100000)
    return { loi: "Số lượng cần làm phải từ 1 đến 100.000." };
  const han = String(fd.get("han") ?? "");
  if (han && !/^\d{4}-\d{2}-\d{2}$/.test(han))
    return { loi: "Hạn chưa đúng ngày." };
  const quyen = await duocThaoTac(nguoiLamId);
  if (!quyen) return KHONG_QUYEN;
  const db = dbHr();
  if (id) {
    // đổi người làm sang người khác cũng phải trong quyền
    const { data: cu } = await db
      .from("cong_viec")
      .select("nguoi_lam_id")
      .eq("id", id)
      .maybeSingle();
    if (
      !cu ||
      (cu.nguoi_lam_id !== nguoiLamId && !(await duocThaoTac(cu.nguoi_lam_id)))
    )
      return KHONG_QUYEN;
  }
  const dong = {
    tieu_de: tieuDe,
    mo_ta:
      String(fd.get("mo_ta") ?? "")
        .trim()
        .slice(0, 2000) || null,
    loai,
    nguoi_lam_id: nguoiLamId,
    han: han || null,
    uu_tien: uuTien,
    muc_tieu_so: muc,
    don_vi: String(fd.get("don_vi") ?? "")
      .trim()
      .slice(0, 30),
    lap_lai: lap,
  };
  const { error } = id
    ? await db.from("cong_viec").update(dong).eq("id", id)
    : await db
        .from("cong_viec")
        .insert({ ...dong, nguoi_giao_id: quyen.toiId });
  if (error) return { loi: "Chưa lưu được. Kiểm tra lại các ô rồi thử lại." };
  lamMoi();
  return { ok: true };
}

/** Ghi nhận thêm (hoặc bớt) số lượng đã làm. Việc lặp hằng ngày ghi cho HÔM NAY; việc một lần cộng dồn và tự Hoàn thành khi đủ. */
export async function ghiNhanCongViec(
  id: string,
  them: number,
): Promise<KetQuaCv> {
  if (!UUID.test(id) || !Number.isFinite(them))
    return { loi: "Việc không hợp lệ." };
  const db = dbHr();
  const { data: v } = await db
    .from("cong_viec")
    .select("nguoi_lam_id, lap_lai, muc_tieu_so, da_lam_so, trang_thai")
    .eq("id", id)
    .maybeSingle();
  if (!v) return { loi: "Không tìm thấy việc." };
  if (!(await duocThaoTac(v.nguoi_lam_id))) return KHONG_QUYEN;
  if (v.lap_lai === "Hằng ngày") {
    const ngay = homNayHcm();
    const { data: h } = await db
      .from("cong_viec_ngay")
      .select("da_lam")
      .eq("cong_viec_id", id)
      .eq("ngay", ngay)
      .maybeSingle();
    const { error } = await db
      .from("cong_viec_ngay")
      .upsert(
        {
          cong_viec_id: id,
          ngay,
          da_lam: apDungGhiNhan(Number(h?.da_lam ?? 0), them),
          cap_nhat_luc: new Date().toISOString(),
        },
        { onConflict: "cong_viec_id,ngay" },
      );
    if (error) return { loi: "Chưa ghi được." };
  } else {
    const moi = apDungGhiNhan(v.da_lam_so, them),
      tt = trangThaiSauGhiNhan(v.trang_thai, moi, v.muc_tieu_so);
    const { error } = await db
      .from("cong_viec")
      .update({
        da_lam_so: moi,
        trang_thai: tt,
        hoan_thanh_luc: tt === "Hoàn thành" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { loi: "Chưa ghi được." };
  }
  lamMoi();
  return { ok: true };
}

export async function doiTrangThaiCongViec(
  id: string,
  trangThai: "Chưa làm" | "Hoàn thành" | "Huỷ",
): Promise<KetQuaCv> {
  if (!UUID.test(id) || !["Chưa làm", "Hoàn thành", "Huỷ"].includes(trangThai))
    return { loi: "Việc không hợp lệ." };
  const db = dbHr();
  const { data: v } = await db
    .from("cong_viec")
    .select("nguoi_lam_id, muc_tieu_so, lap_lai")
    .eq("id", id)
    .maybeSingle();
  if (!v) return { loi: "Không tìm thấy việc." };
  if (!(await duocThaoTac(v.nguoi_lam_id))) return KHONG_QUYEN;
  const cap =
    trangThai === "Hoàn thành" && v.lap_lai === "Không"
      ? { da_lam_so: v.muc_tieu_so }
      : {};
  const { error } = await db
    .from("cong_viec")
    .update({
      trang_thai: trangThai,
      hoan_thanh_luc:
        trangThai === "Hoàn thành" ? new Date().toISOString() : null,
      ...cap,
    })
    .eq("id", id);
  if (error) return { loi: "Chưa lưu được." };
  lamMoi();
  return { ok: true };
}

export async function xoaCongViec(id: string): Promise<KetQuaCv> {
  if (!UUID.test(id)) return { loi: "Việc không hợp lệ." };
  const db = dbHr();
  const { data: v } = await db
    .from("cong_viec")
    .select("nguoi_lam_id")
    .eq("id", id)
    .maybeSingle();
  if (!v) return { ok: true };
  if (!(await duocThaoTac(v.nguoi_lam_id))) return KHONG_QUYEN;
  const { error } = await db.from("cong_viec").delete().eq("id", id);
  if (error) return { loi: "Chưa xoá được." };
  lamMoi();
  return { ok: true };
}
