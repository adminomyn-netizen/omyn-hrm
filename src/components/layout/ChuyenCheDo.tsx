"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KHOA_LUU = "omyn-hrm-che-do";

/** Nút bật/tắt chế độ tối — mặc định luôn là sáng, chỉ đổi khi người dùng
 * tự bấm, lưu lại cho lần sau. */
export function ChuyenCheDo({ className }: { className?: string }) {
  const [toi, setToi] = useState(false);

  useEffect(() => {
    setToi(document.documentElement.classList.contains("dark"));
  }, []);

  const doiCheDo = () => {
    const moi = !toi;
    setToi(moi);
    document.documentElement.classList.toggle("dark", moi);
    try {
      localStorage.setItem(KHOA_LUU, moi ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={doiCheDo}
      title={toi ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className={
        className ??
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      }
    >
      {toi ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
