import { Check, CheckCircle2, CircleDashed } from "lucide-react";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { tenMienLink } from "@/lib/bao-cao-cv";
import type { TongQuanBaoCao } from "@/lib/bao-cao-cv-data";

const gio = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

/** Bảng tổng quan: mỗi người một khối, người chưa nộp lên đầu và tô nổi. */
export function TongQuanBaoCaoBang({ tq }: { tq: TongQuanBaoCao }) {
  const chua = tq.dong.filter((d) => d.phai && !d.baoCao).length;
  return (
    <div>
      <dl className="mb-6 grid grid-cols-3 border-y border-vien">
        {[["Phải nộp", tq.phaiNop], ["Đã nộp", tq.daNop], ["Chưa nộp", chua]].map(([nhan, so], i) => (
          <div key={nhan as string} className={`px-4 py-4 ${i > 0 ? "border-l border-vien" : ""}`}>
            <dd className={`text-[28px] font-medium leading-none tabular-nums ${nhan === "Chưa nộp" && chua > 0 ? "text-canh-bao" : "text-muc"}`}>{so}</dd>
            <dt className="mt-2 text-[13px] text-muc-3">{nhan}</dt>
          </div>
        ))}
      </dl>
      {tq.dong.length === 0 ? (
        <p className="rounded-nho border border-vien bg-giay-sang p-6 text-center text-[14px] text-muc-3">Chưa có nhân viên nào thuộc diện nộp báo cáo.</p>
      ) : (
        <ul className="space-y-3">
          {tq.dong.map((d) => (
            <li key={d.nhanVienId} className={`rounded-nho border p-4 ${d.phai && !d.baoCao ? "border-canh-bao bg-canh-bao-nen/40" : "border-vien bg-giay-sang"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-muc">{d.hoTen}</div>
                  <div className="text-[13px] text-muc-3">{[d.chucDanh, d.khoi].filter(Boolean).join(" · ")}</div>
                </div>
                {d.baoCao ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-nhan-dam"><CheckCircle2 strokeWidth={1.8} className="h-4 w-4" aria-hidden />Đã nộp lúc {gio(d.baoCao.nopLuc)}</span>
                ) : d.phai ? (
                  <NhanTrangThai kieu="loi">Chưa nộp báo cáo</NhanTrangThai>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-muc-3"><CircleDashed strokeWidth={1.7} className="h-4 w-4" aria-hidden />Không phải nộp hôm nay</span>
                )}
              </div>
              <p className="mt-2 text-[13px] text-muc-2">
                {d.soViec > 0 ? `${d.xong}/${d.soViec} việc trong ngày đã xong` : "Chưa có việc nào trong ngày"}
                {d.quaHan > 0 && <span className="ml-2 font-medium text-canh-bao">{d.quaHan} việc quá hạn</span>}
              </p>
              {d.baoCao && (
                <div className="mt-2 border-t border-vien pt-2 text-[14px] text-muc-2">
                  <p className="whitespace-pre-line">{d.baoCao.tomTat}</p>
                  {d.baoCao.link && <a href={d.baoCao.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block break-all text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">{d.baoCao.link}</a>}
                </div>
              )}
              {d.viec.length > 0 && (
                <ul className="mt-2 divide-y divide-vien border-t border-vien text-[13px]">
                  {d.viec.map((m, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5 text-muc-2">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-nho border ${m.xong ? "border-transparent nut-vang" : "border-vien-dam"}`} aria-label={m.xong ? "Đã xong" : "Chưa xong"}>{m.xong ? <Check strokeWidth={2.4} className="h-3 w-3" aria-hidden /> : null}</span>
                      <span className={m.xong ? "text-muc-3 line-through decoration-muc-3" : "text-muc"}>{m.tieuDe}</span>
                      {m.moiHomNay && <NhanTrangThai kieu="cho">Mới thêm hôm nay</NhanTrangThai>}
                      {m.link ? <a href={m.link} target="_blank" rel="noopener noreferrer" className="font-medium text-nhan-dam underline-offset-4 hover:underline">{tenMienLink(m.link)}</a> : m.xong ? <span className="text-muc-3">chưa có link</span> : null}
                      {m.ghiChu && <span className="text-muc-3">· {m.ghiChu}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
