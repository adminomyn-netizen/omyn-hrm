"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { CalendarClock, Check, Minus, Plus, Undo2 } from "lucide-react";
import { datTienDoHomNay, doiTrangThaiCongViec, ghiNhanCongViec, luuCongViec, xoaCongViec } from "@/app/(app)/cong-viec/actions";
import { Chon } from "@/components/ui/Chon";
import { Hop } from "@/components/ui/Hop";
import { NgayChon } from "@/components/ui/NgayChon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { BaoCaoCuoiNgay, type BaoCaoHomNay } from "@/components/cong-viec/BaoCaoCuoiNgay";
import { MauCongViec } from "@/components/cong-viec/MauCongViec";
import { MinhChungViec } from "@/components/cong-viec/MinhChungViec";
import type { MauCv } from "@/lib/mau-cong-viec";
import { demTheoTinhTrang, phanTramTienDo, tinhTrang, xepViec, type TinhTrang, type Viec } from "@/lib/cong-viec";

export type DongCv = { v: Viec; moTa: string; nguoiGiaoId: string | null; daLamHomNay: number; link: string | null; ghiChuNgay: string | null; coMinhChung: boolean };
type Nguoi = { id: string; ten: string };

const BO_LOC: { ma: "viec" | TinhTrang; nhan: string }[] = [
  { ma: "viec", nhan: "Cần làm" }, { ma: "qua-han", nhan: "Quá hạn" }, { ma: "hom-nay", nhan: "Hôm nay" }, { ma: "xong", nhan: "Đã xong" },
];
const MAU: Record<TinhTrang, "tot" | "cho" | "loi" | "tram"> = { xong: "tot", huy: "tram", "qua-han": "loi", "hom-nay": "cho", "dang-lam": "cho", "chua-lam": "tram" };
const NHAN: Record<TinhTrang, string> = { xong: "Đã xong", huy: "Đã huỷ", "qua-han": "Quá hạn", "hom-nay": "Hôm nay", "dang-lam": "Đang làm", "chua-lam": "Chưa làm" };
const NGAY = (s: string | null) => (s ? s.split("-").reverse().slice(0, 2).join("/") : "");

