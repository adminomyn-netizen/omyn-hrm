"use client";

import { useState, useTransition } from "react";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { NGUYEN_NHAN_LECH } from "@/lib/doi-soat-don";
import { capNhatDongDoiSoat } from "@/app/(app)/kinh-doanh/doi-soat-don/actions";

const LUA_CHON = [{ gia_tri: "", nhan: "Chưa chọn" }, ...NGUYEN_NHAN_LECH.map((n) => ({ gia_tri: n, nhan: n }))];

/** Sửa nguyên nhân lệch, đã xử lý và ghi chú của một dòng đối soát. */
export function DongDoiSoatSua({ id, nguyenNhan, daXuLy, ghiChu, chiXem }: { id: string; nguyenNhan: string | null; daXuLy: boolean; ghiChu: string | null; chiXem: boolean }) {
  const [nn, setNn] = useState(nguyenNhan ?? "");
  const [xong, setXong] = useState(daXuLy);
  const [gc, setGc] = useState(ghiChu ?? "");
  const [tb, setTb] = useState<string | null>(null);
  const [dang, bat] = useTransition();
  if (chiXem) return <p className="text-[13px] text-muc-2">{daXuLy ? "Đã xử lý. " : ""}{nguyenNhan ?? ""}{ghiChu ? ` · ${ghiChu}` : ""}</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
      <Chon ariaLabel="Nguyên nhân lệch" giaTri={nn} onDoi={(v) => { setNn(v); setTb(null); }} luaChon={LUA_CHON} />
      <input aria-label="Ghi chú" value={gc} maxLength={500} onChange={(e) => { setGc(e.target.value); setTb(null); }} className={O_NHAP} placeholder="Ghi chú" />
      <div className="flex items-center gap-3">
        <Gat nhan="Đã xử lý" giaTriMacDinh={daXuLy} onDoi={(v) => { setXong(v); setTb(null); }} />
        <button type="button" className={NUT_PHU} disabled={dang} onClick={() => bat(async () => { const r = await capNhatDongDoiSoat(id, nn, xong, gc); setTb(r.loi ?? "Đã lưu."); })}>{dang ? "Đang lưu" : "Lưu"}</button>
      </div>
      {tb && <p role="status" className="text-[13px] text-muc-2 sm:col-span-3">{tb}</p>}
    </div>
  );
}
