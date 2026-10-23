"use client";

import { useState } from "react";
import { Chon } from "./Chon";

const pad = (n: number) => String(n).padStart(2, "0");
const GIO = Array.from({ length: 24 }, (_, i) => ({ gia_tri: pad(i), nhan: `${pad(i)} giờ` }));
const PHUT = Array.from({ length: 60 }, (_, i) => ({ gia_tri: pad(i), nhan: `${pad(i)} phút` }));

/** Ô chọn giờ theo bộ nhận diện (hai ô chọn: giờ và phút), thay cho <input type="time"> mặc định.
 * `onDoi` nhận "HH:MM" khi đã chọn đủ giờ và phút, chuỗi rỗng khi chưa đủ. */
export function GioChon({ id, ariaLabel, giaTriMacDinh = "", onDoi }: { id?: string; ariaLabel: string; giaTriMacDinh?: string; onDoi: (gio: string) => void }) {
  const [g, setG] = useState(giaTriMacDinh.slice(0, 2));
  const [p, setP] = useState(giaTriMacDinh.slice(3, 5));
  const doi = (gio: string, phut: string) => onDoi(gio && phut ? `${gio}:${phut}` : "");
  return (
    <div className="grid grid-cols-2 gap-2">
      <Chon id={id} ariaLabel={`${ariaLabel} (giờ)`} trong="Giờ" giaTri={g} onDoi={(v) => { setG(v); doi(v, p); }} luaChon={GIO} />
      <Chon ariaLabel={`${ariaLabel} (phút)`} trong="Phút" giaTri={p} onDoi={(v) => { setP(v); doi(g, v); }} luaChon={PHUT} />
    </div>
  );
}
