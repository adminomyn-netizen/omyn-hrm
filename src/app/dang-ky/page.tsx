"use client";

import { useActionState } from "react";
import Link from "next/link";
import { dangKy } from "./actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { OTaiKhoan } from "@/components/auth/OTaiKhoan";

export default function TrangDangKy() {
  const [state, action, dangXuLy] = useActionState(dangKy, undefined);

  return (
    <AuthShell
      tieuDe="Đăng ký"
      moTa="Tạo tài khoản của bạn. Nhân sự sẽ duyệt và mở quyền trước khi bạn dùng được."
    >
      <form action={action} className="space-y-5">
        {/* ô bẫy máy, ẩn với người thật */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <OTaiKhoan id="ho_ten" ten="ho_ten" nhan="Họ và tên" bieuTuong="ten" required autoComplete="name" />
        <OTaiKhoan id="email" ten="email" nhan="Email" loai="email" bieuTuong="email" required autoComplete="username" placeholder="ten@omyn.vn" />
        <OTaiKhoan id="mat_khau" ten="mat_khau" nhan="Mật khẩu (8 ký tự trở lên, có chữ in hoa và ký tự đặc biệt)" loai="password" bieuTuong="mat_khau" required minLength={8} autoComplete="new-password" />
        <OTaiKhoan id="xac_nhan_mat_khau" ten="xac_nhan_mat_khau" nhan="Nhập lại mật khẩu" loai="password" bieuTuong="mat_khau" required minLength={8} autoComplete="new-password" />

        {state?.loi && (
          <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">
            {state.loi}
          </div>
        )}

        <button
          type="submit"
          disabled={dangXuLy}
          className="nut-vang h-[50px] w-full rounded-[10px] text-[15px] disabled:opacity-60"
        >
          {dangXuLy ? "Đang tạo tài khoản" : "Tạo tài khoản"}
        </button>

        <p className="text-[13px] text-muc-3">
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-medium text-nhan underline underline-offset-4">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
