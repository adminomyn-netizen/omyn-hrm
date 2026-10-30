"use client";

import { Moon, Sun } from "lucide-react";
import { useLuuTru } from "@/lib/luu-tru";

const KHOA = "omyn-hrm-che-do";
const LUA_CHON = [
  { ma: "sang", nhan: "Sáng", Icon: Sun },
  { ma: "toi", nhan: "Tối", Icon: Moon },
] as const;

/** Chọn giao diện Sáng / Tối, nằm trong menu tài khoản (cả máy tính lẫn điện thoại). Lựa chọn nhớ trong localStorage; mặc định sáng.
 *  Script trong <head> bật class .dark trước khi vẽ trang; bấm chọn thì đổi class ngay (menu chỉ vẽ khi mở nên không dùng useEffect). */
export function ChuyenCheDo() {
  const [cheDo, ghi] = useLuuTru(KHOA, "sang");
  const chon = (ma: string) => {
    document.documentElement.classList.toggle("dark", ma === "toi");
    ghi(ma);
  };
  return (
    <div className="border-t border-vien px-5 py-3.5">
      <div className="nhan-muc mb-2">Giao diện</div>
      <div
        className="grid grid-cols-2 gap-1.5"
        role="group"
        aria-label="Giao diện"
      >
        {LUA_CHON.map(({ ma, nhan, Icon }) => (
          <button
            key={ma}
            type="button"
            onClick={() => chon(ma)}
            aria-pressed={cheDo === ma}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-nho border text-[13px] ${cheDo === ma ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}
          >
            <Icon strokeWidth={1.7} className="h-4 w-4" aria-hidden />
            {nhan}
          </button>
        ))}
      </div>
    </div>
  );
}
