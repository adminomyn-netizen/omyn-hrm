"use client";

import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";

/** Chọn người để xem mục tiêu (trưởng phòng: cấp dưới; Quản trị/Kỹ thuật: bất kỳ ai). */
export function ChonNguoiBsc({ nvId, nam, thang, ds }: { nvId: string; nam: number; thang: number; ds: { id: string; ten: string }[] }) {
  const r = useRouter();
  return <Chon id="bsc-nv" ten="nv" trong="Chọn người" giaTriMacDinh={nvId} luaChon={ds.map((x) => ({ gia_tri: x.id, nhan: x.ten }))} onDoi={(v) => r.push(`/bsc/cua-toi?nam=${nam}&thang=${thang}&nv=${v}`)} />;
}
