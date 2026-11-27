"use client";

import { useRef, useState } from "react";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { quetDongGoi, quetHangHoan, type KetQuaQuet } from "@/app/(app)/kho/quet-dong-goi/actions";

type Che = "dong" | "hoan";
type Dong = KetQuaQuet & { gio: string; che: Che; key: number };
const KENH = ["Sàn", "Sỉ và đại lý", "Livestream", "Khác"];
const MAU = { tot: "text-muc", canhBao: "text-canh-bao", loi: "text-loi" } as const;
const NHAN = { tot: "Xong", canhBao: "Xem lại", loi: "Lỗi" } as const;
const gio = () => new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Máy quét mã vạch gõ như bàn phím rồi nhấn Enter, nên chỉ cần để con trỏ ở ô mã. Mỗi lần quét ghi một dòng kết quả bên dưới. */
export function QuetDongGoi() {
  const [che, setChe] = useState<Che>("dong");
  const [ma, setMa] = useState("");
  const [vanDon, setVanDon] = useState("");
  const [kenh, setKenh] = useState("Sàn");
  const [cho, setCho] = useState<{ ma: string; vanDon: string } | null>(null);
  const [dong, setDong] = useState<Dong[]>([]);
  const [dang, setDang] = useState(false);
  const khoa = useRef(false);
  const oMa = useRef<HTMLInputElement>(null);
  const stt = useRef(0);

  const them = (r: KetQuaQuet, c: Che) => setDong((d) => [{ ...r, gio: gio(), che: c, key: ++stt.current }, ...d].slice(0, 40));
  const chay = async (maQuet: string, vd: string, taoMoi: boolean) => {
    if (khoa.current || !maQuet.trim()) return;
    khoa.current = true; setDang(true);
    try {
      const r = che === "dong" ? await quetDongGoi(maQuet, vd, taoMoi, kenh) : await quetHangHoan(maQuet);
      them(r, che);
      if (r.canTao) setCho({ ma: maQuet, vanDon: vd });
      else { setCho(null); setMa(""); setVanDon(""); }
    } catch { them({ muc: "loi", thongBao: "Mất kết nối, quét lại." }, che); }
    finally { khoa.current = false; setDang(false); oMa.current?.focus(); }
  };
  const nhoDong = dong.filter((d) => d.muc === "tot").length;
  return (
    <div className="space-y-4">
      <div role="group" aria-label="Chế độ quét" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={che === "dong"} className={che === "dong" ? NUT_CHINH : NUT_PHU} onClick={() => { setChe("dong"); setCho(null); oMa.current?.focus(); }}>Đóng gói</button>
        <button type="button" aria-pressed={che === "hoan"} className={che === "hoan" ? NUT_CHINH : NUT_PHU} onClick={() => { setChe("hoan"); setCho(null); oMa.current?.focus(); }}>Hàng hoàn về</button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void chay(ma, vanDon, false); }} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={NHAN_O} htmlFor="quet-ma">{che === "dong" ? "Mã đơn (hoặc mã vận đơn)" : "Mã vận đơn hoàn (hoặc mã đơn)"}</label>
          <input id="quet-ma" ref={oMa} autoFocus autoComplete="off" inputMode="text" value={ma} maxLength={100} onChange={(e) => { setMa(e.target.value); setCho(null); }} className={O_NHAP} placeholder="Quét mã rồi Enter" />
        </div>
        {che === "dong" && (
          <div>
            <label className={NHAN_O} htmlFor="quet-vd">Mã vận đơn quét kèm (không bắt buộc)</label>
            <input id="quet-vd" autoComplete="off" value={vanDon} maxLength={100} onChange={(e) => setVanDon(e.target.value)} className={O_NHAP} placeholder="Gắn vào đơn đang đóng" />
          </div>
        )}
        <div className="sm:col-span-2"><button type="submit" className={NUT_CHINH} disabled={dang || !ma.trim()}>{dang ? "Đang ghi" : "Ghi"}</button></div>
      </form>
      {cho && che === "dong" && (
        <div role="group" aria-label="Ghi đơn mới" className="grid gap-3 rounded-nho border border-vien px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div><label className={NHAN_O}>Kênh của đơn mới</label><Chon ariaLabel="Kênh của đơn mới" giaTri={kenh} onDoi={setKenh} luaChon={KENH.map((k) => ({ gia_tri: k, nhan: k }))} /></div>
          <button type="button" className={NUT_PHU} disabled={dang} onClick={() => void chay(cho.ma, cho.vanDon, true)}>Ghi đơn mới và đóng gói</button>
        </div>
      )}
      <div aria-live="polite" className="text-[13px] text-muc-3">{dong.length > 0 ? `Phiên này: ${nhoDong} lần ghi xong, ${dong.length - nhoDong} lần cần xem lại. Mở lại trang thì danh sách này mất, sổ vẫn còn.` : "Chưa quét mã nào trong phiên này."}</div>
      {dong.length > 0 && (
        <ul className="divide-y divide-vien rounded-nho border border-vien">
          {dong.map((d) => (
            <li key={d.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5 text-[14px]">
              <span className="tabular-nums text-muc-3">{d.gio}</span>
              <span className={`font-medium ${MAU[d.muc]}`}>{NHAN[d.muc]}</span>
              <span className="min-w-0 flex-1 text-muc-2">{d.thongBao}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
