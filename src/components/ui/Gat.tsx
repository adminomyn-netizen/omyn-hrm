"use client";

import { useState } from "react";

/** Công tắc bật/tắt dùng trong biểu mẫu: có <input hidden name> giá trị "1"/"0" để FormData lấy được. */
export function Gat({ ten, nhan, giaTriMacDinh = false, onDoi, id }: { ten?: string; nhan: string; giaTriMacDinh?: boolean; onDoi?: (v: boolean) => void; id?: string }) {
  const [bat, setBat] = useState(giaTriMacDinh);
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={bat}
      onClick={() => {
        setBat(!bat);
        onDoi?.(!bat);
      }}
      className="flex items-center gap-3 text-left text-[14px] text-muc"
    >
      <span className={`relative h-6 w-11 shrink-0 transition-colors ${bat ? "" : "bg-vien-dam/40"}`} style={{ borderRadius: 9999, ...(bat ? { background: "var(--gradient-vang)" } : {}) }}>
        <span className={`absolute top-0.5 h-5 w-5 bg-giay-sang shadow transition-all ${bat ? "left-[22px]" : "left-0.5"}`} style={{ borderRadius: 9999 }} />
      </span>
      <span>{nhan}</span>
      {ten && <input type="hidden" name={ten} value={bat ? "1" : "0"} />}
    </button>
  );
}
