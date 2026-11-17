"use client";

import { useState, useTransition } from "react";
import { luuKetQuaKpiThang } from "@/app/(app)/kpi/thang/actions";
import { NUT_CHINH, O_NHAP } from "@/components/ui/dinh-dang";

export type DongThang = { id: string; ten: string; donVi: string; muc: number; chieu: string; gia: string; phanTram: number | null };
export type NguoiThangForm = { id: string; ten: string; chucDanh: string; diem: number | null; daBao: number; tong: number; chiTieu: DongThang[] };

const SO = (n: number) => n.toLocaleString("vi-VN");

/** Nhập và xem kết quả KPI một tháng: mỗi người một khối (nhóm theo vị trí), mỗi chỉ tiêu một ô số; để trống = chưa báo / xoá. */
export function FormKpiThang({ thang, nguoi }: { thang: string; nguoi: NguoiThangForm[] }) {
  const [dang, bat] = useTransition();
  const [tin, datTin] = useState<{ loi?: string; ok?: string } | null>(null);
  const viTri = [...new Set(nguoi.map((n) => n.chucDanh))];
  return (
    <form
      action={(fd) => bat(async () => {
        const r = await luuKetQuaKpiThang(fd);
        datTin(r.loi ? { loi: r.loi } : { ok: `Đã lưu ${r.daLuu ?? 0} ô.` });
      })}
      className="space-y-6"
    >
      <input type="hidden" name="thang" value={thang} />
      {viTri.map((vt) => (
        <section key={vt} aria-label={vt}>
          <h2 className="chu-tieu-de text-[18px] text-muc">{vt}</h2>
          <ul className="mt-3 space-y-3">
            {nguoi.filter((n) => n.chucDanh === vt).map((n) => (
              <li key={n.id} className="the-noi rounded-nho border border-vien bg-giay-sang p-4">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[15px] font-semibold text-muc">{n.ten}</span>
                  <span className="text-[13px] text-muc-2">
                    {n.diem === null ? "Chưa có điểm" : `Điểm tháng ${n.diem.toLocaleString("vi-VN")}`} · đã báo {n.daBao}/{n.tong} chỉ tiêu
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {n.chiTieu.map((c) => (
                    <label key={c.id} className="block">
                      <span className="mb-1.5 block text-[13px] font-medium text-muc-2">
                        {c.ten}
                        <span className="ml-1.5 font-normal text-muc-3">mục tiêu {SO(c.muc)}{c.donVi ? ` ${c.donVi}` : ""}{c.chieu === "Càng thấp càng tốt" ? " · càng thấp càng tốt" : ""}</span>
                      </span>
                      <input name={`v|${n.id}|${c.id}`} defaultValue={c.gia} inputMode="decimal" autoComplete="off" placeholder="Chưa báo" className={O_NHAP} />
                      {c.phanTram !== null && <span className="mt-1 block text-[12px] text-muc-3">Đạt {c.phanTram.toLocaleString("vi-VN")}%</span>}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-nho border border-vien bg-giay-sang p-3">
        <button type="submit" disabled={dang} className={NUT_CHINH}>{dang ? "Đang lưu…" : "Lưu kết quả tháng"}</button>
        {tin?.ok && <span role="status" className="text-[14px] text-nhan-dam">{tin.ok}</span>}
        {tin?.loi && <span role="alert" className="text-[14px] text-loi">{tin.loi}</span>}
      </div>
    </form>
  );
}
