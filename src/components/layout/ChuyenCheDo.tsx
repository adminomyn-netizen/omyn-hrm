"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useLuuTru } from "@/lib/luu-tru";

const KHOA = "omyn-hrm-che-do";

/** Nút sáng/tối. Lựa chọn nhớ trong localStorage; mặc định sáng. Script trong <head> bật class .dark trước khi vẽ trang. */
export function ChuyenCheDo() {
  const [cheDo, ghi] = useLuuTru(KHOA, "sang");
  const toi = cheDo === "toi";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", toi);
  }, [toi]);

  return (
    <button
      type="button"
      onClick={() => ghi(toi ? "sang" : "toi")}
      title={toi ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      aria-label={toi ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className="rounded-nho p-2 text-muc-2 hover:bg-giay-tram hover:text-muc"
    >
      {toi ? <Sun strokeWidth={1.5} className="h-[19px] w-[19px]" /> : <Moon strokeWidth={1.5} className="h-[19px] w-[19px]" />}
    </button>
  );
}
