"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { tienVN } from "@/lib/dinh-dang";
import { doiSoatTuBang, type KetQuaDoiSoatNhap } from "@/app/(app)/kinh-doanh/doi-soat-don/actions";
import { docFileExcelDonLe } from "@/app/(app)/kinh-doanh/nhap-don-le/actions";

const so = (n: number) => n.toLocaleString("vi-VN");
const homNay = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

/** Dán bảng quyết toán của sàn (hoặc chọn file), chọn gian hàng + khoảng ngày, bấm Kiểm trước để xem rồi Nhập. */
export function DoiSoatDon({ gianHang }: { gianHang: { id: string; ten: string }[] }) {
  const [text, setText] = useState("");
  const [gh, setGh] = useState(gianHang[0]?.id ?? "");
  const [tu, setTu] = useState(homNay().slice(0, 8) + "01");
  const [den, setDen] = useState(homNay());
  const [kq, setKq] = useState<KetQuaDoiSoatNhap | null>(null);
  const [dang, bat] = useTransition();
  const chay = (chiKiem: boolean) => bat(async () => setKq(await doiSoatTuBang(text, gh, tu, den, chiKiem)));
  if (gianHang.length === 0) return <p className="text-[14px] text-muc-3">Chưa có gian hàng nào. <Link href="/hr/gian-hang-san" className="underline">Khai báo gian hàng sàn</Link> trước.</p>;
  const t = kq?.tomTat;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={NHAN_O}>Gian hàng</label><Chon ariaLabel="Gian hàng" giaTri={gh} onDoi={setGh} luaChon={gianHang.map((g) => ({ gia_tri: g.id, nhan: g.ten }))} /></div>
        <div><label className={NHAN_O} htmlFor="ds-tu">Từ ngày</label><NgayChon id="ds-tu" ariaLabel="Từ ngày" giaTri={tu} onDoi={(v) => { setTu(v); setKq(null); }} /></div>
        <div><label className={NHAN_O} htmlFor="ds-den">Đến ngày</label><NgayChon id="ds-den" ariaLabel="Đến ngày" giaTri={den} onDoi={(v) => { setDen(v); setKq(null); }} /></div>
      </div>
      <div>
        <label className={NHAN_O} htmlFor="bang-doi-soat">Bảng quyết toán của sàn (dòng đầu là tên cột)</label>
        <textarea id="bang-doi-soat" value={text} onChange={(e) => { setText(e.target.value); setKq(null); }} rows={9} placeholder={"Mã đơn\tNgày nhận tiền\tTiền khách trả\tPhí hoa hồng\tPhí giao dịch\tPhí vận chuyển\tThực nhận\nA001\t05/11/2026\t200000\t10000\t4000\t0\t186000"} className={O_NHIEU_DONG} />
        <p className="mt-1.5 text-[13px] text-muc-3">Dán trực tiếp từ Excel, hoặc chọn file Excel (.xlsx) / CSV:{" "}
          <input type="file" accept=".csv,.tsv,.txt,.xlsx" aria-label="Chọn file quyết toán" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return; setKq(null);
            if (f.name.toLowerCase().endsWith(".xlsx")) { const fd = new FormData(); fd.set("file", f); const r = await docFileExcelDonLe(fd); if (r.loi) setKq({ loi: r.loi }); else setText(r.text ?? ""); }
            else setText(await f.text());
            e.target.value = "";
          }} />
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={NUT_PHU} disabled={dang || !text.trim() || !gh} onClick={() => chay(true)}>{dang ? "Đang xử lý" : "Kiểm trước"}</button>
        <button type="button" className={NUT_CHINH} disabled={dang || !text.trim() || !gh} onClick={() => chay(false)}>Nhập đối soát</button>
      </div>
      {kq?.loi && <p role="alert" className="text-[14px] text-loi">{kq.loi}</p>}
      {kq && !kq.loi && t && (
        <div role="status" className="rounded-nho border border-vien px-4 py-3 text-[14px] text-muc-2">
          <p className="font-medium text-muc">{kq.chiKiem ? "Kiểm xong, CHƯA ghi gì." : "Đã nhập xong."}</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            <li>{so(kq.moi ?? 0)} đơn mới{(kq.daDoiSoat ?? 0) > 0 ? `, bỏ qua ${so(kq.daDoiSoat!)} đơn đã đối soát trước đó` : ""}.</li>
            <li>Khớp {so(t.theoKetQua["Khớp"])} · Lệch giá trị {so(t.theoKetQua["Lệch giá trị"])} · Lệch trạng thái {so(t.theoKetQua["Lệch trạng thái"])} · Thiếu trong Omyn {so(t.theoKetQua["Thiếu trong Omyn"])}.</li>
            <li>Khách trả {tienVN(t.khachTra)} · Tổng phí sàn {tienVN(t.tongPhi)} · Thực nhận {tienVN(t.thucNhan)}{t.hoanTien > 0 ? ` · Hoàn ${tienVN(t.hoanTien)}` : ""}.</li>
            {(kq.canhBao?.length ?? 0) > 0 && <li className="text-canh-bao">{kq.canhBao!.slice(0, 5).map((l) => `dòng ${l.dong}: ${l.loi}`).join(" · ")}{kq.canhBao!.length > 5 ? " …" : ""}</li>}
            {(kq.loiDong?.length ?? 0) > 0 && <li className="text-canh-bao">{kq.loiDong!.length} dòng lỗi, không nhập: {kq.loiDong!.slice(0, 10).map((l) => `dòng ${l.dong}: ${l.loi}`).join(" · ")}{kq.loiDong!.length > 10 ? " …" : ""}</li>}
            {!kq.chiKiem && kq.phienId && <li><Link href={`/kinh-doanh/doi-soat-don?phien=${kq.phienId}`} className="underline">Xem phiên vừa nhập</Link></li>}
          </ul>
        </div>
      )}
    </div>
  );
}
