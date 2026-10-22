"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { dangKy } from "./actions";
import { OTaiKhoan } from "@/components/auth/OTaiKhoan";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O } from "@/components/ui/dinh-dang";
import { VI_TRI_DANG_KY } from "@/lib/vi-tri-dang-ky";

export function FormDangKy({ khoi }: { khoi: { id: string; ten: string }[] }) {
  const [state, action, dangXuLy] = useActionState(dangKy, undefined);
  const [viTri, setViTri] = useState("nhan_vien");

  return (
    <form action={action} className="space-y-5">
      {/* ô bẫy máy, ẩn với người thật */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <OTaiKhoan id="ho_ten" ten="ho_ten" nhan="Họ và tên" bieuTuong="ten" required autoComplete="name" />
      <OTaiKhoan id="email" ten="email" nhan="Email" loai="email" bieuTuong="email" required autoComplete="username" placeholder="ten@omyn.vn" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={NHAN_O} htmlFor="vi_tri">Vị trí</label>
          <Chon id="vi_tri" ten="vi_tri" giaTri={viTri} onDoi={setViTri} luaChon={VI_TRI_DANG_KY.map((v) => ({ gia_tri: v.gia_tri, nhan: v.nhan }))} />
        </div>
        <div>
          <label className={NHAN_O} htmlFor="khoi_id">Bộ phận{viTri === "hr" ? " (nếu có)" : ""}</label>
          <Chon id="khoi_id" ten="khoi_id" giaTriMacDinh="" batBuoc={viTri !== "hr"} trong="Chọn bộ phận" luaChon={khoi.map((k) => ({ gia_tri: k.id, nhan: k.ten }))} />
        </div>
      </div>
      <p className="-mt-2 text-[12px] text-muc-3">Lãnh đạo, trưởng bộ phận và leader do Quản trị gán sau khi duyệt, không tự chọn ở đây.</p>
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
