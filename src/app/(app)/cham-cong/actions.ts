"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layHoSoChamCong, ngayHomNayHCM, gioHienTaiHCM } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { GIO_COI_LA_DI_MUON } from "@/lib/don-tu";


const KHONG_CAN = "Chức vụ của bạn không phải chấm công.";

/** Mã hồ sơ của người đang đăng nhập; `loi` khi chưa gắn hồ sơ hoặc thuộc nhóm không phải chấm công. */
async function nhanVienIdCuaToi(): Promise<{ id: string } | { loi: string }> {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) return { loi: "Bạn chưa đăng nhập." };
  const hs = await layHoSoChamCong(nguoiDung.id, nguoiDung.vaiTro);
  if (!hs.canChamCong) return { loi: KHONG_CAN };
  if (!hs.nhanVienId) return { loi: "Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào." };
  return { id: hs.nhanVienId };
}

export async function chamCongVao() {
  const ket = await nhanVienIdCuaToi();
  if ("loi" in ket) return { loi: ket.loi };
  const nhanVienId = ket.id;

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
  const ket = await nhanVienIdCuaToi();
  if ("loi" in ket) return { loi: ket.loi };
  const nhanVienId = ket.id;

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
