"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { MessageCircle, Paperclip, SendHorizontal, X } from "lucide-react";
import { duyetSuaChat, guiTinChat, layChat, type TrangChat } from "@/app/chat-actions";

const GOI_Y = ["Hôm nay ai chưa chấm công?", "Tìm nhân viên theo tên", "Em cần làm việc này ở đâu trong app?", "Xuất danh sách ra Excel"];

/** Chat nổi với Tula ở góc dưới bên phải mọi trang. Vai trò Kỹ thuật có thêm chế độ "Nhờ sửa ứng dụng". Tula online hay không hiện ngay ở đầu khung. */
export function ChatNoi({ choPhepSua }: { choPhepSua: boolean }) {
  const [mo, setMo] = useState(false);
  const [chat, setChat] = useState<TrangChat | null>(null);
  const [soChuaDoc, setSoChuaDoc] = useState(0);
  const [nhap, setNhap] = useState("");
  const [cheDo, setCheDo] = useState<"hoi" | "sua">("hoi");
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const cuonRef = useRef<HTMLDivElement>(null);
  const daDoc = useRef(0);

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
        <button type="button" onClick={() => { setSoChuaDoc(0); setMo(true); }} aria-label="Mở chat với Tula, trợ lý AI" title="Chat với Tula"
          className="nut-vang fixed bottom-[84px] right-4 z-40 flex h-14 w-14 items-center justify-center lg:bottom-6 lg:right-6" style={{ borderRadius: 9999 }}>
          <MessageCircle strokeWidth={1.8} className="h-6 w-6" aria-hidden />
          {soChuaDoc > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center bg-loi px-1 text-[11px] font-semibold text-white" style={{ borderRadius: 9999 }}>{soChuaDoc}</span>}
        </button>
      )}
      {mo && (
        <section role="dialog" aria-label="Chat với Tula" style={{ position: "fixed" }} className="the-noi the-noi-thap vao fixed bottom-[84px] right-3 z-40 flex h-[min(560px,calc(100dvh-170px))] w-[380px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden p-0 lg:bottom-6 lg:right-6 lg:h-[min(600px,calc(100dvh-110px))]">
          <header className="flex items-center gap-3 border-b border-vien px-4 py-3">
            <span className="nut-vang flex h-9 w-9 shrink-0 items-center justify-center text-[14px] font-semibold" style={{ borderRadius: 9999 }}>T</span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-muc">Tula · Trợ lý AI</div>
              <div className="flex items-center gap-1.5 text-[12px] text-muc-3"><span aria-hidden className={`h-2 w-2 ${chat?.online ? "bg-nhan" : "bg-vien-dam"}`} style={{ borderRadius: 9999 }} />{chat == null ? "Đang kết nối" : chat.online ? "Đang online" : "Đang offline, em trả lời khi máy bật lại"}</div>
            </div>
            <button type="button" onClick={() => setMo(false)} aria-label="Đóng chat" className="rounded-nho p-1.5 text-muc-3 hover:bg-giay-tram"><X strokeWidth={1.8} className="h-5 w-5" aria-hidden /></button>
          </header>
          <div ref={cuonRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {tin.length === 0 && (
              <div>
                <p className="rounded-nho bg-giay-tram px-3 py-2.5 text-[14px] text-muc">Em là Tula, trợ lý AI của chị Lâm. Anh/chị cần em hỗ trợ gì ạ? Em tra cứu, hướng dẫn thao tác và xuất file Excel cho mình ngay đây.</p>
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