/** Công việc: ô thêm nhanh một dòng, thẻ gọn có thanh tiến độ và nút +1, bấm vào thẻ để sửa chi tiết. Nhân viên chỉ thấy việc của mình; trưởng phòng thấy thêm cấp dưới. */
export function BangCongViec({ dong, nguoi, toiId, homNay, quanLy, baoCao, phaiBaoCao, mau }: { dong: DongCv[]; nguoi: Nguoi[]; toiId: string | null; homNay: string; quanLy: boolean; baoCao: BaoCaoHomNay; phaiBaoCao: boolean; mau: Pick<MauCv, "ma" | "ten" | "viec">[] }) {
  const [loc, setLoc] = useState<"viec" | TinhTrang>("viec");
  const [phamVi, setPhamVi] = useState<"toi" | "nhom">(quanLy ? "nhom" : "toi");
  const [sua, setSua] = useState<DongCv | "moi" | null>(null);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [tb, setTb] = useState("");
  const nhanNguoi = useMemo(() => new Map(nguoi.map((x) => [x.id, x.ten])), [nguoi]);
  const tt = (d: DongCv) => tinhTrang(d.v, d.daLamHomNay, homNay);
  const cuaToi = dong.filter((d) => d.v.nguoiLamId === toiId && d.v.trangThai !== "Huỷ");
  const viecHomNay = cuaToi.filter((d) => d.v.lapLai === "Hằng ngày" || d.v.han === homNay);
  const xongHomNay = viecHomNay.filter((d) => tt(d) === "xong").length;
  const chuaCoViecNgay = !!toiId && !cuaToi.some((d) => d.v.lapLai === "Hằng ngày");
  const trongPhamVi = dong.filter((d) => phamVi === "nhom" || d.v.nguoiLamId === toiId);
  const dem = demTheoTinhTrang(trongPhamVi.map(tt));
  const danhSach = xepViec(trongPhamVi.map((d) => ({ v: d.v, tt: tt(d), d }))).filter((x) => (loc === "viec" ? x.tt !== "xong" && x.tt !== "huy" : x.tt === loc));
  const chay = (f: () => Promise<{ loi?: string }>) => bat(async () => { setTb(""); const r = await f(); setLoi(r.loi ?? ""); });
  const nhanh = useRef<HTMLInputElement>(null);
  const themNhanh = () => {
    const ten = nhanh.current?.value.trim();
    if (!ten || !toiId) return;
    const fd = new FormData();
    Object.entries({ tieu_de: ten, nguoi_lam_id: toiId, loai: "Vận hành", uu_tien: "Trung bình", muc_tieu_so: "1", lap_lai: "Không", han: homNay }).forEach(([k, v]) => fd.set(k, v));
    chay(async () => { const r = await luuCongViec(fd); if (!r.loi) { if (nhanh.current) nhanh.current.value = ""; setTb(`Đã thêm việc “${ten}”.`); } return r; });
  };

  return (
    <div>
      {toiId && phaiBaoCao && <BaoCaoCuoiNgay baoCao={baoCao} soViec={viecHomNay.length} xong={xongHomNay} />}
      {chuaCoViecNgay && <MauCongViec mau={mau} />}
      {toiId && (
        <div className="mb-4 flex gap-2">
          <input ref={nhanh} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), themNhanh())} placeholder="Thêm việc cần làm hôm nay… rồi bấm Enter" aria-label="Thêm việc nhanh" className={O_NHAP} />
          <button type="button" onClick={themNhanh} disabled={dang} className={`${NUT_CHINH} shrink-0`}>Thêm</button>
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {BO_LOC.map((b) => {
          const n = b.ma === "viec" ? dem["qua-han"] + dem["hom-nay"] + dem["dang-lam"] + dem["chua-lam"] : dem[b.ma];
          return <button key={b.ma} type="button" aria-pressed={loc === b.ma} onClick={() => setLoc(b.ma)} className={`rounded-tag border px-3 py-1.5 text-[13px] font-medium transition-colors ${loc === b.ma ? "border-transparent nut-vang" : "border-vien bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>{b.nhan}<span className="ml-1.5 opacity-70">{n}</span></button>;
        })}
        {quanLy && <div className="ml-auto flex gap-1.5" role="group" aria-label="Phạm vi">{(["nhom", "toi"] as const).map((p) => <button key={p} type="button" aria-pressed={phamVi === p} onClick={() => setPhamVi(p)} className={`rounded-tag px-3 py-1.5 text-[13px] font-medium ${phamVi === p ? "bg-nhan-nhat text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`}>{p === "nhom" ? "Cả nhóm" : "Của tôi"}</button>)}</div>}
        <button type="button" onClick={() => setSua("moi")} className={`${NUT_PHU} ${quanLy ? "" : "ml-auto"} flex items-center gap-1.5`}><Plus strokeWidth={1.8} className="h-4 w-4" />Thêm chi tiết</button>
      </div>
      {loi && <p role="alert" className="mb-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</p>}
      {tb && !loi && <p role="status" className="mb-3 rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">{tb}</p>}

      {danhSach.length === 0 ? (
        <p className="rounded-nho border border-vien bg-giay-sang p-6 text-center text-[14px] text-muc-3">{loc === "viec" ? "Không còn việc nào cần làm. Gõ vào ô phía trên để thêm việc mới." : "Chưa có việc nào ở mục này."}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {danhSach.map(({ d, tt: t }) => {
            const da = d.v.lapLai === "Hằng ngày" ? d.daLamHomNay : d.v.daLam;
            const pt = phanTramTienDo(da, d.v.mucTieu);
            const dongXong = t === "xong" || t === "huy";
            return (
              <li key={d.v.id} className={`the-noi rounded-nho border border-vien bg-giay-sang p-4 ${dongXong ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => chay(() => (d.v.lapLai === "Hằng ngày" ? datTienDoHomNay(d.v.id, t === "xong" ? 0 : d.v.mucTieu) : doiTrangThaiCongViec(d.v.id, t === "xong" ? "Chưa làm" : "Hoàn thành")))} disabled={dang} aria-label={t === "xong" ? "Mở lại việc" : "Đánh dấu đã xong"} title={t !== "xong" && phaiBaoCao && !d.coMinhChung ? "Cần gắn link minh chứng trước khi hoàn thành" : undefined}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-nho border ${t === "xong" ? "border-transparent nut-vang" : "border-vien-dam hover:bg-giay-tram"}`}>
                    {t === "xong" ? <Check strokeWidth={2.2} className="h-4 w-4" /> : null}
                  </button>
                  <button type="button" onClick={() => setSua(d)} className="min-w-0 flex-1 text-left">
                    <span className={`block text-[15px] font-semibold leading-snug text-muc ${t === "xong" || t === "huy" ? "line-through decoration-muc-3" : ""}`}>{d.v.tieuDe}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-muc-3">
                      <NhanTrangThai kieu={MAU[t]}>{NHAN[t]}</NhanTrangThai>
                      {d.v.lapLai === "Hằng ngày" && <span>Lặp hằng ngày</span>}
                      {d.v.han && d.v.lapLai === "Không" && <span className="inline-flex items-center gap-1"><CalendarClock strokeWidth={1.7} className="h-3.5 w-3.5" aria-hidden />{NGAY(d.v.han)}</span>}
                      {d.v.uuTien === "Cao" && <span className="font-medium text-canh-bao">Ưu tiên cao</span>}
                      {phamVi === "nhom" && <span>{nhanNguoi.get(d.v.nguoiLamId) ?? ""}</span>}
                    </span>
                  </button>
                </div>
                {!dongXong || d.link ? <MinhChungViec key={`${d.v.id}-${d.link ?? ""}`} id={d.v.id} link={d.link} ghiChu={d.ghiChuNgay} /> : null}
                {d.v.mucTieu > 1 || d.v.lapLai === "Hằng ngày" ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-tag bg-giay-tram" role="progressbar" aria-valuenow={pt} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ"><div className="h-full bg-nhan" style={{ width: `${pt}%` }} /></div>
                    <span className="w-24 shrink-0 text-right text-[13px] font-medium text-muc-2">{da.toLocaleString("vi-VN")}/{d.v.mucTieu.toLocaleString("vi-VN")}{d.v.donVi ? ` ${d.v.donVi}` : ""}</span>
                    {!dongXong && (
                      <span className="flex shrink-0 gap-1.5">
                        <button type="button" onClick={() => chay(() => ghiNhanCongViec(d.v.id, -1))} disabled={dang || da === 0} aria-label="Bớt một" className={`${NUT_PHU} !h-8 !px-2`}><Minus strokeWidth={1.8} className="h-4 w-4" /></button>
                        <button type="button" onClick={() => chay(() => ghiNhanCongViec(d.v.id, 1))} disabled={dang} aria-label="Thêm một" className={`${NUT_CHINH} !h-8 !px-3`}><Plus strokeWidth={2} className="h-4 w-4" /></button>
                      </span>
                    )}
                    {t === "xong" && d.v.lapLai === "Hằng ngày" && <button type="button" onClick={() => chay(() => ghiNhanCongViec(d.v.id, -1))} disabled={dang} aria-label="Chỉnh lại" className={`${NUT_PHU} !h-8 !px-2`}><Undo2 strokeWidth={1.8} className="h-4 w-4" /></button>}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Hop mo={sua !== null} dong={() => setSua(null)} tieuDe={sua === "moi" ? "Thêm việc" : "Sửa việc"} rong="rong">
        {sua !== null && <FormCv key={sua === "moi" ? "moi" : sua.v.id} coSan={sua === "moi" ? undefined : sua} nguoi={nguoi} toiId={toiId} homNay={homNay} xong={() => setSua(null)} daThem={(ten) => { setLoi(""); setTb(`Đã thêm việc “${ten}”.`); }} />}
      </Hop>
    </div>
  );
}

function FormCv({ coSan, nguoi, toiId, homNay, xong, daThem }: { coSan?: DongCv; nguoi: Nguoi[]; toiId: string | null; homNay: string; xong: () => void; daThem: (ten: string) => void }) {
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const v = coSan?.v;
  const gui = () => {
    if (!ref.current?.reportValidity()) return;
    const fd = new FormData(ref.current);
    bat(async () => { const r = await luuCongViec(fd); if (r.loi) setLoi(r.loi); else { if (!coSan) daThem(String(fd.get("tieu_de") ?? "")); xong(); } });
  };
  const bo = (muc: "huy" | "xoa") => {
    if (!coSan || (muc === "xoa" && !window.confirm("Xoá việc này? Không khôi phục được."))) return;
    bat(async () => { const r = muc === "xoa" ? await xoaCongViec(coSan.v.id) : await doiTrangThaiCongViec(coSan.v.id, "Huỷ"); if (r.loi) setLoi(r.loi); else xong(); });
  };
  return (
    <form ref={ref} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
      {coSan && <input type="hidden" name="id" value={coSan.v.id} />}
      <div><label htmlFor="cv-ten" className={NHAN_O}>Tên việc *</label><input id="cv-ten" name="tieu_de" required defaultValue={v?.tieuDe ?? ""} placeholder="Ví dụ: Gọi lại khách hẹn hôm qua" className={O_NHAP} /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label htmlFor="cv-nguoi" className={NHAN_O}>Người làm *</label><Chon id="cv-nguoi" ten="nguoi_lam_id" batBuoc trong="Chọn người" giaTriMacDinh={v?.nguoiLamId ?? toiId ?? ""} luaChon={nguoi.map((x) => ({ gia_tri: x.id, nhan: x.ten }))} /></div>
        <div><label htmlFor="cv-han" className={NHAN_O}>Hạn</label><NgayChon id="cv-han" ten="han" giaTriMacDinh={v?.han ?? (coSan ? "" : homNay)} /></div>
        <div><label htmlFor="cv-lap" className={NHAN_O}>Lặp lại</label><Chon id="cv-lap" ten="lap_lai" trong="Chọn" giaTriMacDinh={v?.lapLai ?? "Không"} luaChon={[{ gia_tri: "Không", nhan: "Làm một lần" }, { gia_tri: "Hằng ngày", nhan: "Lặp lại hằng ngày" }]} /></div>
        <div><label htmlFor="cv-ut" className={NHAN_O}>Mức ưu tiên</label><Chon id="cv-ut" ten="uu_tien" trong="Chọn" giaTriMacDinh={v?.uuTien ?? "Trung bình"} luaChon={["Cao", "Trung bình", "Thấp"].map((x) => ({ gia_tri: x, nhan: x }))} /></div>
        <div><label htmlFor="cv-sl" className={NHAN_O}>Số lượng cần làm</label><input id="cv-sl" name="muc_tieu_so" inputMode="numeric" defaultValue={v?.mucTieu ?? 1} className={O_NHAP} /><p className="mt-1 text-[12px] text-muc-3">Việc lặp hằng ngày: số lượng mỗi ngày.</p></div>
        <div><label htmlFor="cv-dv" className={NHAN_O}>Đơn vị</label><input id="cv-dv" name="don_vi" defaultValue={v?.donVi ?? ""} placeholder="cuộc gọi, bài, đơn…" className={O_NHAP} /></div>
      </div>
      <input type="hidden" name="loai" value={v?.lapLai === "Hằng ngày" ? "Hằng ngày" : v?.loai ?? "Vận hành"} />
      <div><label htmlFor="cv-mt" className={NHAN_O}>Ghi chú</label><textarea id="cv-mt" name="mo_ta" defaultValue={coSan?.moTa ?? ""} className={O_NHIEU_DONG} style={{ minHeight: 72 }} /></div>
      {loi && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</p>}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex gap-4">{coSan && <><button type="button" onClick={() => bo("xoa")} disabled={dang} className={NUT_CHU_NGUY}>Xoá</button><button type="button" onClick={() => bo("huy")} disabled={dang} className="text-[13px] font-medium text-muc-2 hover:underline">Huỷ việc</button></>}</div>
        <div className="flex gap-2.5"><button type="button" onClick={xong} className={NUT_PHU}>Đóng</button><button type="button" onClick={gui} disabled={dang} className={NUT_CHINH}>{dang ? "Đang lưu" : "Lưu"}</button></div>
      </div>
    </form>
  );
}
