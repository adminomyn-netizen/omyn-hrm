"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { NUT_CHU } from "@/components/ui/dinh-dang";
import { doiVaiTro } from "@/app/(app)/cai-dat/actions";

const LUA_CHON = [{ gia_tri: "nhan_vien", nhan: "Nhân viên" }, { gia_tri: "ky_thuat", nhan: "Kỹ thuật" }, { gia_tri: "admin", nhan: "Quản trị" }];

/** Ô đổi vai trò trong bảng tài khoản. Tài khoản chờ duyệt hoặc chính mình thì chỉ hiện nhãn. */
export function VaiTroTaiKhoan({ userId, vaiTro, laToi }: { userId: string; vaiTro: string; laToi: boolean }) {
  const router = useRouter();
  const [moi, setMoi] = useState(vaiTro);
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  if (laToi || vaiTro === "cho_duyet") return <span className="text-muc-2">{vaiTro === "cho_duyet" ? "Chờ duyệt (ở Tổng quan)" : "Chính bạn"}</span>;

  const luu = () => {
    const fd = new FormData();
    fd.set("user_id", userId);
    fd.set("vai_tro", moi);
    startXuLy(async () => {
      const r = await doiVaiTro(fd);
      if (r.loi) { setLoi(r.loi); setMoi(vaiTro); } else { setLoi(undefined); router.refresh(); }
    });
  };
  return (
    <div>
      <div className="flex items-center gap-3">
        <Chon nho ariaLabel="Vai trò" giaTri={moi} onDoi={setMoi} className="w-36" luaChon={LUA_CHON} />
        {moi !== vaiTro && <button type="button" className={NUT_CHU} disabled={dangXuLy} onClick={luu}>{dangXuLy ? "Đang lưu" : "Lưu"}</button>}
      </div>
      {loi && <div role="alert" className="mt-1 text-[12px] text-loi">{loi}</div>}
    </div>
  );
}
