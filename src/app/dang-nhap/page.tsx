"use client";

import { useActionState } from "react";
import Link from "next/link";
import { dangNhap } from "./actions";
import { AuthShell } from "@/components/auth/AuthShell";

const o =
  "w-full rounded-lg border border-omyn-border px-3 py-2.5 text-sm outline-none transition-colors focus:border-omyn-primary focus:ring-2 focus:ring-omyn-primary-light";
const nhan = "mb-1 block text-sm font-medium text-slate-700";

export default function TrangDangNhap() {
  const [state, action, dangXuLy] = useActionState(dangNhap, undefined);

  return (
    <AuthShell tieuDe="Đăng nhập" moTa="Vào hệ thống nội bộ Omyn HRM bằng tài khoản của bạn.">
      <form action={action} className="space-y-4 rounded-xl border border-omyn-border bg-omyn-surface p-6 shadow-sm">
        <div>
          <label className={nhan}>Email</label>
          <input name="email" type="email" required className={o} placeholder="ten@omyn.vn" />
        </div>
        <div>
          <label className={nhan}>Mật khẩu</label>
          <input name="mat_khau" type="password" required className={o} placeholder="••••••••" />
        </div>

        {state?.loi && (
          <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {state.loi}
          </div>
        )}

        <button
          type="submit"
          disabled={dangXuLy}
          className="w-full rounded-lg bg-omyn-primary py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-omyn-primary-dark disabled:opacity-60"
        >
          {dangXuLy ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div className="pt-1 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="font-medium text-omyn-primary hover:underline">
            Đăng ký
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
