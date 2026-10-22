import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type VaiTro = "admin" | "ky_thuat" | "nhan_vien" | "cho_duyet";

const VAI_TRO_DA_DUYET = ["admin", "ky_thuat", "nhan_vien"] as const;

/** Giá trị lạ hoặc trống ⇒ "cho_duyet" (từ chối mặc định). */
function chuanHoaVaiTro(v: unknown): VaiTro {
  return (VAI_TRO_DA_DUYET as readonly unknown[]).includes(v) ? (v as VaiTro) : "cho_duyet";
}

/** Mỗi yêu cầu chỉ hỏi Supabase Auth MỘT lần (React cache): layout, trang và hàm bảo vệ dùng chung kết quả. */
export const layNguoiDungHienTai = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    hoTen: (user.app_metadata?.ho_ten as string) || (user.email ?? ""),
    // Thiếu vai trò = "cho_duyet": tài khoản tự đăng ký chưa được Nhân sự duyệt,
    // không có quyền gì. app_metadata chỉ máy chủ sửa được (người dùng thì không).
    vaiTro: chuanHoaVaiTro(user.app_metadata?.vai_tro),
  };
});

/** Chặn thật ở server cho các trang chỉ admin/kỹ thuật được xem — nav chỉ ẩn
 * mục menu, không chặn việc gõ thẳng URL, nên các trang toàn công ty phải
 * tự gọi hàm này. Không đủ quyền thì đưa về trang Chấm công của chính họ. */
export async function yeuCauVaiTro(choPhep: VaiTro[]) {
  const nguoiDung = await layNguoiDungDaDuyet();
  if (!choPhep.includes(nguoiDung.vaiTro)) {
    redirect("/cham-cong");
  }
  return nguoiDung;
}

/** Người đã đăng nhập VÀ đã được duyệt (có vai trò). Chưa đăng nhập → /dang-nhap,
 * chờ duyệt → /cho-duyet. Mọi trang có dữ liệu phải gọi hàm này TRƯỚC khi đọc dữ
 * liệu, rồi rẽ nhánh bằng danh sách trắng (admin/ky_thuat), không bằng "không phải nhân viên". */
export async function layNguoiDungDaDuyet() {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) redirect("/dang-nhap");
  if (nguoiDung.vaiTro === "cho_duyet") redirect("/cho-duyet");
  return nguoiDung as typeof nguoiDung & { vaiTro: Exclude<VaiTro, "cho_duyet"> };
}

/** Dùng trong Server Action: trả về true nếu người gọi có một trong các vai trò.
 * Mọi action đụng dữ liệu nhân sự PHẢI gọi hàm này — Server Action là điểm
 * cuối POST công khai với ai đã đăng nhập, ẩn nút ở giao diện không chặn được. */
export async function coVaiTro(choPhep: VaiTro[]) {
  const nguoiDung = await layNguoiDungHienTai();
  return !!nguoiDung && choPhep.includes(nguoiDung.vaiTro);
}
