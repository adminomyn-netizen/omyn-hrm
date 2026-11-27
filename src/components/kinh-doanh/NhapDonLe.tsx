"use client";

import { useState, useTransition } from "react";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { docFileExcelDonLe, nhapDonLeTuBang, type KetQuaNhap } from "@/app/(app)/kinh-doanh/nhap-don-le/actions";

const KENH = ["Shopee", "TikTok Shop", "Facebook", "Zalo", "Điện thoại", "Khác"].map((k) => ({ gia_tri: k, nhan: k }));
const so = (n: number) => n.toLocaleString("vi-VN");

/** Dán bảng đơn (sao chép từ Excel) hoặc chọn file CSV, bấm Kiểm để xem trước, rồi Nhập. */
export function NhapDonLe() {
  const [text, setText] = useState("");
  const [kenh, setKenh] = useState("Shopee");
  const [taoKhach, setTaoKhach] = useState(true);
  const [kq, setKq] = useState<KetQuaNhap | null>(null);
  const [dang, bat] = useTransition();
  const chay = (chiKiem: boolean) => bat(async () => setKq(await nhapDonLeTuBang(text, kenh, taoKhach, chiKiem)));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={NHAN_O}>Kênh của các đơn trong file</label><Chon ariaLabel="Kênh" giaTri={kenh} onDoi={setKenh} luaChon={KENH} /></div>
        <div className="flex items-end"><Gat nhan="Tạo khách mới khi chưa có số điện thoại trong sổ (không tự cho phép nhắn tin)" giaTriMacDinh onDoi={setTaoKhach} /></div>
      </div>
      <div>
        <label className={NHAN_O} htmlFor="bang-don">Bảng đơn (dòng đầu là tên cột)</label>
        <textarea id="bang-don" value={text} onChange={(e) => { setText(e.target.value); setKq(null); }} rows={10} placeholder={"Mã đơn\tNgày\tTên khách\tSố điện thoại\tTiền khách trả\tTrạng thái\nA001\t03/11/2026\tLan\t0912345678\t350.000\tHoàn thành"} className={`${O_NHIEU_DONG} font-mono text-[13px]`} />
        <p className="mt-1.5 text-[13px] text-muc-3">Dán trực tiếp từ Excel (chọn ô, sao chép), hoặc chọn file Excel (.xlsx) / CSV:{" "}
          <input type="file" accept=".csv,.tsv,.txt,.xlsx" aria-label="Chọn file Excel hoặc CSV" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setKq(null); if (f.name.toLowerCase().endsWith(".xlsx")) { const fd = new FormData(); fd.set("file", f); const r = await docFileExcelDonLe(fd); if (r.loi) setKq({ loi: r.loi }); else setText(r.text ?? ""); } else setText(await f.text()); }} className="text-[13px]" />
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={NUT_PHU} disabled={dang || !text.trim()} onClick={() => chay(true)}>{dang ? "Đang xử lý" : "Kiểm trước"}</button>
        <button type="button" className={NUT_CHINH} disabled={dang || !text.trim()} onClick={() => chay(false)}>Nhập vào sổ</button>
      </div>
      {kq?.loi && <p role="alert" className="text-[14px] text-loi">{kq.loi}</p>}
      {kq && !kq.loi && (
        <div role="status" className="rounded-nho border border-vien px-4 py-3 text-[14px] text-muc-2">
          <p className="font-medium text-muc">{kq.chiKiem ? "Kiểm xong, CHƯA ghi gì." : "Đã nhập xong."}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>{so(kq.moi ?? 0)} đơn mới{kq.chiKiem ? " sẽ được thêm" : " đã thêm"}, tổng {so(kq.tongTien ?? 0)}đ, trong đó {so(kq.daGiao ?? 0)} đơn đã giao (tính điểm).</li>
            <li>{so(kq.daCo ?? 0)} đơn đã có trong sổ (cùng kênh và mã đơn) nên bỏ qua.</li>
            <li>Khách: {so(kq.khachKhop ?? 0)} khớp số điện thoại, {so(kq.khachMoi ?? 0)} khách mới, {so(kq.vangLai ?? 0)} đơn không gắn khách (không tích điểm).</li>
            {kq.coHang && <li>Dòng hàng: {so(kq.hangGhi ?? 0)} dòng{kq.chiKiem ? " sẽ được ghi" : " đã ghi"} (đơn đã giao tự trừ kho, tính lãi gộp){(kq.donBoSung ?? 0) > 0 ? `, trong đó bổ sung hàng cho ${so(kq.donBoSung!)} đơn đã có` : ""}.</li>}
            {(kq.hangBoQua ?? 0) > 0 && <li className="text-canh-bao">{so(kq.hangBoQua!)} dòng hàng chưa ghi vì sản phẩm chưa có trong danh mục (khớp theo mã hoặc tên): {kq.spChuaCo!.join(", ")}{kq.spChuaCo!.length >= 20 ? " …" : ""}. Thêm sản phẩm vào danh mục rồi bấm Nhập lại: đơn đã có mà chưa có hàng sẽ được bổ sung.</li>}
            {(kq.maChuaGhep?.length ?? 0) > 0 && <li className="text-canh-bao">Trạng thái gốc của sàn chưa có dòng ghép: {kq.maChuaGhep!.join(", ")}. Em tạm suy theo chữ; vào Ghép trạng thái sàn thêm dòng để đơn sau luôn đúng.</li>}
            {(kq.canhBao?.length ?? 0) > 0 && <li className="text-canh-bao">{kq.canhBao!.slice(0, 5).map((l) => `dòng ${l.dong}: ${l.loi}`).join(" · ")}{kq.canhBao!.length > 5 ? " …" : ""}</li>}
            {(kq.loiDong?.length ?? 0) > 0 && <li className="text-canh-bao">{kq.loiDong!.length} dòng lỗi, không nhập: {kq.loiDong!.slice(0, 10).map((l) => `dòng ${l.dong}: ${l.loi}`).join(" · ")}{kq.loiDong!.length > 10 ? " …" : ""}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
