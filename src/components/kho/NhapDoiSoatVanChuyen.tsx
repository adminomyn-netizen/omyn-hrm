"use client";

import { useState, useTransition } from "react";
import { Gat } from "@/components/ui/Gat";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { tienVN } from "@/lib/dinh-dang";
import { nhapDoiSoatVanChuyen, type KetQuaVanChuyen } from "@/app/(app)/kho/cod-van-chuyen/actions";
import { docFileExcelDonLe } from "@/app/(app)/kinh-doanh/nhap-don-le/actions";

const so = (n: number) => n.toLocaleString("vi-VN");
const ds = (a: string[] | undefined, n?: number) => (a ?? []).join(", ") + (n && n > (a ?? []).length ? " …" : "");

/** Dán bảng đối soát của đơn vị vận chuyển (hoặc chọn file), Kiểm trước rồi Nhập: khớp theo mã vận đơn, cập nhật COD đã nhận và phí. */
export function NhapDoiSoatVanChuyen() {
  const [text, setText] = useState("");
  const [truPhi, setTruPhi] = useState(false);
  const [kq, setKq] = useState<KetQuaVanChuyen | null>(null);
  const [dang, bat] = useTransition();
  const chay = (chiKiem: boolean) => bat(async () => setKq(await nhapDoiSoatVanChuyen(text, truPhi, chiKiem)));
  return (
    <div className="space-y-4">
      <div>
        <label className={NHAN_O} htmlFor="bang-vc">Bảng đối soát của đơn vị vận chuyển (dòng đầu là tên cột)</label>
        <textarea id="bang-vc" value={text} onChange={(e) => { setText(e.target.value); setKq(null); }} rows={7} placeholder={"Mã vận đơn\tCOD thu hộ\tCOD đã chuyển\tPhí vận chuyển\tNgày chuyển tiền\nGHN123\t300000\t300000\t25000\t06/11/2026"} className={O_NHIEU_DONG} />
        <p className="mt-1.5 text-[13px] text-muc-3">Dán từ Excel, hoặc chọn file Excel (.xlsx) / CSV:{" "}
          <input type="file" accept=".csv,.tsv,.txt,.xlsx" aria-label="Chọn file đối soát vận chuyển" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return; setKq(null);
            if (f.name.toLowerCase().endsWith(".xlsx")) { const fd = new FormData(); fd.set("file", f); const r = await docFileExcelDonLe(fd); if (r.loi) setKq({ loi: r.loi }); else setText(r.text ?? ""); }
            else setText(await f.text());
            e.target.value = "";
          }} />
        </p>
      </div>
      <Gat nhan="File ghi số đã TRỪ phí vận chuyển (hệ thống cộng phí lại để ra COD; cần có cột Phí vận chuyển)" onDoi={(v) => { setTruPhi(v); setKq(null); }} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={NUT_PHU} disabled={dang || !text.trim()} onClick={() => chay(true)}>{dang ? "Đang xử lý" : "Kiểm trước"}</button>
        <button type="button" className={NUT_CHINH} disabled={dang || !text.trim()} onClick={() => chay(false)}>Cập nhật COD đã nhận</button>
      </div>
      {kq?.loi && <p role="alert" className="text-[14px] text-loi">{kq.loi}</p>}
      {kq && (!kq.loi || kq.khop !== undefined) && kq.khop !== undefined && (
        <div role="status" className="rounded-nho border border-vien px-4 py-3 text-[14px] text-muc-2">
          <p className="font-medium text-muc">{kq.chiKiem ? "Kiểm xong, CHƯA ghi gì." : "Đã cập nhật xong."}</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            <li>{so(kq.khop)} mã vận đơn khớp với sổ · COD đã chuyển {tienVN(kq.tongCodChuyen ?? 0)}{(kq.tongPhi ?? 0) > 0 ? ` · phí ${tienVN(kq.tongPhi!)}` : ""}.</li>
            {(kq.soKhongThay ?? 0) > 0 && <li className="text-canh-bao">{so(kq.soKhongThay!)} mã không có trong sổ Đóng gói và giao hàng (chưa ghi mã vận đơn?): {ds(kq.khongThay, kq.soKhongThay)}.</li>}
            {(kq.trungTrongSo?.length ?? 0) > 0 && <li className="text-canh-bao">Mã trùng nhiều đơn trong sổ nên bỏ qua: {ds(kq.trungTrongSo)}.</li>}
            {(kq.chenhCod?.length ?? 0) > 0 && <li className="text-canh-bao">COD thu hộ trong file khác sổ: {ds(kq.chenhCod)}.</li>}
            {(kq.chuyenNhieuHon?.length ?? 0) > 0 && <li className="text-canh-bao">ĐVVC chuyển nhiều hơn tiền thu hộ trong sổ: {ds(kq.chuyenNhieuHon)}.</li>}
            {(kq.chuaDaGiao?.length ?? 0) > 0 && <li className="text-canh-bao">ĐVVC đã chuyển tiền nhưng sổ chưa ghi Đã giao: {ds(kq.chuaDaGiao)}.</li>}
            {(kq.canhBao?.length ?? 0) > 0 && <li className="text-canh-bao">{kq.canhBao!.slice(0, 5).map((l) => `dòng ${l.dong}: ${l.loi}`).join(" · ")}{kq.canhBao!.length > 5 ? " …" : ""}</li>}
            {(kq.loiDong?.length ?? 0) > 0 && <li className="text-canh-bao">{kq.loiDong!.length} dòng lỗi, không nhập: {kq.loiDong!.slice(0, 10).map((l) => `dòng ${l.dong}: ${l.loi}`).join(" · ")}{kq.loiDong!.length > 10 ? " …" : ""}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
