"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";

const THANG = Array.from({ length: 12 }, (_, i) => ({ gia_tri: String(i + 1), nhan: `Tháng ${i + 1}` }));

/** Thanh chọn thời gian của lịch chấm công: nhảy tháng liền kề, chọn thẳng tháng/năm, hoặc tuỳ chỉnh khoảng ngày. */
export function BoLocThoiGian({ nam, thang, tu, den, homNay }: { nam: number; thang: number; tu?: string; den?: string; homNay: { nam: number; thang: number } }) {
  const router = useRouter();
  const [khoang, setKhoang] = useState(!!(tu && den));
  const [tuNgay, setTuNgay] = useState(tu ?? "");
  const [denNgay, setDenNgay] = useState(den ?? "");
  const [loi, setLoi] = useState<string | undefined>();

  const sangThang = (n: number, t: number) => {
    const d = new Date(n, t - 1, 1);
    router.push(`/cham-cong?nam=${d.getFullYear()}&thang=${d.getMonth() + 1}`);
  };
  const namLuaChon = Array.from({ length: 7 }, (_, i) => String(homNay.nam - 3 + i)).map((n) => ({ gia_tri: n, nhan: n }));
  const xem = () => {
    if (!tuNgay || !denNgay) return setLoi("Chọn đủ ngày bắt đầu và ngày kết thúc.");
    if (tuNgay > denNgay) return setLoi("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
    if ((Date.parse(denNgay) - Date.parse(tuNgay)) / 864e5 > 92) return setLoi("Khoảng ngày tối đa 93 ngày (khoảng 3 tháng).");
    setLoi(undefined);
    router.push(`/cham-cong?tu=${tuNgay}&den=${denNgay}`);
  };

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div role="tablist" aria-label="Kiểu xem" className="inline-flex rounded-nho border border-vien-dam p-0.5">
          {[[false, "Theo tháng"], [true, "Tuỳ chỉnh khoảng ngày"]].map(([v, nhan]) => (
            <button key={String(nhan)} type="button" role="tab" aria-selected={khoang === v} onClick={() => setKhoang(v as boolean)} className={`h-9 rounded-[6px] px-3.5 text-[13px] font-medium ${khoang === v ? "bg-nhan-nhat text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{nhan as string}</button>
          ))}
        </div>

        {!khoang ? (
          <>
            <button type="button" aria-label="Tháng trước" onClick={() => sangThang(nam, thang - 1)} className="flex h-10 w-10 items-center justify-center rounded-nho border border-vien-dam text-muc-2 hover:bg-giay-tram"><ChevronLeft size={18} /></button>
            <Chon ariaLabel="Chọn tháng" giaTri={String(thang)} onDoi={(v) => sangThang(nam, Number(v))} luaChon={THANG} className="w-[130px]" />
            <Chon ariaLabel="Chọn năm" giaTri={String(nam)} onDoi={(v) => sangThang(Number(v), thang)} luaChon={namLuaChon} className="w-[100px]" />
            <button type="button" aria-label="Tháng sau" onClick={() => sangThang(nam, thang + 1)} className="flex h-10 w-10 items-center justify-center rounded-nho border border-vien-dam text-muc-2 hover:bg-giay-tram"><ChevronRight size={18} /></button>
            <button type="button" onClick={() => sangThang(homNay.nam, homNay.thang)} className={NUT_PHU}>Tháng này</button>
          </>
        ) : (
          <>
            <NgayChon ariaLabel="Từ ngày" giaTri={tuNgay} onDoi={setTuNgay} tuNam={homNay.nam - 3} denNam={homNay.nam + 1} className="w-[170px]" />
            <span className="text-[13px] text-muc-3">đến</span>
            <NgayChon ariaLabel="Đến ngày" giaTri={denNgay} onDoi={setDenNgay} tuNam={homNay.nam - 3} denNam={homNay.nam + 1} className="w-[170px]" />
            <button type="button" onClick={xem} className={NUT_CHINH}>Xem</button>
          </>
        )}
      </div>
      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2 text-[13px] text-loi">{loi}</div>}
    </div>
  );
}
