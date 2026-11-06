"use client";

import { useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { luuMinhChungCongViec } from "@/app/(app)/cong-viec/actions";
import { NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { tenMienLink } from "@/lib/bao-cao-cv";

/** Link minh chứng của MỘT việc trong ngày hôm nay: hiện tên miền (bấm mở), sửa/xoá tại chỗ. */
export function MinhChungViec({ id, link, ghiChu }: { id: string; link: string | null; ghiChu: string | null }) {
  const [sua, setSua] = useState(false);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [l, setL] = useState(link ?? "");
  const [g, setG] = useState(ghiChu ?? "");
  const luu = (xoa = false) => bat(async () => { const r = await luuMinhChungCongViec(id, xoa ? "" : l, xoa ? "" : g); if (r.loi) setLoi(r.loi); else { setLoi(""); setSua(false); if (xoa) { setL(""); setG(""); } } });
  if (!sua) {
    return (
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
        <Link2 strokeWidth={1.7} className="h-3.5 w-3.5 text-muc-3" aria-hidden />
        {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="font-medium text-nhan-dam underline-offset-4 hover:underline">{tenMienLink(link)}</a> : <span className="text-muc-3">Chưa có minh chứng hôm nay</span>}
        {ghiChu && <span className="text-muc-3">· {ghiChu}</span>}
        <button type="button" onClick={() => setSua(true)} className="font-medium text-nhan-dam underline-offset-4 hover:underline">{link ? "Sửa" : "Thêm link"}</button>
      </div>
    );
  }
  return (
    <div className="mt-2.5 space-y-2">
      <input value={l} onChange={(e) => setL(e.target.value)} aria-label="Link minh chứng" inputMode="url" placeholder="Dán link minh chứng (https…)" className={O_NHAP} />
      <input value={g} onChange={(e) => setG(e.target.value)} aria-label="Ghi chú ngắn" maxLength={1000} placeholder="Ghi chú ngắn (không bắt buộc)" className={O_NHAP} />
      {loi && <p role="alert" className="text-[13px] text-loi">{loi}</p>}
      <div className="flex justify-end gap-2">
        {link && <button type="button" onClick={() => luu(true)} disabled={dang} className="mr-auto text-[13px] text-muc-3 hover:text-loi">Xoá link</button>}
        <button type="button" onClick={() => { setSua(false); setLoi(""); }} className={`${NUT_PHU} !h-8 !px-3`}>Đóng</button>
        <button type="button" onClick={() => luu()} disabled={dang} className={`${NUT_CHINH} !h-8 !px-3`}>{dang ? "Đang lưu" : "Lưu"}</button>
      </div>
    </div>
  );
}
