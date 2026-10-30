"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { huyPhieu, xuLyPhieu } from "@/app/(app)/phe-duyet/actions";
import { NUT_CHINH, NUT_CHU_NGUY, NUT_PHU, O_NHIEU_DONG, NHAN_O } from "@/components/ui/dinh-dang";
import type { HanhDongDuyet } from "@/lib/phe-duyet";

/** Khung hành động trên một phiếu: người duyệt (duyệt / từ chối / yêu cầu bổ sung) và người nộp (sửa nộp lại / huỷ). */
export function PanelXuLy({ id, duocDuyet, suaNopLai, huy }: { id: string; duocDuyet: boolean; suaNopLai: boolean; huy: boolean }) {
  const router = useRouter();
  const [ghiChu, setGhiChu] = useState("");
  const [loi, setLoi] = useState<string>();
  const [dang, batDau] = useTransition();
  const chay = (viec: () => Promise<{ ok?: boolean; loi?: string }>) => batDau(async () => {
    setLoi(undefined);
    const r = await viec();
    if (!r.ok) { setLoi(r.loi); return; }
    setGhiChu("");
    router.refresh();
  });
  if (!duocDuyet && !suaNopLai && !huy) return null;
  const duyet = (h: HanhDongDuyet) => chay(() => xuLyPhieu(id, h, ghiChu));
  return (
    <section className="the-noi the-noi-thap p-5">
      {duocDuyet && (
        <div>
          <label className={NHAN_O} htmlFor="pd-ghi-chu">Ý kiến (bắt buộc khi từ chối hoặc yêu cầu bổ sung)</label>
          <textarea id="pd-ghi-chu" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} maxLength={1000} className={O_NHIEU_DONG} />
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button type="button" disabled={dang} onClick={() => duyet("Duyệt")} className={NUT_CHINH}>Duyệt</button>
            <button type="button" disabled={dang} onClick={() => duyet("Yêu cầu bổ sung")} className={NUT_PHU}>Yêu cầu bổ sung</button>
            <button type="button" disabled={dang} onClick={() => duyet("Từ chối")} className={`${NUT_PHU} text-loi`}>Từ chối</button>
          </div>
        </div>
      )}
      {(suaNopLai || huy) && (
        <div className={`flex flex-wrap items-center gap-3 ${duocDuyet ? "mt-5 border-t border-vien pt-4" : ""}`}>
          {suaNopLai && <Link href={`/phe-duyet/${id}/sua`} className={`${NUT_CHINH} inline-flex items-center leading-10`}>Sửa và nộp lại</Link>}
          {huy && <button type="button" disabled={dang} onClick={() => { if (window.confirm("Huỷ phiếu này? Phiếu sẽ dừng, không duyệt tiếp.")) chay(() => huyPhieu(id, "")); }} className={NUT_CHU_NGUY}>Huỷ phiếu</button>}
        </div>
      )}
      {loi && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
    </section>
  );
}
