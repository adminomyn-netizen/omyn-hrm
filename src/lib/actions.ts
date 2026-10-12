"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function dangXuat() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/dang-nhap");
}

export async function themNhanVien(_truoc: { loi?: string } | undefined, formData: FormData) {
  const hoTen = String(formData.get("ho_ten") || "").trim();
  const chucDanh = String(formData.get("chuc_danh") || "").trim();
  const khoiId = String(formData.get("khoi_id") || "");
  const email = String(formData.get("email") || "").trim();
  const ngayVaoLam = String(formData.get("ngay_vao_lam") || "");
  const trangThai = String(formData.get("trang_thai") || "Đang làm");
  const maNhanVien = String(formData.get("ma_nhan_vien") || "").trim();

  if (!hoTen || !khoiId || !ngayVaoLam) {
    return { loi: "Thiếu họ tên, khối hoặc ngày vào làm." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("nhan_vien").insert({
    ma_nhan_vien: maNhanVien || null,
    ho_ten: hoTen,
    chuc_danh: chucDanh || null,
    khoi_id: khoiId,
    email: email || null,
    ngay_vao_lam: ngayVaoLam,
    trang_thai: trangThai as "Đang làm" | "Thử việc" | "Đã nghỉ",
  });

  if (error) {
    return { loi: error.message.includes("duplicate") ? "Mã nhân viên hoặc email đã tồn tại." : error.message };
  }

  revalidatePath("/nhan-su");
  revalidatePath("/dashboard");
  redirect("/nhan-su");
}
