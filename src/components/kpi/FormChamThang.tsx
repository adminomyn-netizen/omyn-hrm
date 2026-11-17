"use client";

import { useState, useTransition } from "react";
import { luuChamKpiThang } from "@/app/(app)/kpi/thang/actions";
import { NUT_CHINH, O_NHAP } from "@/components/ui/dinh-dang";
import { diemThangCuaNguoi } from "@/lib/kpi";

export type NhomForm = { id: string; ten: string; tyTrong: number };
export type NguoiChamForm = { id: string; ten: string; cuaViTri: string; nhom: NhomForm[]; gia: Record<string, string> };

/** Chấm KPI một tháng: mỗi người một khối, mỗi nhóm công việc một ô "% hoàn thành" (0–100). Để trống = chưa chấm. Điểm tính ngay khi gõ. */
export function FormChamThang({ thang, nguoi }: { thang: string; nguoi: NguoiChamForm[] }) {
  const [dang, bat] = useTransition();
  const [tin, datTin] = useState<{ loi?: string; ok?: string } | null>(null);
  const [gia, datGia] = useState<Record<string, string>>(() => Object.fromEntries(nguoi.flatMap((n) => n.nhom.map((h) => [`${n.id}|${h.id}`, n.gia[h.id] ?? ""]))));
  const viTri = [...new Set(nguoi.map((n) => n.cuaViTri))];
  const diemCua = (n: NguoiChamForm) => {
    const cham = n.nhom.flatMap((h) => {
      const s = (gia[`${n.id}|${h.id}`] ?? "").trim().replace(",", ".");
      const v = Number(s);
      return s !== "" && Number.isFinite(v) && v >= 0 && v <= 100 ? [{ nhomId: h.id, tyLe: v, tyTrong: h.tyTrong }] : [];
    });
    return diemThangCuaNguoi(cham, n.nhom.length);
  };
  return (
    <form
      action={(fd) => bat(async () => {
        const r = await luuChamKpiThang(fd);
        datTin(r.loi ? { loi: r.loi } : { ok: `Đã lưu ${r.daLuu ?? 0} ô.` });
      })}
      className="space-y-6"
    >
      <input type="hidden" name="thang" value={thang} />
      {viTri.map((vt) => (
        <section key={vt} aria-label={`Chấm ${vt}`}>
          <h3 className="text-[15px] font-semibold text-muc">Chấm điểm: {vt}</h3>
          <ul className="mt-3 space-y-3">
            {nguoi.filter((n) => n.cuaViTri === vt).map((n) => {
              const d = diemCua(n);
              return (
                <li key={n.id} className="the-noi rounded-nho border border-vien bg-giay-sang p-4">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] font-semibold text-muc">{n.ten}</span>
                    <span className="text-[13px] text-muc-2">
                      {d.diem === null ? "Chưa có điểm" : `Điểm tháng ${d.diem.toLocaleString("vi-VN")}/100`} · đã chấm {d.daCham}/{d.tong} nhóm
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {n.nhom.map((h) => (
                      <label key={h.id} className="block">
                        <span className="mb-1.5 block text-[13px] font-medium text-muc-2">{h.ten}<span className="ml-1.5 font-normal text-muc-3">tỷ trọng {h.tyTrong.toLocaleString("vi-VN")}%</span></span>
                        <input
                          name={`v|${n.id}|${h.id}`}
                          value={gia[`${n.id}|${h.id}`] ?? ""}
                          onChange={(e) => datGia((g) => ({ ...g, [`${n.id}|${h.id}`]: e.target.value }))}
                          inputMode="decimal" autoComplete="off" placeholder="% hoàn thành (0–100)" className={O_NHAP}
                        />
                      </label>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {tin && <p role={tin.loi ? "alert" : "status"} className={`rounded-nho px-3 py-2.5 text-[14px] ${tin.loi ? "bg-loi-nen text-loi" : "bg-nhan-nhat text-nhan-dam"}`}>{tin.loi ?? tin.ok}</p>}
      <div className="sticky bottom-3 flex justify-end">
        <button type="submit" disabled={dang} className={NUT_CHINH}>{dang ? "Đang lưu" : "Lưu điểm tháng"}</button>
      </div>
    </form>
  );
}
