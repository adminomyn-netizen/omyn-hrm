"use client";

import { useActionState, useState } from "react";
import { LogIn, LogOut, Check } from "lucide-react";
import { chamCongVao, chamCongRa } from "@/app/(app)/cham-cong/actions";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

/** Chấm công của chính mình: một nút tròn lớn (vàng khi chưa vào; xám ngà khi đã vào, bấm để ra). Giờ hiện NGAY khi bấm (lạc quan), lỗi thì hoàn lại.
 * Giữ <form action> + useActionState như bản cũ (đã chạy đúng ở đây). */
export function NutChamCong({ gioVao, gioRa, trangThai }: { gioVao: string | null; gioRa: string | null; trangThai: string | null }) {
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
  const vao = gioVao ?? tam.vao ?? null;
  const ra = gioRa ?? tam.ra ?? null;
  const loi = stateVao?.loi || stateRa?.loi;
  const xong = !!vao && !!ra;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
      <div className="relative mt-2 flex h-[236px] w-[236px] items-center justify-center">
        <span aria-hidden className="absolute inset-0 border border-vien" style={{ borderRadius: 9999 }} />
        <span aria-hidden className="absolute inset-4 border border-vien opacity-70" style={{ borderRadius: 9999 }} />
        <form action={vao && !ra ? actionRa : actionVao}>
          <button
            type="submit"
            disabled={xong || dangVao || dangRa}
            aria-label={xong ? "Đã hoàn tất chấm công hôm nay" : vao ? "Chấm công ra" : "Chấm công vào"}
            className="relative flex h-[184px] w-[184px] flex-col items-center justify-center gap-1.5 text-[18px] font-semibold text-[var(--chu-tren-vang)] disabled:cursor-default"
            style={{
              borderRadius: 9999,
              background: vao ? "linear-gradient(135deg,#d7e3e1,#a9c1bd)" : "var(--gradient-vang)",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,.5), 0 14px 30px rgba(15,118,110,.38)",
              opacity: xong ? 0.8 : 1,
            }}
          >
            {xong ? <Check strokeWidth={1.8} className="h-8 w-8" /> : vao ? <LogOut strokeWidth={1.7} className="h-8 w-8" /> : <LogIn strokeWidth={1.7} className="h-8 w-8" />}
            <span>{xong ? "Đã xong hôm nay" : dangVao || dangRa ? "Đang chấm" : vao ? "Chấm công ra" : "Chấm công vào"}</span>
          </button>
        </form>
      </div>

      <dl className="mt-6 grid w-full grid-cols-2 border-y border-vien py-4">
        <div className="px-2">
          <dt className="text-[12px] text-muc-3">Giờ vào</dt>
          <dd className="mt-0.5 text-[28px] font-medium leading-none tabular-nums text-muc">{vao ?? "--:--"}</dd>
        </div>
        <div className="border-l border-vien px-2">
          <dt className="text-[12px] text-muc-3">Giờ ra</dt>
          <dd className="mt-0.5 text-[28px] font-medium leading-none tabular-nums text-muc">{ra ?? "--:--"}</dd>
        </div>
      </dl>

      {loi && <div role="alert" className="mt-3 w-full rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {trangThai && (
        <p className="mt-3 text-[13px] text-muc-3">
          Hôm nay: <NhanTrangThai kieu={trangThai === "Đúng giờ" ? "tot" : trangThai === "Đi muộn" ? "cho" : "loi"}>{trangThai}</NhanTrangThai>
        </p>
      )}
    </div>
  );
}
