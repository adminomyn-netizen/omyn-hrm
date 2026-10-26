"use server";

import { revalidatePath } from "next/cache";
import { coVaiTro, layNguoiDungHienTai } from "@/lib/auth";
import { layHoSoChamCong, ngayHomNayHCM, gioHienTaiHCM, layViTriChamCong } from "@/lib/data";
import { kiemViTri, khoangCachMet, toaDoHopLe } from "@/lib/dinh-vi";
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

/** Vị trí gửi từ trình duyệt (GPS của điện thoại/máy tính). Quá bán kính quanh văn phòng thì không cho chấm. */
export async function chamCongVao(toaDo: unknown) {
  const ket = await nhanVienIdCuaToi();
  if ("loi" in ket) return { loi: ket.loi };
  const nhanVienId = ket.id;
  const vt = kiemViTri(await layViTriChamCong(), toaDo);
  if (!vt.ok) return { loi: vt.loi, ngoaiVung: !!vt.ngoaiVung };

  const gio = gioHienTaiHCM();
  const supabase = createAdminClient();
  const { error } = await supabase.from("cham_cong").upsert(
    {
      nhan_vien_id: nhanVienId,
      ngay: ngayHomNayHCM(),
      gio_vao: gio,
      trang_thai: gio <= GIO_COI_LA_DI_MUON ? "Đúng giờ" : "Đi muộn",
      khoang_cach_vao_m: vt.khoangCachM,
    },
    { onConflict: "nhan_vien_id,ngay" },
  );
  if (error) return { loi: error.message };

  revalidatePath("/cham-cong");
  return {};
}

export async function chamCongRa(toaDo: unknown) {
  const ket = await nhanVienIdCuaToi();
  if ("loi" in ket) return { loi: ket.loi };
  const nhanVienId = ket.id;
  const vt = kiemViTri(await layViTriChamCong(), toaDo);
  if (!vt.ok) return { loi: vt.loi, ngoaiVung: !!vt.ngoaiVung };

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
    .update({ gio_ra: gioHienTaiHCM(), khoang_cach_ra_m: vt.khoangCachM })
    .eq("nhan_vien_id", nhanVienId)
    .eq("ngay", homNay);
  if (error) return { loi: error.message };

  revalidatePath("/cham-cong");
  return {};
}

/** Chốt vị trí văn phòng = chỗ người bấm đang đứng (Quản trị/Kỹ thuật). Cần GPS đủ chính xác (≤ 50 m); chốt xong giữ nguyên bán kính đang cài (hiện 300 m). */
export async function datViTriChamCong(toaDo: unknown): Promise<{ ok?: true; loi?: string }> {
  if (!(await coVaiTro(["admin", "ky_thuat"]))) return { loi: "Chỉ Quản trị và Kỹ thuật mới đặt được vị trí chấm công." };
  if (!toaDoHopLe(toaDo)) return { loi: "Chưa lấy được vị trí. Bật định vị (GPS) cho trình duyệt rồi thử lại." };
  if (toaDo.doChinhXac === null || toaDo.doChinhXac > 50) return { loi: `Định vị sai lệch ${toaDo.doChinhXac === null ? "chưa rõ" : `khoảng ${Math.round(toaDo.doChinhXac)} m`}, chưa đủ chính xác để chốt vị trí (cần ≤ 50 m). Ra chỗ thoáng hoặc bật "vị trí chính xác" rồi thử lại.` };
  const nguoi = await layNguoiDungHienTai();
  const { error } = await createAdminClient().from("vi_tri_cham_cong").update({ vi_do: toaDo.viDo, kinh_do: toaDo.kinhDo, da_xac_nhan: true, cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: nguoi?.id ?? null }).eq("id", 1);
  if (error) return { loi: "Chưa lưu được vị trí. Thử lại sau." };
  revalidatePath("/cham-cong");
  return { ok: true };
}

/** Tạm tắt khoá vị trí (ai cũng chấm công được ở mọi nơi) cho tới khi đặt lại vị trí. */
export async function tatKhoaViTri(): Promise<{ ok?: true; loi?: string }> {
  if (!(await coVaiTro(["admin", "ky_thuat"]))) return { loi: "Chỉ Quản trị và Kỹ thuật mới tắt được khoá vị trí." };
  const nguoi = await layNguoiDungHienTai();
  const { error } = await createAdminClient().from("vi_tri_cham_cong").update({ da_xac_nhan: false, cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: nguoi?.id ?? null }).eq("id", 1);
  if (error) return { loi: "Chưa lưu được. Thử lại sau." };
  revalidatePath("/cham-cong");
  return { ok: true };
}

/** Khoảng cách (m) từ một toạ độ tới văn phòng đang lưu — để Quản trị xem trước khi chốt vị trí mới. */
export async function khoangCachToiVanPhong(toaDo: unknown): Promise<{ met?: number; loi?: string }> {
  if (!(await coVaiTro(["admin", "ky_thuat"]))) return { loi: "Không có quyền." };
  if (!toaDoHopLe(toaDo)) return { loi: "Toạ độ không hợp lệ." };
  const cau = await layViTriChamCong();
  return { met: Math.round(khoangCachMet(cau, toaDo)) };
}
