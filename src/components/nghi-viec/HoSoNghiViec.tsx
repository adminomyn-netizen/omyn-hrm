"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { datMucNghiViec, dongHoSoNghiViec, huyHoSoNghiViec, luuPhongVanThoiViec, themMucNghiViec, type KetQuaNghiViec } from "@/app/(app)/nghi-viec/actions";

export type MucView = { id: string; nhom: string; ten: string; bat_buoc: boolean; xong: boolean; xong_luc: string | null; xong_boi_ten: string | null; ghi_chu: string | null };
export type HoSoView = { id: string; mo: boolean; trang_thai: string; pvTrangThai: string; pvNgay: string; pvNguoiId: string; pvLyDoThat: string; pvGhiChu: string; pvQuayLai: string };
const gio = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function useChay() {
  const router = useRouter();
  const [loi, setLoi] = useState<string>();
  const [thieu, setThieu] = useState<string[]>([]);
  const [dang, batDau] = useTransition();
  const chay = (viec: () => Promise<KetQuaNghiViec>, xong?: () => void) => batDau(async () => {
    setLoi(undefined); setThieu([]);
    const r = await viec();
    if (!r.ok) { setLoi(r.loi); setThieu(r.thieu ?? []); return; }
    xong?.();
    router.refresh();
  });
  return { loi, thieu, dang, chay };
}

