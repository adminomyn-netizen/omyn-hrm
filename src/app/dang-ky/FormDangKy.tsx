"use client";

import { useActionState } from "react";
import Link from "next/link";
import { dangKy } from "./actions";
import { OTaiKhoan } from "@/components/auth/OTaiKhoan";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O } from "@/components/ui/dinh-dang";

export function FormDangKy({ khoi }: { khoi: { id: string; ten: string }[] }) {
  const [state, action, dangXuLy] = useActionState(dangKy, undefined);

  return (
    <form action={action} className="space-y-5">
      {/* ô bẫy máy, ẩn với người thật */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <OTaiKhoan id="ho_ten" ten="ho_ten" nhan="Họ và tên" bieuTuong="ten" required autoComplete="name" />
      <OTaiKhoan id="email" ten="email" nhan="Email" loai="email" bieuTuong="email" required autoComplete="username" placeholder="ten@omyn.vn" />
      <div>
        <label className={NHAN_O} htmlFor="khoi_id">Phòng ban</label>
        <Chon id="khoi_id" ten="khoi_id" giaTriMacDinh="" batBuoc trong="Chọn phòng ban" luaChon={khoi.map((k) => ({ gia_tri: k.id, nhan: k.ten }))} />
      </div>
      <OTaiKhoan id="mat_khau" ten="mat_khau" nhan="Mật khẩu (8 ký tự trở lên, có chữ in hoa và ký tự đặc biệt)" loai="password" bieuTuong="mat_khau" required minLength={8} autoComplete="new-password" />
      <OTaiKhoan id="xac_nhan_mat_khau" ten="xac_nhan_mat_khau" nhan="Nhập lại mật khẩu" loai="password" bieuTuong="mat_khau" required minLength={8} autoComplete="new-password" />

      {state?.loi && (
        <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">
          {state.loi}
        </div>
      )}

      <button type="submit" disabled={dangXuLy} className="nut-vang h-[50px] w-full rounded-[10px] text-[15px] disabled:opacity-60">
        {dangXuLy ? "Đang tạo tài khoản" : "Tạo tài khoản"}
      </button>

      <p className="text-[13px] text-muc-3">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className="font-medium text-nhan underline underline-offset-4">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
