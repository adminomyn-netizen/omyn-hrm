"use client";

import { useActionState } from "react";
import Link from "next/link";
import { dangNhap } from "./actions";
import { AuthShell } from "@/components/auth/AuthShell";

const o =
  "h-11 w-full rounded-nho border border-vien-dam bg-giay-sang px-3 text-[16px] text-muc outline-none placeholder:text-muc-3 focus:border-nhan focus:ring-2 focus:ring-nhan/25";
const nhan = "mb-1.5 block text-[13px] font-medium text-muc-2";

export default function TrangDangNhap() {
  const [state, action, dangXuLy] = useActionState(dangNhap, undefined);

  return (
    <AuthShell tieuDe="Đăng nhập" moTa="Dùng email và mật khẩu bạn đã đăng ký.">
      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="email" className={nhan}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className={o}
            placeholder="ten@omyn.vn"
          />
        </div>
        <div>
          <label htmlFor="mat_khau" className={nhan}>
            Mật khẩu
          </label>
          <input
            id="mat_khau"
            name="mat_khau"
            type="password"
            required
            autoComplete="current-password"
            className={o}
          />
        </div>

        {state?.loi && (
          <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">
            {state.loi}
          </div>
        )}

        <button
          type="submit"
          disabled={dangXuLy}
          className="h-11 w-full rounded-nho nut-vang text-[15px] disabled:opacity-60"
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
