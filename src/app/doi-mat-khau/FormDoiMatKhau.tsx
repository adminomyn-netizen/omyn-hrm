"use client";

import { useActionState } from "react";
import { OTaiKhoan } from "@/components/auth/OTaiKhoan";
import { doiMatKhauLanDau } from "./actions";

export function FormDoiMatKhau() {
  const [state, action, dangXuLy] = useActionState(doiMatKhauLanDau, undefined);
  return (
    <form action={action} className="space-y-5">
      <OTaiKhoan id="mat_khau_hien_tai" ten="mat_khau_hien_tai" nhan="Mật khẩu tạm" loai="password" bieuTuong="mat_khau" required autoComplete="current-password" />
      <OTaiKhoan id="mat_khau_moi" ten="mat_khau_moi" nhan="Mật khẩu mới" loai="password" bieuTuong="mat_khau" required autoComplete="new-password" />
      <OTaiKhoan id="mat_khau_nhap_lai" ten="mat_khau_nhap_lai" nhan="Nhập lại mật khẩu mới" loai="password" bieuTuong="mat_khau" required autoComplete="new-password" />
      <p className="text-[13px] text-muc-3">Ít nhất 8 ký tự, có chữ in hoa và ký tự đặc biệt (ví dụ ! @ # $).</p>
      {state?.loi && (
        <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">
          {state.loi}
        </div>
      )}
      <button type="submit" disabled={dangXuLy} className="nut-vang h-[50px] w-full rounded-[10px] text-[15px] disabled:opacity-60">
        {dangXuLy ? "Đang lưu" : "Lưu mật khẩu mới"}
      </button>
    </form>
  );
}