export function HoSoNghiViec({ h, muc, nhanSu }: { h: HoSoView; muc: MucView[]; nhanSu: { id: string; ten: string }[] }) {
  const { loi, thieu, dang, chay } = useChay();
  const nhom = [...new Set(muc.map((m) => m.nhom))];
  const [moiNhom, setMoiNhom] = useState("");
  const [moiTen, setMoiTen] = useState("");
  const [moiBatBuoc, setMoiBatBuoc] = useState(true);
  const xong = muc.filter((m) => m.xong).length;
  return (
    <div className="space-y-5">
      <section className="the-noi the-noi-thap p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-muc">Checklist bàn giao và chốt</h2>
          <span className="text-[13px] text-muc-3">{xong}/{muc.length} mục xong</span>
        </div>
        <div className="space-y-4">
          {nhom.map((g) => (
            <div key={g}>
              <div className="text-[12px] font-medium text-muc-3">{g}</div>
              <ul className="mt-1 divide-y divide-vien rounded-nho border border-vien">
                {muc.filter((m) => m.nhom === g).map((m) => (
                  <li key={m.id} className="flex items-start gap-3 px-3 py-2.5">
                    <button type="button" disabled={!h.mo || dang} role="checkbox" aria-checked={m.xong} aria-label={m.ten} onClick={() => chay(() => datMucNghiViec(h.id, m.id, !m.xong, m.ghi_chu ?? ""))} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-tag border ${m.xong ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang"} disabled:opacity-60`}>
                      {m.xong && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    </button>
                    <span className="min-w-0 flex-1 text-[14px]">
                      <span className={m.xong ? "text-muc-3 line-through" : "text-muc"}>{m.ten}</span>{!m.bat_buoc && <span className="ml-2 text-[12px] text-muc-3">(không bắt buộc)</span>}
                      {m.xong && m.xong_luc && <span className="block text-[12px] text-muc-3">{m.xong_boi_ten ?? "—"} · {gio(m.xong_luc)}{m.ghi_chu ? ` · ${m.ghi_chu}` : ""}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {h.mo && (
          <div className="mt-4 grid gap-2 border-t border-vien pt-4 sm:grid-cols-[1fr_2fr_auto]">
            <input value={moiNhom} onChange={(e) => setMoiNhom(e.target.value)} placeholder="Nhóm (vd Bàn giao khách hàng)" aria-label="Nhóm mục mới" className={O_NHAP} />
            <input value={moiTen} onChange={(e) => setMoiTen(e.target.value)} placeholder="Nội dung mục cần làm thêm" aria-label="Nội dung mục mới" className={O_NHAP} />
            <button type="button" disabled={dang} className={NUT_PHU} onClick={() => chay(() => themMucNghiViec(h.id, moiNhom, moiTen, moiBatBuoc), () => { setMoiNhom(""); setMoiTen(""); })}>Thêm mục</button>
            <label className="flex items-center gap-2 text-[13px] text-muc-2 sm:col-span-3"><input type="checkbox" checked={moiBatBuoc} onChange={(e) => setMoiBatBuoc(e.target.checked)} />Bắt buộc trước khi đóng hồ sơ</label>
          </div>
        )}
      </section>

      <PhongVan h={h} nhanSu={nhanSu} />

      {h.mo && (
        <section className="the-noi the-noi-thap p-4 sm:p-5">
          <h2 className="text-[16px] font-semibold text-muc">Đóng hồ sơ</h2>
          <p className="mt-1 text-[13px] text-muc-3">Đóng được khi mọi mục bắt buộc đã xong, không còn tài sản đang giữ và đã phỏng vấn thôi việc (hoặc ghi nhận từ chối). Đóng xong: chuyển người đó sang “Đã nghỉ” và chấm dứt hợp đồng đang hiệu lực.</p>
          {thieu.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] text-loi">{thieu.map((t) => <li key={t}>{t}</li>)}</ul>
          )}
          {loi && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" disabled={dang} className={NUT_CHINH} onClick={() => { if (window.confirm("Đóng hồ sơ? Người này sẽ chuyển sang “Đã nghỉ”.")) chay(() => dongHoSoNghiViec(h.id)); }}>{dang ? "Đang xử lý…" : "Đóng hồ sơ nghỉ việc"}</button>
            <button type="button" disabled={dang} className={NUT_CHU_NGUY} onClick={() => { if (window.confirm("Huỷ hồ sơ (người này ở lại)?")) chay(() => huyHoSoNghiViec(h.id)); }}>Huỷ hồ sơ (người ở lại)</button>
          </div>
        </section>
      )}
    </div>
  );
}

function PhongVan({ h, nhanSu }: { h: HoSoView; nhanSu: { id: string; ten: string }[] }) {
  const { loi, dang, chay } = useChay();
  const [tt, setTt] = useState(h.pvTrangThai);
  const [ngay, setNgay] = useState(h.pvNgay);
  const [nguoi, setNguoi] = useState(h.pvNguoiId);
  const [lyDo, setLyDo] = useState(h.pvLyDoThat);
  const [ghiChu, setGhiChu] = useState(h.pvGhiChu);
  const [quayLai, setQuayLai] = useState(h.pvQuayLai);
  return (
    <section className="the-noi the-noi-thap p-4 sm:p-5">
      <h2 className="text-[16px] font-semibold text-muc">Phỏng vấn thôi việc</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div><label className={NHAN_O}>Trạng thái</label><Chon ariaLabel="Trạng thái" giaTri={tt} onDoi={setTt} voHieu={!h.mo} luaChon={["Chưa phỏng vấn", "Đã phỏng vấn", "Từ chối phỏng vấn"].map((x) => ({ gia_tri: x, nhan: x }))} /></div>
        {tt === "Đã phỏng vấn" && (
          <>
            <div><label className={NHAN_O}>Ngày phỏng vấn</label><NgayChon ariaLabel="Ngày phỏng vấn" giaTri={ngay} onDoi={setNgay} voHieu={!h.mo} tuNam={2020} denNam={2100} /></div>
            <div><label className={NHAN_O}>Người phỏng vấn</label><Chon ariaLabel="Người phỏng vấn" trong="Chọn người" giaTri={nguoi} onDoi={setNguoi} voHieu={!h.mo} luaChon={nhanSu.map((n) => ({ gia_tri: n.id, nhan: n.ten }))} /></div>
            <div><label className={NHAN_O}>Có thể quay lại làm?</label><Chon ariaLabel="Có thể quay lại" trong="Chưa rõ" giaTri={quayLai} onDoi={setQuayLai} voHieu={!h.mo} luaChon={[{ gia_tri: "Có", nhan: "Có" }, { gia_tri: "Không", nhan: "Không" }]} /></div>
            <div className="sm:col-span-2"><label className={NHAN_O}>Lý do thật khiến nghỉ <span className="text-loi">*</span></label><textarea value={lyDo} onChange={(e) => setLyDo(e.target.value)} readOnly={!h.mo} maxLength={500} className={O_NHIEU_DONG} /></div>
            <div className="sm:col-span-2"><label className={NHAN_O}>Góp ý cho công ty</label><textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} readOnly={!h.mo} maxLength={1000} className={O_NHIEU_DONG} /></div>
          </>
        )}
      </div>
      {loi && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
      {h.mo && <button type="button" disabled={dang} className={`${NUT_CHINH} mt-4`} onClick={() => chay(() => luuPhongVanThoiViec(h.id, { trangThai: tt, ngay, nguoiId: nguoi, lyDoThat: lyDo, ghiChu, coTheQuayLai: quayLai }))}>{dang ? "Đang lưu…" : "Lưu phỏng vấn"}</button>}
      {!h.mo && <button type="button" className={`${NUT_CHU} mt-3`} disabled>Hồ sơ đã {h.trang_thai === "Đã đóng" ? "đóng" : "huỷ"}, không sửa nữa</button>}
    </section>
  );
}
