"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import { duyetSuaChat, guiTinChat, layChat, type TrangChat } from "@/app/chat-actions";

/** Ảnh đại diện Tula. Hiện là ảnh tạm (chữ T trên nền xanh AMIA); khi có ảnh thật chỉ cần thay tệp này (vuông, ≤ 100KB) và đổi đường dẫn ở đây. */
const ANH_TULA = "/tula-avatar.svg";

/** Lời nhắc ở bong bóng cạnh avatar khi khung chat đang đóng: thay phiên, thân thiện, xưng "em", gọi người dùng là "mình". */
const LOI_NHAC = [
  "Xin chào! Mình cần hỗ trợ gì thì cứ chat với Tula ở đây nhé.",
  "Xin chào, Tula đây! Cần em giúp gì không ạ?",
  "Mình cần tra chấm công hay tìm nhân viên? Em làm nhanh cho ạ.",
  "Cần xuất danh sách ra Excel không ạ? Cứ nhờ em nhé.",
  "Chưa biết thao tác ở đâu? Em hướng dẫn từng bước cho mình ạ.",
];
const LOI_NHAC_MOI = "Em có tin trả lời mới cho mình đây ạ.";
const KHOA_TAT_BONG = "tula-bong-da-tat";
const CHO_LAN_DAU = 2500;      // vào trang ~2,5 giây thì tự nhảy lên chào lần đầu
const CHO_SAU_KHI_DONG = 20000; // vừa đóng khung chat thì đợi ~20 giây
const GIAN_CACH_TOI_THIEU = 50000; // hai lần bật bong bóng cách nhau tối thiểu 50 giây (cộng thêm 0-10 giây ngẫu nhiên)
const TU_AN_SAU = 10000;

const GOI_Y = ["Hôm nay ai chưa chấm công?", "Tìm nhân viên theo tên", "Em cần làm việc này ở đâu trong app?", "Xuất danh sách ra Excel"];

