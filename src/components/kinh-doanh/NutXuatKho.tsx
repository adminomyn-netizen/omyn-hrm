"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { xuatKhoGhiNoAction } from "@/app/(app)/kinh-doanh/don-si/actions";

/** Một nút trên mỗi đơn sỉ: tạo phiếu xuất kho và ghi công nợ. Kết quả hiện ngay dưới nút. */
export function NutXuatKho({ donId }: { donId: string }) {
  const [dang, bat] = useTransition();
  const [tin, setTin] = useState<{ loi?: string; ok?: string }>({});
  const router = useRouter();
  return (
    <div>
      <button type="button" disabled={dang} className={NUT_PHU}
        onClick={() => bat(async () => { const r = await xuatKhoGhiNoAction(donId); setTin(r.ok ? { ok: r.tomTat } : { loi: r.loi }); if (r.ok) router.refresh(); })}>
        {dang ? "Đang làm…" : "Xuất kho và ghi nợ"}
      </button>
      {tin.loi && <p role="alert" className="mt-1 text-[12px] text-loi">{tin.loi}</p>}
      {tin.ok && <p role="status" className="mt-1 text-[12px] text-muc-3">{tin.ok}</p>}
    </div>
  );
}
