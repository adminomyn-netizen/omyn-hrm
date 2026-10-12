"use client";

import { useActionState } from "react";
import Link from "next/link";
import { dangKy } from "./actions";
import { AuthShell } from "@/components/auth/AuthShell";

const o =
  "w-full rounded-lg border border-omyn-border px-3 py-2.5 text-sm outline-none transition-colors focus:border-omyn-primary focus:ring-2 focus:ring-omyn-primary-light";
const nhan = "mb-1 block text-sm font-medium text-slate-700";

export default function TrangDangKy() {
  const [state, action, dangXuLy] = useActionState(dangKy, undefined);

  return (
    <AuthShell
      tieuDe="Đăng ký tài khoản"
      moTa="Tạo tài khoản nhân viên để tự chấm công và theo dõi lịch làm việc của riêng bạn."
    >
      <form action={action} className="space-y-4 rounded-xl border border-omyn-border bg-omyn-surface p-6 shadow-sm">
        <div>
          <label className={nhan}>
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <input name="ho_ten" required className={o} placeholder="Nguyễn Văn A" />
        </div>
        <div>
          <label className={nhan}>
            Email <span className="text-rose-500">*</span>
          </label>
          <input name="email" type="email" required className={o} placeholder="ten@omyn.vn" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={nhan}>
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
            <input name="mat_khau" type="password" required minLength={6} className={o} placeholder="Ít nhất 6 ký tự" />
          </div>
          <div>
            <label className={nhan}>
              Xác nhận mật khẩu <span className="text-rose-500">*</span>
            </label>
            <input name="xac_nhan_mat_khau" type="password" required minLength={6} className={o} />
          </div>
        </div>

        {state?.loi && (
          <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30">
            {state.loi}
          </div>
        )}

        <button
          type="submit"
          disabled={dangXuLy}
          className="w-full rounded-lg bg-omyn-primary py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-omyn-primary-dark disabled:opacity-60"
        >
          {dangXuLy ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>

        <div className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-medium text-omyn-primary hover:underline">
            Đăng nhập
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
