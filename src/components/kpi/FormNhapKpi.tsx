"use client";

import { useState, useTransition } from "react";
import { luuKetQuaKpi } from "@/app/(app)/kpi/actions";
import { NUT_CHINH, O_NHAP } from "@/components/ui/dinh-dang";

export type NguoiNhap = { id: string; ten: string; chiTieu: { id: string; ten: string; donVi: string; muc: number; chieu: string; gia: string }[] };

/** Bảng nhập kết quả một ngày: mỗi người một khối, mỗi chỉ tiêu một ô số (để trống = chưa báo / xoá). */
export function FormNhapKpi({ ngay, nguoi }: { ngay: string; nguoi: NguoiNhap[] }) {
  const [dang, bat] = useTransition();
  const [tin, datTin] = useState<{ loi?: string; ok?: string } | null>(null);
  return (
    <form
      action={(fd) => bat(async () => {
        const r = await luuKetQuaKpi(fd);
        datTin(r.loi ? { loi: r.loi } : { ok: `Đã lưu ${r.daLuu ?? 0} ô.` });
      })}
      className="space-y-4"
    >
      <input type="hidden" name="ngay" value={ngay} />
      <ul className="space-y-3">
        {nguoi.map((n) => (
          <li key={n.id} className="the-noi rounded-nho border border-vien bg-giay-sang p-4">
            <div className="mb-3 text-[15px] font-semibold text-muc">{n.ten}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {n.chiTieu.map((c) => (
                <label key={c.id} className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-muc-2">{c.ten}<span className="ml-1.5 font-normal text-muc-3">mục tiêu {c.muc.toLocaleString("vi-VN")}{c.donVi ? ` ${c.donVi}` : ""}{c.chieu === "Càng thấp càng tốt" ? " · càng thấp càng tốt" : ""}</span></span>
                  <input name={`v|${n.id}|${c.id}`} defaultValue={c.gia} inputMode="decimal" autoComplete="off" placeholder="Chưa báo" className={O_NHAP} />
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-nho border border-vien bg-giay-sang p-3">
        <button type="submit" disabled={dang} className={NUT_CHINH}>{dang ? "Đang lưu…" : "Lưu kết quả"}</button>
        {tin?.ok && <span role="status" className="text-[14px] text-nhan-dam">{tin.ok}</span>}
        {tin?.loi && <span role="alert" className="text-[14px] text-loi">{tin.loi}</span>}
      </div>
    </form>
  );
}