/** Chat nổi với Tula ở góc dưới bên phải mọi trang. Vai trò Kỹ thuật có thêm chế độ "Nhờ sửa ứng dụng". Tula online hay không hiện ngay ở đầu khung. */
export function ChatNoi({ choPhepSua, hoTen }: { choPhepSua: boolean; hoTen: string }) {
  const [mo, setMo] = useState(false);
  const [chat, setChat] = useState<TrangChat | null>(null);
  const [soChuaDoc, setSoChuaDoc] = useState(0);
  const [nhap, setNhap] = useState("");
  const [cheDo, setCheDo] = useState<"hoi" | "sua">("hoi");
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const cuonRef = useRef<HTMLDivElement>(null);
  const daDoc = useRef(0);
  const [bong, setBong] = useState<string | null>(null);
  const [tamDung, setTamDung] = useState(false);
  const daTatBong = useRef(false);
  const lanBongCuoi = useRef(0);
  const daChao = useRef(false);
  const chiSoLoi = useRef(0);
  const daBaoChuaDoc = useRef(0);

  const tai = useCallback(async () => {
    const kq = await layChat();
    if ("loi" in kq) return;
    setChat(kq);
    return kq;
  }, []);

  // Đang mở: hỏi lại mỗi 2,5 giây khi chờ Tula, 8 giây khi rảnh. Đang đóng: chỉ hỏi 30 giây một lần để hiện chấm "có trả lời mới".
  useEffect(() => {
    let dung = false, t: ReturnType<typeof setTimeout>;
    const vong = async () => {
      const kq = await tai();
      if (dung) return;
      if (kq && !mo) setSoChuaDoc(Math.max(0, kq.tin.filter((x) => x.vai === "agent").length - daDoc.current));
      t = setTimeout(vong, mo ? (kq?.dangCho ? 2500 : 8000) : 30000);
    };
    t = setTimeout(vong, mo ? 0 : 4000);
    return () => { dung = true; clearTimeout(t); };
  }, [mo, tai]);

  useEffect(() => { if (mo && chat) daDoc.current = chat.tin.filter((x) => x.vai === "agent").length; }, [mo, chat]);
  useEffect(() => { if (mo) cuonRef.current?.scrollTo({ top: cuonRef.current.scrollHeight }); }, [mo, chat?.tin.length, chat?.dangCho]);
  useEffect(() => {
    if (!mo) return;
    const phim = (e: KeyboardEvent) => { if (e.key === "Escape") setMo(false); };
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  }, [mo]);

  // Người dùng đã bấm × ở bong bóng trong phiên này thì không bật lại nữa (sessionStorage có thể bị chặn nên bọc try/catch).
  useEffect(() => {
    try { daTatBong.current = sessionStorage.getItem(KHOA_TAT_BONG) === "1"; } catch { /* không có sessionStorage thì chỉ nhớ trong lần tải trang này */ }
  }, []);

  // Khung chat đang đóng: thỉnh thoảng bật bong bóng lời nhắc. Mở khung thì dừng lịch (moChat đã tắt bong bóng).
  useEffect(() => {
    if (mo) { daChao.current = true; return; }
    let t: ReturnType<typeof setTimeout>;
    const hen = (ms: number) => {
      const conLai = GIAN_CACH_TOI_THIEU - (Date.now() - lanBongCuoi.current);
      t = setTimeout(() => {
        if (!daTatBong.current && document.visibilityState === "visible") {
          const loi = LOI_NHAC[chiSoLoi.current++ % LOI_NHAC.length];
          setBong((cu) => cu ?? loi);
          lanBongCuoi.current = Date.now();
        }
        hen(GIAN_CACH_TOI_THIEU + Math.random() * 10000);
      }, Math.max(ms, conLai));
    };
    hen(daChao.current ? CHO_SAU_KHI_DONG : CHO_LAN_DAU);
    return () => clearTimeout(t);
  }, [mo]);

  // Có tin trả lời mới của Tula khi đang đóng: báo ngay bằng bong bóng (trừ khi chị/anh đã tắt, hoặc vừa có bong bóng trong 15 giây).
  useEffect(() => {
    if (mo || soChuaDoc <= daBaoChuaDoc.current) { if (soChuaDoc === 0) daBaoChuaDoc.current = 0; return; }
    daBaoChuaDoc.current = soChuaDoc;
    if (daTatBong.current || Date.now() - lanBongCuoi.current < 15000) return;
    lanBongCuoi.current = Date.now();
    setBong(LOI_NHAC_MOI);
  }, [mo, soChuaDoc]);

  // Tự ẩn sau ~10 giây; đang rê chuột/đang focus vào bong bóng thì giữ lại, rời ra mới đếm tiếp 3 giây.
  useEffect(() => {
    if (!bong || tamDung) return;
    const t = setTimeout(() => setBong(null), TU_AN_SAU);
    return () => clearTimeout(t);
  }, [bong, tamDung]);

  const tatBong = () => {
    daTatBong.current = true;
    try { sessionStorage.setItem(KHOA_TAT_BONG, "1"); } catch { /* bỏ qua */ }
    setBong(null);
    setTamDung(false);
  };
  const moChat = () => { setSoChuaDoc(0); daBaoChuaDoc.current = 0; setBong(null); setTamDung(false); setMo(true); };

  const gui = (noiDung: string) => {
    const nd = noiDung.trim();
    if (!nd || dang) return;
    setLoi("");
    bat(async () => {
      const fd = new FormData();
      fd.set("noi_dung", nd); fd.set("loai", cheDo);
      const kq = await guiTinChat(fd);
      if (kq.loi) return setLoi(kq.loi);
      setNhap("");
      await tai();
    });
  };

  const tin = chat?.tin ?? [];
  const choLau = !!chat?.dangCho && !chat.online;
  return (
    <>
      {!mo && (
        <div className="fixed bottom-[84px] right-4 z-40 flex items-end lg:bottom-6 lg:right-6">
          <div role="status" aria-live="polite" className="min-w-0">
            {bong && (
              <div className="tula-bong relative mr-3 mb-1 flex w-max max-w-[min(15rem,calc(100vw-7.5rem))] items-start"
                onMouseEnter={() => setTamDung(true)} onMouseLeave={() => setTamDung(false)} onFocus={() => setTamDung(true)} onBlur={() => setTamDung(false)}
                onKeyDown={(e) => { if (e.key === "Escape") setBong(null); }}>
                <button type="button" onClick={moChat} className="min-w-0 flex-1 rounded-nho py-2.5 pl-3 pr-1 text-left text-[14px] leading-snug text-muc">{bong}</button>
                <button type="button" onClick={tatBong} aria-label="Tắt lời nhắc của Tula" className="m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-nho text-muc-3 hover:bg-giay-tram"><X strokeWidth={1.8} className="h-4 w-4" aria-hidden /></button>
              </div>
            )}
          </div>
          <button type="button" onClick={moChat} aria-label="Mở khung chat với Tula" title="Chat với Tula"
            className="tula-nut relative block h-14 w-14 shrink-0 p-0 transition-[filter] duration-150" style={{ borderRadius: 9999 }}>
            <span className="tula-nay relative h-14 w-14">
              <Image src={ANH_TULA} alt="" width={56} height={56} unoptimized className="h-14 w-14 object-cover" style={{ borderRadius: 9999, border: "2px solid var(--giay-sang)", boxShadow: "var(--bong-2)" }} />
              <span aria-hidden className="absolute bottom-0.5 right-0.5 block h-3.5 w-3.5" style={{ borderRadius: 9999, background: chat?.online === false ? "var(--vien-dam)" : "var(--sac-luc-mau)", border: "2px solid var(--giay-sang)" }} />
              {soChuaDoc > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-loi px-1 text-[11px] font-semibold text-white" style={{ borderRadius: 9999 }}>{soChuaDoc}</span>}
            </span>
          </button>
        </div>
      )}
      {mo && (
        <section role="dialog" aria-label="Chat với Tula" style={{ position: "fixed" }} className="the-noi the-noi-thap vao fixed bottom-[84px] right-3 z-40 flex h-[min(560px,calc(100dvh-170px))] w-[380px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden p-0 lg:bottom-6 lg:right-6 lg:h-[min(600px,calc(100dvh-110px))]">
          <header className="flex items-center gap-3 border-b border-vien px-4 py-3">
            <Image src={ANH_TULA} alt="" width={36} height={36} unoptimized className="h-9 w-9 shrink-0 object-cover" style={{ borderRadius: 9999 }} />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-muc">Tula · Trợ lý AI</div>
              <div className="flex items-center gap-1.5 text-[12px] text-muc-3"><span aria-hidden className={`h-2 w-2 ${chat?.online ? "bg-nhan" : "bg-vien-dam"}`} style={{ borderRadius: 9999 }} />{chat == null ? "Đang kết nối" : chat.online ? "Đang online" : "Đang offline, em trả lời khi máy bật lại"}</div>
            </div>
            <button type="button" onClick={() => setMo(false)} aria-label="Đóng chat" className="rounded-nho p-1.5 text-muc-3 hover:bg-giay-tram"><X strokeWidth={1.8} className="h-5 w-5" aria-hidden /></button>
          </header>
          <div ref={cuonRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {tin.length === 0 && (
              <div>
                <p className="rounded-nho bg-giay-tram px-3 py-2.5 text-[14px] text-muc">Em là Tula, trợ lý AI. {hoTen.split(" ").slice(-1)[0]} cần em hỗ trợ gì ạ? Em tra cứu, hướng dẫn thao tác và xuất file Excel cho mình ngay đây.</p>
                <div className="mt-3 flex flex-wrap gap-2">{GOI_Y.map((g) => <button key={g} type="button" onClick={() => gui(g)} className="rounded-nho border border-vien-dam px-2.5 py-1.5 text-[13px] text-muc-2 hover:bg-giay-tram">{g}</button>)}</div>
              </div>
            )}
            {tin.map((t) => (
              <div key={t.id} className={`flex ${t.vai === "nguoi" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-nho px-3 py-2 text-[14px] ${t.vai === "nguoi" ? "bg-nhan-nhat text-nhan-dam" : "bg-giay-tram text-muc"}`}>
                  {t.vai === "nguoi" && t.loai !== "hoi" && <div className="mb-0.5 text-[11.5px] font-semibold uppercase tracking-wide opacity-70">{t.loai === "sua" ? "Nhờ sửa ứng dụng" : "Duyệt"}</div>}
                  {t.noiDung}
                  {t.coTep && t.vai === "agent" && <a href={`/api/chat-agent/tep/${t.id}`} className="mt-2 flex items-center gap-1.5 rounded-nho border border-vien-dam bg-giay-sang px-2.5 py-1.5 text-[13px] font-medium text-nhan-dam hover:underline"><Paperclip strokeWidth={1.8} className="h-4 w-4" aria-hidden />{t.tenTep ?? "Tải tệp"}</a>}
                  {t.choDuyet && choPhepSua && <button type="button" disabled={dang} onClick={() => { const fd = new FormData(); fd.set("id", t.id); bat(async () => { const kq = await duyetSuaChat(fd); if (kq.loi) setLoi(kq.loi); await tai(); }); }} className="nut-vang mt-2 h-9 w-full rounded-nho px-3 text-[13px] disabled:opacity-60">Duyệt đưa lên</button>}
                  {t.trangThai === "loi" && <div className="mt-1 text-[12px] text-loi">Lần này em chưa xử lý được, thử lại giúp em.</div>}
                </div>
              </div>
            ))}
            {chat?.dangCho && <p className="text-[13px] text-muc-3">{choLau ? "Tula đang offline, tin của mình được giữ, em trả lời ngay khi máy bật lại." : "Tula đang soạn trả lời…"}</p>}
          </div>
          <div className="border-t border-vien px-3 pb-3 pt-2.5">
            {choPhepSua && (
              <div role="radiogroup" aria-label="Kiểu nhờ" className="mb-2 grid grid-cols-2 gap-1 rounded-nho bg-giay-tram p-1 text-[13px]">
                {([["hoi", "Hỏi đáp"], ["sua", "Nhờ sửa app"]] as const).map(([m, n]) => <button key={m} type="button" role="radio" aria-checked={cheDo === m} onClick={() => setCheDo(m)} className={`rounded-nho py-1.5 ${cheDo === m ? "bg-giay-sang font-medium text-nhan-dam shadow-sm" : "text-muc-3"}`}>{n}</button>)}
              </div>
            )}
            {loi && <p role="alert" className="mb-2 text-[13px] text-loi">{loi}</p>}
            <form onSubmit={(e) => { e.preventDefault(); gui(nhap); }} className="flex items-end gap-2">
              <textarea value={nhap} onChange={(e) => setNhap(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gui(nhap); } }} rows={1} maxLength={2000}
                placeholder={cheDo === "sua" ? "Mô tả phần cần sửa trong app…" : "Hỏi Tula bất cứ điều gì…"} aria-label="Nội dung gửi Tula"
                className="max-h-28 min-h-10 flex-1 resize-none rounded-nho border border-vien-dam bg-giay-sang px-3 py-2 text-[14px] text-muc outline-none focus:border-nhan" />
              <button type="submit" disabled={dang || !nhap.trim()} aria-label="Gửi" className="nut-vang flex h-10 w-10 shrink-0 items-center justify-center disabled:opacity-50"><SendHorizontal strokeWidth={1.8} className="h-[18px] w-[18px]" aria-hidden /></button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
