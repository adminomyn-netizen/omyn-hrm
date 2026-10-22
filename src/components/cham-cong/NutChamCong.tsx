"use client";

import { useActionState, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { chamCongVao, chamCongRa } from "@/app/(app)/cham-cong/actions";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

/** Chấm công vào/ra của chính mình. Giữ <form action> + useActionState như bản cũ (đã chạy đúng ở đây). */
export function NutChamCong({ gioVao, gioRa, trangThai }: { gioVao: string | null; gioRa: string | null; trangThai: string | null }) {
  // Hiện giờ vừa bấm NGAY (lạc quan); máy chủ xác nhận xong thì số thật thay vào, lỗi thì hoàn lại.
  const [tam, setTam] = useState<{ vao?: string; ra?: string }>({});
  const bayGio = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
  const [stateVao, actionVao, dangVao] = useActionState(async () => {
    setTam((t) => ({ ...t, vao: bayGio() }));
    const kq = await chamCongVao();
    if (kq?.loi) setTam((t) => ({ ...t, vao: undefined }));
    return kq;
  }, {});
  const [stateRa, actionRa, dangRa] = useActionState(async () => {
    setTam((t) => ({ ...t, ra: bayGio() }));
    const kq = await chamCongRa();
    if (kq?.loi) setTam((t) => ({ ...t, ra: undefined }));
    return kq;
  }, {});
  gioVao = gioVao ?? tam.vao ?? null;
  gioRa = gioRa ?? tam.ra ?? null;
  const loi = stateVao?.loi || stateRa?.loi;

  return (
    <div>
      <div className="nhan-muc">Chấm công của tôi hôm nay</div>
      <dl className="mt-3 grid grid-cols-2 border-y border-vien py-4">
        <div className="pr-6">
          <dt className="text-[13px] text-muc-3">Giờ vào</dt>
          <dd className="mt-1 text-[28px] font-medium leading-none tabular-nums text-muc">{gioVao ?? "--:--"}</dd>
        </div>
        <div className="border-l border-vien pl-6">
          <dt className="text-[13px] text-muc-3">Giờ ra</dt>
          <dd className="mt-1 text-[28px] font-medium leading-none tabular-nums text-muc">{gioRa ?? "--:--"}</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <form action={actionVao}>
          <button type="submit" disabled={dangVao || !!gioVao} className="nut-vang flex h-14 w-full items-center justify-center gap-2 rounded-nho text-[15px] disabled:opacity-50">
            <LogIn strokeWidth={1.5} className="h-[18px] w-[18px]" />
            {gioVao ? "Đã chấm vào" : dangVao ? "Đang chấm" : "Chấm công vào"}
          </button>
        </form>
        <form action={actionRa}>
          <button type="submit" disabled={dangRa || !gioVao || !!gioRa} className="flex h-14 w-full items-center justify-center gap-2 rounded-nho border border-vien-dam text-[15px] font-medium text-muc hover:bg-giay-tram disabled:opacity-50">
            <LogOut strokeWidth={1.5} className="h-[18px] w-[18px]" />
            {gioRa ? "Đã chấm ra" : dangRa ? "Đang chấm" : "Chấm công ra"}
          </button>
        </form>
      </div>

      {loi && <div role="alert" className="mt-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {trangThai && (
        <p className="mt-3 text-[13px] text-muc-3">
          Trạng thái hôm nay: <NhanTrangThai kieu={trangThai === "Đúng giờ" ? "tot" : trangThai === "Đi muộn" ? "cho" : "loi"}>{trangThai}</NhanTrangThai>
        </p>
      )}
    </div>
  );
}
