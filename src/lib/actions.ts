"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { coVaiTro, layNguoiDungHienTai } from "@/lib/auth";
import { nenLaQuanTri } from "@/lib/chuc-danh";

const QUAN_LY: ("admin" | "ky_thuat")[] = ["admin", "ky_thuat"];
const KHONG_DU_QUYEN = "Bạn không có quyền thực hiện thao tác này.";

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

/** Quyền Quản trị đặt cứng theo vị trí, nên chỉ Kỹ thuật được đưa một hồ sơ VÀO vị trí đó (Hành chính nhân sự, lãnh đạo);
 * người đã ở vị trí đó thì Quản trị vẫn sửa thông tin khác của họ bình thường. Chặn Quản trị tự nâng quyền cho người khác. */
async function chanNangQuyen(khoiId: string, chucDanh: string, hoSoCu?: { khoi_id: string | null; chuc_danh: string | null }) {
  const nguoiGoi = await layNguoiDungHienTai();
  if (nguoiGoi?.vaiTro === "ky_thuat") return null;
  const db = createAdminClient();
  const tenKhoi = async (id: string | null) => (id ? (await db.from("khoi").select("ten").eq("id", id).maybeSingle()).data?.ten : null);
  if (!nenLaQuanTri(chucDanh, await tenKhoi(khoiId))) return null;
  if (hoSoCu && nenLaQuanTri(hoSoCu.chuc_danh, await tenKhoi(hoSoCu.khoi_id))) return null;
  return "Vị trí này (Hành chính nhân sự, Tổng giám đốc, Giám đốc…) tự có quyền Quản trị nên chỉ tài khoản Kỹ thuật được gán.";
}

export async function themNhanVien(formData: FormData): Promise<KetQuaNhanVien> {
  if (!(await coVaiTro(QUAN_LY))) return { loi: KHONG_DU_QUYEN };
  const d = docFormNhanVien(formData);
  if (!d.hoTen || !d.khoiId || !d.ngayVaoLam) {
    return { loi: "Thiếu họ tên, khối hoặc ngày vào làm." };
  }

  const chan = await chanNangQuyen(d.khoiId, d.chucDanh);
  if (chan) return { loi: chan };

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
  if (!(await coVaiTro(QUAN_LY))) return { loi: KHONG_DU_QUYEN };
  const id = String(formData.get("id") || "");
  const d = docFormNhanVien(formData);
  if (!id || !d.hoTen || !d.khoiId || !d.ngayVaoLam) {
    return { loi: "Thiếu họ tên, khối hoặc ngày vào làm." };
  }

  const supabase = createAdminClient();
  const { data: cu } = await supabase.from("nhan_vien").select("khoi_id, chuc_danh").eq("id", id).maybeSingle();
  const chan = await chanNangQuyen(d.khoiId, d.chucDanh, cu ?? undefined);
  if (chan) return { loi: chan };
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

/** Xoá hẳn CHỈ khi nhân viên chưa có dữ liệu chấm công/đơn từ/lương/đánh giá (xoá sẽ kéo theo
 * xoá các dữ liệu đó). Đã có dữ liệu thì phải chuyển "Đã nghỉ". */
export async function xoaNhanVien(formData: FormData): Promise<KetQuaNhanVien> {
  if (!(await coVaiTro(QUAN_LY))) return { loi: KHONG_DU_QUYEN };
  const id = String(formData.get("id") || "");
  if (!id) return { loi: "Thiếu mã nhân viên." };

  const supabase = createAdminClient();
  const dem = await Promise.all(
    (["cham_cong", "don_tu", "bang_luong", "danh_gia_hieu_suat"] as const).map((b) =>
      supabase.from(b).select("id", { count: "exact", head: true }).eq("nhan_vien_id", id),
    ),
  );
  if (dem.some((d) => (d.count ?? 0) > 0)) {
    return { loi: "Nhân viên này đã có dữ liệu chấm công, đơn từ hoặc lương nên không xoá hẳn được. Hãy chuyển sang \"Đã nghỉ\"." };
  }
  const { error } = await supabase.from("nhan_vien").delete().eq("id", id);
  if (error) return { loi: thongBaoLoiNhanVien(error) };

  revalidatePath("/nhan-su");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Cho nghỉ việc: đổi trạng thái sang "Đã nghỉ", giữ nguyên mọi dữ liệu. */
export async function choNghiViec(formData: FormData): Promise<KetQuaNhanVien> {
  if (!(await coVaiTro(QUAN_LY))) return { loi: KHONG_DU_QUYEN };
  const id = String(formData.get("id") || "");
  if (!id) return { loi: "Thiếu mã nhân viên." };
  const supabase = createAdminClient();
  const { error } = await supabase.from("nhan_vien").update({ trang_thai: "Đã nghỉ" }).eq("id", id);
  if (error) return { loi: thongBaoLoiNhanVien(error) };
  revalidatePath("/nhan-su");
  revalidatePath("/dashboard");
  return { ok: true };
}
