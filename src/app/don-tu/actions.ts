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

export async function duyetDonTu(formData: FormData) {
  const nguoiDuyet = await yeuCauVaiTro(["admin", "ky_thuat"]);
  const id = String(formData.get("id") || "");
  const hanhDong = String(formData.get("hanh_dong") || "");
  if (!id || (hanhDong !== "duyet" && hanhDong !== "tu_choi")) return;

  const nguoiDuyetNhanVienId = await layNhanVienIdTheoUser(nguoiDuyet.id);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("don_tu")
    .update({
      trang_thai: hanhDong === "duyet" ? "Đã duyệt" : "Từ chối",
      nguoi_duyet_id: nguoiDuyetNhanVienId,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/don-tu");
  revalidatePath("/dashboard");
}
