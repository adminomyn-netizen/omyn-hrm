"use client";

import { useActionState } from "react";
import Link from "next/link";
import { dangKy } from "./actions";
import { AuthShell } from "@/components/auth/AuthShell";

const o =
  "h-11 w-full rounded-nho border border-vien-dam bg-giay-sang px-3 text-[16px] text-muc outline-none placeholder:text-muc-3 focus:border-nhan focus:ring-2 focus:ring-nhan/25";
const nhan = "mb-1.5 block text-[13px] font-medium text-muc-2";

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
        <div>
          <label htmlFor="ho_ten" className={nhan}>
            Họ và tên
          </label>
          <input id="ho_ten" name="ho_ten" required autoComplete="name" className={o} />
        </div>
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
            Mật khẩu (8 ký tự trở lên, có chữ in hoa và ký tự đặc biệt)
          </label>
          <input
            id="mat_khau"
            name="mat_khau"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={o}
          />
        </div>
        <div>
          <label htmlFor="xac_nhan_mat_khau" className={nhan}>
            Nhập lại mật khẩu
          </label>
          <input
            id="xac_nhan_mat_khau"
            name="xac_nhan_mat_khau"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
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
