"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

const ICON = { email: Mail, mat_khau: Lock, ten: User } as const;

/** Ô nhập của màn đăng nhập/đăng ký: biểu tượng vàng bên trái, viền chuyển vàng khi focus; ô mật khẩu có nút hiện/ẩn. */
export function OTaiKhoan({
  id,
  ten,
  nhan,
  loai = "text",
  bieuTuong,
  phuNhan,
  ...rest
}: {
  id: string;
  ten: string;
  nhan: string;
  loai?: "text" | "email" | "password";
  bieuTuong: keyof typeof ICON;
  phuNhan?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type">) {
  const [hien, setHien] = useState(false);
  const Icon = ICON[bieuTuong];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-muc-2">{nhan}</label>
        {phuNhan}
      </div>
      <div className="flex h-12 items-center gap-2.5 rounded-[10px] border border-vien-dam bg-giay-sang px-3.5 transition-colors focus-within:border-nhan focus-within:ring-[3px] focus-within:ring-nhan/20 hover:border-nhan">
        <Icon strokeWidth={1.6} className="h-[18px] w-[18px] shrink-0 text-nhan" />
        <input
          id={id}
          name={ten}
          type={loai === "password" && hien ? "text" : loai}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-muc outline-none placeholder:text-muc-3"
          {...rest}
        />
        {loai === "password" && (
          <button
            type="button"
            onClick={() => setHien((h) => !h)}
            aria-label={hien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="p-1 text-muc-3 hover:text-muc"
          >
            {hien ? <EyeOff strokeWidth={1.6} className="h-[18px] w-[18px]" /> : <Eye strokeWidth={1.6} className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
    </div>
  );
}
