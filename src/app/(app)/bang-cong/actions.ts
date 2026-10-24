"use server";

import { revalidatePath } from "next/cache";
import { coVaiTro } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type KetQuaNgayLe = { loi?: string; ok?: boolean };
const KHONG_QUYEN: KetQuaNgayLe = { loi: "Chỉ Quản trị và Kỹ thuật mới sửa được ngày lễ." };
const chuoi = (fd: FormData, k: string, toiDa: number) => String(fd.get(k) ?? "").trim().slice(0, toiDa);
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const lamMoi = () => {
  revalidatePath("/bang-cong");
  revalidatePath("/luong");
};

/** Thêm một ngày lễ (hoặc đổi tên nếu ngày đó đã có). Tết Nguyên đán, Giỗ Tổ, ngày nghỉ bù do Hành chính nhân sự nhập theo thông báo của Nhà nước. */
export async function themNgayLe(fd: FormData): Promise<KetQuaNgayLe> {
  if (!(await coVaiTro(["admin", "ky_thuat"]))) return KHONG_QUYEN;
  const ngay = chuoi(fd, "ngay", 10);
  const ten = chuoi(fd, "ten", 80);
  if (!NGAY.test(ngay) || Number.isNaN(Date.parse(ngay))) return { loi: "Chọn ngày nghỉ lễ." };
  if (ten.length < 2) return { loi: "Nhập tên ngày lễ (ví dụ: Tết Nguyên đán, Giỗ Tổ Hùng Vương, nghỉ bù)." };
  const { error } = await createAdminClient().from("ngay_le").upsert({ ngay, ten });
  if (error) return { loi: "Chưa lưu được ngày lễ. Thử lại sau." };
  lamMoi();
  return { ok: true };
}

export async function xoaNgayLe(fd: FormData): Promise<KetQuaNgayLe> {
  if (!(await coVaiTro(["admin", "ky_thuat"]))) return KHONG_QUYEN;
  const ngay = chuoi(fd, "ngay", 10);
  if (!NGAY.test(ngay)) return { loi: "Thiếu ngày." };
  const { error } = await createAdminClient().from("ngay_le").delete().eq("ngay", ngay);
  if (error) return { loi: "Chưa xoá được ngày lễ. Thử lại sau." };
  lamMoi();
  return { ok: true };
}
