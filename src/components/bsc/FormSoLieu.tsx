"use client";

import { useState, useTransition } from "react";
import { Lock, LockOpen } from "lucide-react";
import { khoaThangBsc, luuSoLieuBsc } from "@/app/(app)/bsc/actions";
import { NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

export type DongSoLieu = { id: string; ten: string; donVi: string; goc: string; muc: string; ke: string; thuc: string };

/** Nhập kế hoạch + thực tế một tháng cho mọi chỉ số, gom theo mục tiêu. Tháng đã khoá thì chỉ xem; quản trị mở khoá ngay tại đây. */
export function FormSoLieu({ nam, thang, dong, khoa }: { nam: number; thang: number; dong: DongSoLieu[]; khoa: boolean }) {
  const [dang, bat] = useTransition();
  const [tin, datTin] = useState<{ ok?: string; loi?: string } | null>(null);
  const nhom = new Map<string, DongSoLieu[]>();
  for (const d of dong) (nhom.get(`${d.goc} › ${d.muc}`) ?? nhom.set(`${d.goc} › ${d.muc}`, []).get(`${d.goc} › ${d.muc}`)!).push(d);
  return (
    <form action={(fd) => bat(async () => { const r = await luuSoLieuBsc(fd); datTin(r.loi ? { loi: r.loi } : { ok: `Đã lưu ${r.daLuu ?? 0} chỉ số.` }); })} className="space-y-5">
      <input type="hidden" name="nam" value={nam} /><input type="hidden" name="thang" value={thang} />
      {khoa && <p role="status" className="rounded-nho border border-vien bg-canh-bao-nen p-3.5 text-[14px] text-canh-bao">Tháng {thang}/{nam} đã khoá, chỉ xem. Mở khoá bên dưới nếu cần sửa.</p>}
      {[...nhom].map(([ten, ds]) => (
        <section key={ten} aria-label={ten}>
          <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">{ten}</h2>
          <ul className="space-y-2.5">
            {ds.map((d) => (
              <li key={d.id} className="the-noi rounded-nho border border-vien bg-giay-sang p-3.5">
                <div className="mb-2 text-[14px] font-medium text-muc">{d.ten}{d.donVi && <span className="ml-1.5 font-normal text-muc-3">({d.donVi})</span>}</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-[12px] text-muc-3">Kế hoạch<input name={`kh|${d.id}`} defaultValue={d.ke} inputMode="decimal" autoComplete="off" disabled={khoa} className={`${O_NHAP} mt-1`} /></label>
                  <label className="block text-[12px] text-muc-3">Thực tế<input name={`tt|${d.id}`} defaultValue={d.thuc} inputMode="decimal" autoComplete="off" disabled={khoa} className={`${O_NHAP} mt-1`} /></label>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-nho border border-vien bg-giay-sang p-3">
        {!khoa && <button type="submit" disabled={dang} className={NUT_CHINH}>{dang ? "Đang lưu…" : "Lưu số liệu"}</button>}
        <button type="button" disabled={dang} onClick={() => { if (!khoa && !window.confirm(`Khoá tháng ${thang}/${nam}? Sau khi khoá không ai sửa được số liệu tháng này.`)) return; bat(async () => { const r = await khoaThangBsc(nam, thang, !khoa); datTin(r.loi ? { loi: r.loi } : { ok: khoa ? "Đã mở khoá." : "Đã khoá tháng." }); }); }} className={`${NUT_PHU} inline-flex items-center gap-2`}>
          {khoa ? <LockOpen strokeWidth={1.7} className="h-4 w-4" aria-hidden /> : <Lock strokeWidth={1.7} className="h-4 w-4" aria-hidden />}{khoa ? "Mở khoá tháng" : "Khoá tháng"}
        </button>
        {tin?.ok && <span role="status" className="text-[14px] text-nhan-dam">{tin.ok}</span>}
        {tin?.loi && <span role="alert" className="text-[14px] text-loi">{tin.loi}</span>}
      </div>
    </form>
  );
}
