"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layNhanVienIdTheoUser, ngayHomNayHCM, gioHienTaiHCM } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

const GIO_COI_LA_DI_MUON = "08:15:00";

async function nhanVienIdCuaToi() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) return null;
  return layNhanVienIdTheoUser(nguoiDung.id);
}

export async function chamCongVao() {
  const nhanVienId = await nhanVienIdCuaToi();
  if (!nhanVienId) return { loi: "Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào." };

  const gio = gioHienTaiHCM();
  const supabase = createAdminClient();
  const { error } = await supabase.from("cham_cong").upsert(
    {
      nhan_vien_id: nhanVienId,
      ngay: ngayHomNayHCM(),
      gio_vao: gio,
      trang_thai: gio <= GIO_COI_LA_DI_MUON ? "Đúng giờ" : "Đi muộn",
    },
    { onConflict: "nhan_vien_id,ngay" },
  );
  if (error) return { loi: error.message };

  revalidatePath("/cham-cong");
  return {};
}

export async function chamCongRa() {
  const nhanVienId = await nhanVienIdCuaToi();
  if (!nhanVienId) return { loi: "Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào." };

  const supabase = createAdminClient();
  const homNay = ngayHomNayHCM();

  const { data: daCo } = await supabase
    .from("cham_cong")
    .select("id")
    .eq("nhan_vien_id", nhanVienId)
    .eq("ngay", homNay)
    .maybeSingle();
  if (!daCo) return { loi: "Bạn chưa chấm công vào hôm nay." };

  const { error } = await supabase
    .from("cham_cong")
    .update({ gio_ra: gioHienTaiHCM() })
    .eq("nhan_vien_id", nhanVienId)
    .eq("ngay", homNay);
  if (error) return { loi: error.message };

  revalidatePath("/cham-cong");
  return {};
}
