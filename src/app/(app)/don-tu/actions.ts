"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai, yeuCauVaiTro } from "@/lib/auth";
import { layNhanVienIdTheoUser } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

const LOAI_HOP_LE = ["Nghỉ phép năm", "Nghỉ ốm", "Tạm ứng lương", "Công tác"] as const;

// Xem ghi chú đầy đủ trong src/lib/actions.ts: KHÔNG được gọi từ một <form>
// có nổ sự kiện submit thật — chỉ gọi từ onClick của nút type="button".
export type KetQuaDonTu = { loi?: string; ok?: boolean };

export async function taoDonTu(formData: FormData): Promise<KetQuaDonTu> {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) redirect("/dang-nhap");

  const nhanVienId = await layNhanVienIdTheoUser(nguoiDung.id);
  if (!nhanVienId) {
    return { loi: "Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào, không thể nộp đơn." };
  }

  const loai = String(formData.get("loai") || "");
  const tuNgay = String(formData.get("tu_ngay") || "");
  const denNgay = String(formData.get("den_ngay") || "");
  const lyDo = String(formData.get("ly_do") || "").trim();

  if (!LOAI_HOP_LE.includes(loai as (typeof LOAI_HOP_LE)[number])) {
    return { loi: "Loại đơn không hợp lệ." };
  }
  if (!tuNgay || !denNgay) return { loi: "Thiếu từ ngày hoặc đến ngày." };
  if (denNgay < tuNgay) return { loi: "Đến ngày phải sau hoặc bằng từ ngày." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("don_tu").insert({
    nhan_vien_id: nhanVienId,
    loai,
    tu_ngay: tuNgay,
    den_ngay: denNgay,
    ly_do: lyDo || null,
    trang_thai: "Chờ duyệt",
  });
  if (error) return { loi: error.message };

  revalidatePath("/don-tu");
  return { ok: true };
}

/** Duyệt/từ chối đơn. Chỉ đổi được đơn còn "Chờ duyệt" (không lật quyết định cũ) và không tự duyệt đơn của chính mình. */
export async function duyetDonTu(formData: FormData): Promise<KetQuaDonTu> {
  const nguoiDuyet = await yeuCauVaiTro(["admin", "ky_thuat"]);
  const id = String(formData.get("id") || "");
  const hanhDong = String(formData.get("hanh_dong") || "");
  if (!id || (hanhDong !== "duyet" && hanhDong !== "tu_choi")) return { loi: "Dữ liệu không hợp lệ." };

  const supabase = createAdminClient();
  const nguoiDuyetNhanVienId = await layNhanVienIdTheoUser(nguoiDuyet.id);
  const { data: don } = await supabase.from("don_tu").select("id, nhan_vien_id, trang_thai").eq("id", id).maybeSingle();
  if (!don) return { loi: "Không tìm thấy đơn." };
  if (don.trang_thai !== "Chờ duyệt") return { loi: "Đơn này đã được xử lý rồi." };
  if (nguoiDuyetNhanVienId && don.nhan_vien_id === nguoiDuyetNhanVienId) return { loi: "Bạn không tự duyệt đơn của chính mình." };

  const { data: capNhat, error } = await supabase
    .from("don_tu")
    .update({ trang_thai: hanhDong === "duyet" ? "Đã duyệt" : "Từ chối", nguoi_duyet_id: nguoiDuyetNhanVienId })
    .eq("id", id)
    .eq("trang_thai", "Chờ duyệt")
    .select("id");
  if (error) return { loi: "Chưa lưu được quyết định. Thử lại sau." };
  if (!capNhat || capNhat.length === 0) return { loi: "Đơn này vừa được người khác xử lý." };

  revalidatePath("/don-tu");
  revalidatePath("/dashboard");
  return { ok: true };
}
