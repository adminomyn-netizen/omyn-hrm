"use client";

import { useActionState } from "react";
import Link from "next/link";
import { dangNhap } from "./actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { OTaiKhoan } from "@/components/auth/OTaiKhoan";

export default function TrangDangNhap() {
  const [state, action, dangXuLy] = useActionState(dangNhap, undefined);

  return (
    <AuthShell tieuDe="Đăng nhập" moTa="Dùng email và mật khẩu bạn đã đăng ký.">
      <form action={action} className="space-y-5">
        <OTaiKhoan id="email" ten="email" nhan="Email" loai="email" bieuTuong="email" required autoComplete="username" placeholder="ten@omyn.vn" />
        <OTaiKhoan id="mat_khau" ten="mat_khau" nhan="Mật khẩu" loai="password" bieuTuong="mat_khau" required autoComplete="current-password" />

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
          {dangXuLy ? "Đang đăng nhập" : "Đăng nhập"}
        </button>

        <p className="text-[13px] text-muc-3">
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="font-medium text-nhan underline underline-offset-4">
            Đăng ký
          </Link>
          . Quên mật khẩu thì nhờ bộ phận Nhân sự đặt lại giúp bạn.
        </p>
      </form>
    </AuthShell>
  );
}
