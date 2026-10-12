"use client";

import { useActionState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { chamCongVao, chamCongRa } from "@/app/cham-cong/actions";

export function NutChamCong({
  gioVao,
  gioRa,
  trangThai,
}: {
  gioVao: string | null;
  gioRa: string | null;
  trangThai: string | null;
}) {
  const [stateVao, actionVao, dangVao] = useActionState(async () => chamCongVao(), {});
  const [stateRa, actionRa, dangRa] = useActionState(async () => chamCongRa(), {});

  return (
    <div className="rounded-xl border border-omyn-border bg-omyn-surface p-5">
      <div className="mb-3 text-sm font-semibold text-slate-900">Chấm công của tôi hôm nay</div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-400">Giờ vào</div>
          <div className="font-mono text-base font-medium text-slate-800">{gioVao ?? "--:--"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Giờ ra</div>
          <div className="font-mono text-base font-medium text-slate-800">{gioRa ?? "--:--"}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <form action={actionVao} className="flex-1">
          <button
            type="submit"
            disabled={dangVao || !!gioVao}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-omyn-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-omyn-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LogIn className="h-4 w-4" />
            {gioVao ? "Đã chấm vào" : dangVao ? "Đang chấm..." : "Chấm công vào"}
          </button>
        </form>
        <form action={actionRa} className="flex-1">
          <button
            type="submit"
            disabled={dangRa || !gioVao || !!gioRa}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LogOut className="h-4 w-4" />
            {gioRa ? "Đã chấm ra" : dangRa ? "Đang chấm..." : "Chấm công ra"}
          </button>
        </form>
      </div>

      {(stateVao?.loi || stateRa?.loi) && (
        <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-200">
          {stateVao?.loi || stateRa?.loi}
        </div>
      )}

      {trangThai && (
        <div className="mt-3 text-xs text-slate-400">
          Trạng thái hôm nay: <span className="font-medium text-slate-600">{trangThai}</span>
        </div>
      )}
    </div>
  );
}
