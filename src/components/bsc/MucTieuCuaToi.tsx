"use client";

import { useState, useTransition } from "react";
import { capNhatTienDoViec, luuMucTieuCaNhan } from "@/app/(app)/bsc/actions";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { ThanhDiem } from "@/components/bsc/ThanhDiem";

export type ChiSoCaNhan = { id: string; ten: string; donVi: string; diem: number | null; ke: string; thuc: string };
export type ViecBsc = { id: string; ten: string; chiSo: string; han: string; tienDo: number; trangThai: "Chưa bắt đầu" | "Đang làm" | "Hoàn thành" | "Trễ hạn"; uuTien: string };
const KIEU = { "Chưa bắt đầu": "tram", "Đang làm": "cho", "Hoàn thành": "tot", "Trễ hạn": "loi" } as const;
const BUOC = [0, 25, 50, 75, 100];

/** Mục tiêu cá nhân một tháng: người được giao nhập THỰC TẾ của mình (kế hoạch do quản lý đặt), cập nhật tiến độ việc bằng vài nút bấm. */
export function MucTieuCuaToi({ nv, nam, thang, chiSo, viec, suaKeHoach, khoa }: { nv: string; nam: number; thang: number; chiSo: ChiSoCaNhan[]; viec: ViecBsc[]; suaKeHoach: boolean; khoa: boolean }) {
  const [dang, bat] = useTransition();
  const [tin, datTin] = useState<{ ok?: string; loi?: string } | null>(null);
  return (
    <div className="space-y-8">
      <section aria-label="Chỉ số của tôi">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">Chỉ số được giao · tháng {thang}</h2>
        {chiSo.length === 0 ? <p className="rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-3">Chưa có chỉ số nào được giao cho năm {nam}. Quản trị giao ở “Giao chỉ số cho nhân sự”.</p> : (
          <form action={(fd) => bat(async () => { const r = await luuMucTieuCaNhan(fd); datTin(r.loi ? { loi: r.loi } : { ok: "Đã lưu." }); })} className="space-y-3">
            <input type="hidden" name="nv" value={nv} /><input type="hidden" name="nam" value={nam} /><input type="hidden" name="thang" value={thang} />
            {khoa && <p role="status" className="rounded-nho border border-vien bg-canh-bao-nen p-3.5 text-[14px] text-canh-bao">Tháng {thang}/{nam} đã khoá, chỉ xem.</p>}
            <ul className="space-y-2.5">
              {chiSo.map((c) => (
                <li key={c.id} className="the-noi rounded-nho border border-vien bg-giay-sang p-4">
                  <div className="mb-2 text-[15px] font-semibold text-muc">{c.ten}{c.donVi && <span className="ml-1.5 text-[13px] font-normal text-muc-3">({c.donVi})</span>}</div>
                  <ThanhDiem diem={c.diem} nho />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block text-[12px] text-muc-3">Kế hoạch{!suaKeHoach && " (quản lý đặt)"}<input name={`kh|${c.id}`} defaultValue={c.ke} inputMode="decimal" autoComplete="off" disabled={khoa || !suaKeHoach} className={`${O_NHAP} mt-1`} /></label>
                    <label className="block text-[12px] text-muc-3">Thực tế của tôi<input name={`tt|${c.id}`} defaultValue={c.thuc} inputMode="decimal" autoComplete="off" disabled={khoa} className={`${O_NHAP} mt-1`} /></label>
                  </div>
                </li>
              ))}
            </ul>
            {!khoa && <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={dang} className={NUT_CHINH}>{dang ? "Đang lưu…" : "Lưu"}</button>{tin?.ok && <span role="status" className="text-[14px] text-nhan-dam">{tin.ok}</span>}{tin?.loi && <span role="alert" className="text-[14px] text-loi">{tin.loi}</span>}</div>}
          </form>
        )}
      </section>

      <section aria-label="Việc cần làm">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.08em] text-muc-3">Việc để đạt mục tiêu</h2>
        {viec.length === 0 ? <p className="rounded-nho border border-vien bg-giay-sang p-4 text-[14px] text-muc-3">Chưa có kế hoạch hành động nào.</p> : (
          <ul className="space-y-2.5">
            {viec.map((v) => (
              <li key={v.id} className="the-noi rounded-nho border border-vien bg-giay-sang p-4">
                <div className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-semibold text-muc">{v.ten}</span><NhanTrangThai kieu={KIEU[v.trangThai]}>{v.trangThai}</NhanTrangThai>{v.uuTien <= "P1" && <NhanTrangThai kieu="cho">{v.uuTien}</NhanTrangThai>}</div>
                <div className="mt-1 text-[12px] text-muc-3">{v.chiSo} · hạn {v.han.split("-").reverse().join("/")}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Tiến độ">
                  {BUOC.map((b) => <button key={b} type="button" disabled={dang} aria-pressed={v.tienDo === b} onClick={() => bat(async () => { const r = await capNhatTienDoViec(v.id, b); datTin(r.loi ? { loi: r.loi } : null); })} className={`${v.tienDo === b ? NUT_CHINH : NUT_PHU} !h-8 !px-3 text-[13px]`}>{b}%</button>)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
