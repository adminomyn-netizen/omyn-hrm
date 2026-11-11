"use client";

import { useMemo, useState } from "react";
import { O_NHAP } from "@/components/ui/dinh-dang";

/** Chọn nhiều nhân viên trong biểu mẫu: danh sách tích chọn có ô tìm tên. Mỗi người được chọn gửi một giá trị `ten` (FormData.getAll). */
export function ChonNhieuNguoi({ id, ten, nv, daChon }: { id: string; ten: string; nv: { id: string; ten: string }[]; daChon: string[] }) {
  const [chon, setChon] = useState<string[]>(daChon);
  const [tim, setTim] = useState("");
  const ds = useMemo(() => nv.filter((n) => n.ten.toLowerCase().includes(tim.trim().toLowerCase())), [nv, tim]);
  const doi = (nvId: string) => setChon((c) => (c.includes(nvId) ? c.filter((x) => x !== nvId) : [...c, nvId]));
  const tenCua = (nvId: string) => nv.find((n) => n.id === nvId)?.ten ?? "(đã nghỉ)";
  return (
    <div>
      {chon.map((x) => <input key={x} type="hidden" name={ten} value={x} />)}
      <div className="mb-2 flex flex-wrap gap-1.5" aria-live="polite">
        {chon.length === 0 ? <span className="text-[13px] text-muc-3">Chưa chọn ai</span> : chon.map((x) => (
          <button key={x} type="button" onClick={() => doi(x)} aria-label={`Bỏ ${tenCua(x)}`} className="rounded-tag bg-giay-tram px-2.5 py-1 text-[13px] text-muc hover:text-loi">{tenCua(x)} ×</button>
        ))}
      </div>
      <input id={id} type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm tên để thêm" className={O_NHAP} />
      <ul className="mt-2 max-h-[200px] divide-y divide-vien overflow-y-auto border border-vien" style={{ borderRadius: 8 }}>
        {ds.map((n) => (
          <li key={n.id}>
            <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[14px] text-muc">
              <input type="checkbox" checked={chon.includes(n.id)} onChange={() => doi(n.id)} />
              {n.ten}
            </label>
          </li>
        ))}
        {ds.length === 0 && <li className="px-3 py-2 text-[13px] text-muc-3">Không thấy tên này</li>}
      </ul>
    </div>
  );
}
