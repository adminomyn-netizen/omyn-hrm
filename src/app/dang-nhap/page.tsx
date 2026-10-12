"use client";

import { useActionState } from "react";
import { dangNhap } from "./actions";

export default function TrangDangNhap() {
  const [state, action, dangXuLy] = useActionState(dangNhap, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-omyn-border bg-omyn-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-omyn-primary text-lg font-bold text-white">
            O
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">OMYN HRM</div>
            <div className="text-sm text-slate-500">Đăng nhập hệ thống nội bộ</div>
          </div>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-omyn-border px-3 py-2 text-sm outline-none focus:border-omyn-primary"
              placeholder="ten@omyn.vn"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
            <input
              name="mat_khau"
              type="password"
              required
              className="w-full rounded-lg border border-omyn-border px-3 py-2 text-sm outline-none focus:border-omyn-primary"
              placeholder="••••••••"
            />
          </div>

          {state?.loi && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {state.loi}
            </div>
          )}

          <button
            type="submit"
            disabled={dangXuLy}
            className="w-full rounded-lg bg-omyn-primary py-2.5 text-sm font-medium text-white hover:bg-omyn-primary-dark disabled:opacity-60"
          >
            {dangXuLy ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
