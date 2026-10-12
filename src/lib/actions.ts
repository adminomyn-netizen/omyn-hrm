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

function docFormNhanVien(formData: FormData) {
  return {
    maNhanVien: String(formData.get("ma_nhan_vien") || "").trim(),
    hoTen: String(formData.get("ho_ten") || "").trim(),
    chucDanh: String(formData.get("chuc_danh") || "").trim(),
    khoiId: String(formData.get("khoi_id") || ""),
    email: String(formData.get("email") || "").trim(),
    ngayVaoLam: String(formData.get("ngay_vao_lam") || ""),
    trangThai: String(formData.get("trang_thai") || "Đang làm") as "Đang làm" | "Thử việc" | "Đã nghỉ",
  };
}

function thongBaoLoiNhanVien(error: { message: string }) {
  return error.message.includes("duplicate") ? "Mã nhân viên hoặc email đã tồn tại." : error.message;
}

// LƯU Ý — bắt được qua rất nhiều vòng kiểm chứng thật bằng trình duyệt
// (không phải giả định): trên trang đã đăng nhập (qua middleware), hễ một
// <form> THẬT nổ ra sự kiện submit (dù gắn action={serverAction}, dù
// onSubmit có preventDefault(), dù FormData hoàn toàn không đọc từ DOM) thì
// Server Action gọi theo sau bị âm thầm không chạy tới thân hàm, và trang
// bật về /dang-nhap như vừa mất đăng nhập — trên đúng bản Next.js 16 này.
// Gọi action thẳng từ onClick của một nút type="button" (không phải
// type="submit", không có sự kiện submit nào nổ ra) thì chạy đúng — y như
// nút Duyệt/Từ chối/Xóa đã dùng cách này từ đầu. Nên: các <form> có mutate
// dữ liệu dùng <form ref={...}> chỉ để gom field qua new FormData(ref.current),
// KHÔNG bao giờ submit — nút bấm luôn type="button" (xem FormNhanVien/FormDonTu).
export type KetQuaNhanVien = { loi?: string; ok?: boolean };

export async function themNhanVien(formData: FormData): Promise<KetQuaNhanVien> {
  const d = docFormNhanVien(formData);
  if (!d.hoTen || !d.khoiId || !d.ngayVaoLam) {
    return { loi: "Thiếu họ tên, khối hoặc ngày vào làm." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("nhan_vien").insert({
    ma_nhan_vien: d.maNhanVien || null,
    ho_ten: d.hoTen,
    chuc_danh: d.chucDanh || null,
    khoi_id: d.khoiId,
    email: d.email || null,
    ngay_vao_lam: d.ngayVaoLam,
    trang_thai: d.trangThai,
  });

  if (error) return { loi: thongBaoLoiNhanVien(error) };

  revalidatePath("/nhan-su");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function suaNhanVien(formData: FormData): Promise<KetQuaNhanVien> {
  const id = String(formData.get("id") || "");
  const d = docFormNhanVien(formData);
  if (!id || !d.hoTen || !d.khoiId || !d.ngayVaoLam) {
    return { loi: "Thiếu họ tên, khối hoặc ngày vào làm." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("nhan_vien")
    .update({
      ma_nhan_vien: d.maNhanVien || null,
      ho_ten: d.hoTen,
      chuc_danh: d.chucDanh || null,
      khoi_id: d.khoiId,
      email: d.email || null,
      ngay_vao_lam: d.ngayVaoLam,
      trang_thai: d.trangThai,
    })
    .eq("id", id);

  if (error) return { loi: thongBaoLoiNhanVien(error) };

  revalidatePath("/nhan-su");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function xoaNhanVien(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("nhan_vien").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/nhan-su");
  revalidatePath("/dashboard");
}
