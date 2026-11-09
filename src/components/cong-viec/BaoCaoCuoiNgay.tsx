"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { nopBaoCaoNgay } from "@/app/(app)/cong-viec/actions";
import { NHAN_O, NUT_CHINH, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";

export type BaoCaoHomNay = { tomTat: string; link: string | null; nopLuc: string } | null;

/** Báo cáo cuối ngày của chính mình: vài dòng kết quả + một link minh chứng chung. Nộp rồi vẫn sửa lại được trong ngày. */
export function BaoCaoCuoiNgay({ baoCao, soViec, xong }: { baoCao: BaoCaoHomNay; soViec: number; xong: number }) {
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [mo, setMo] = useState(!baoCao);
  const ref = useRef<HTMLFormElement>(null);
  const gui = () => {
    if (!ref.current) return;
    const fd = new FormData(ref.current);
    bat(async () => { const r = await nopBaoCaoNgay(fd); if (r.loi) setLoi(r.loi); else { setLoi(""); setMo(false); } });
  };
  const gio = baoCao ? new Date(baoCao.nopLuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "";
  return (
    <section aria-label="Báo cáo cuối ngày" className="mb-6 rounded-nho border border-vien bg-giay-sang p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-muc">Báo cáo công việc hôm nay</h2>
          <p className="mt-0.5 text-[13px] text-muc-3">{soViec > 0 ? `${xong}/${soViec} việc đã xong. ` : "Chưa có việc nào trong ngày. "}Cuối ngày ghi kết quả và gắn link minh chứng.</p>
        </div>
        {baoCao && !mo && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-nhan-dam"><CheckCircle2 strokeWidth={1.8} className="h-4 w-4" aria-hidden />Đã nộp lúc {gio}</span>
            <button type="button" onClick={() => setMo(true)} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Sửa báo cáo</button>
          </div>
        )}
      </div>
      {mo && (
        <form ref={ref} className="mt-3 space-y-3" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
          <div><label htmlFor="bc-tt" className={NHAN_O}>Kết quả hôm nay *</label><textarea id="bc-tt" name="tom_tat" defaultValue={baoCao?.tomTat ?? ""} placeholder="Đã làm được gì, còn dở gì, vướng gì" className={`${O_NHIEU_DONG} min-h-[88px]`} maxLength={2000} /></div>
          <div><label htmlFor="bc-lk" className={NHAN_O}>Link minh chứng (không bắt buộc)</label><input id="bc-lk" name="link" defaultValue={baoCao?.link ?? ""} inputMode="url" placeholder="Dán link bảng tính, tài liệu, ảnh, bài đăng… (bắt đầu bằng https)" className={O_NHAP} /></div>
          {loi && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</p>}
          <div className="flex justify-end gap-2">
            {baoCao && <button type="button" onClick={() => { setMo(false); setLoi(""); }} className="text-[13px] text-muc-3 hover:text-muc">Đóng</button>}
            <button type="button" onClick={gui} disabled={dang} className={`${NUT_CHINH} inline-flex items-center gap-2`}><Send strokeWidth={1.8} className="h-4 w-4" aria-hidden />{dang ? "Đang nộp" : baoCao ? "Cập nhật báo cáo" : "Nộp báo cáo"}</button>
          </div>
        </form>
      )}
      {baoCao && !mo && (
        <div className="mt-3 border-t border-vien pt-3 text-[14px] text-muc-2">
          <p className="whitespace-pre-line">{baoCao.tomTat}</p>
          {baoCao.link && <a href={baoCao.link} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block break-all text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">{baoCao.link}</a>}
        </div>
      )}
    </section>
  );
}
