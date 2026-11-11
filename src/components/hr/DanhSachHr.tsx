"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { CalendarClock, Paperclip, Pencil, Plus, Search } from "lucide-react";
import { luuBanGhiHr, xoaBanGhiHr } from "@/app/(app)/hr/actions";
import { Chon } from "@/components/ui/Chon";
import Link from "next/link";
import { Hop } from "@/components/ui/Hop";
import { nhomDong } from "@/lib/nhom-danh-sach";
import { NgayChon } from "@/components/ui/NgayChon";
import { ChonNhieuNguoi } from "@/components/hr/ChonNhieuNguoi";
import { TepDinhKem } from "@/components/hr/TepDinhKem";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import type { CotHr, MucHr } from "@/lib/hr-module";

type Dong = Record<string, string | number | boolean | string[] | null> & { id: string };
type Tra = { id: string; ten: string };

const NGAY = (s: unknown) => (typeof s === "string" && s ? s.slice(0, 10).split("-").reverse().join("/") : "");
const GIO = (s: unknown) => {
  if (typeof s !== "string" || !s) return "";
  const d = new Date(s);
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", hour12: false, timeZone: "Asia/Ho_Chi_Minh" });
};
const TIEN = (n: unknown) => (typeof n === "number" ? `${n.toLocaleString("vi-VN")} đ` : "");
const SO_NGAY = (s: unknown) => (typeof s === "string" && s ? Math.round((new Date(s.slice(0, 10)).getTime() - Date.now()) / 86400000) : null);

const KIEU_NHAN = (v: string): "tot" | "cho" | "loi" | "tram" =>
  /^(Đạt|Đã chốt|Đủ người|Đồng ý|Đã duyệt|Đang dùng|Đang tuyển|Đang hiệu lực|Ký tiếp|Ký không)/.test(v) ? "tot" : /^(Chờ|Soạn|Kế hoạch|Thương lượng|Cần theo dõi|Hoãn|Gia hạn)/.test(v) ? "cho" : /^(Không đạt|Từ chối|Huỷ|Vắng|Tạm dừng|Đã hết hạn|Đã chấm dứt|Không tái ký)/.test(v) ? "loi" : "tram";

function hienGiaTri(c: CotHr, d: Dong, nv: Map<string, string>, khoi: Map<string, string>, tc: Map<string, string>): string {
  const v = d[c.k];
  if (v === null || v === undefined || v === "") return "";
  switch (c.kieu) {
    case "ngay": return NGAY(v);
    case "gio": return GIO(v);
    case "tien": return TIEN(v);
    case "nv": return nv.get(String(v)) ?? "";
    case "nhieuNv": return (Array.isArray(v) ? v : []).map((i) => nv.get(String(i)) ?? "").filter(Boolean).join(", ");
    case "khoi": return khoi.get(String(v)) ?? "";
    case "tc": return tc.get(String(v)) ?? "";
    case "co": return v ? "Có" : "Không";
    default: return String(v);
  }
}

/** Thẻ danh sách + hộp thoại thêm/sửa cho mọi mục HR khai trong hr-module.ts. Thẻ gọn trên điện thoại, 2–3 cột trên máy tính. */
export function DanhSachHr({ muc, dong, nv, khoi, tc = {}, chiXem = false, khongXoa = false, coTep = false, soTep = {} }: { muc: MucHr; dong: Dong[]; nv: Tra[]; khoi: Tra[]; tc?: Record<string, Tra[]>; chiXem?: boolean; khongXoa?: boolean; coTep?: boolean; soTep?: Record<string, number> }) {
  const [tim, setTim] = useState("");
  const [loc, setLoc] = useState("");
  const [locCot, setLocCot] = useState<Record<string, string>>({});
  const [chiSap, setChiSap] = useState(false);
  const [sua, setSua] = useState<Dong | "moi" | null>(null);
  const [xemTep, setXemTep] = useState<Dong | null>(null);
  const hienTep = coTep;
  const nvMap = useMemo(() => new Map(nv.map((x) => [x.id, x.ten])), [nv]);
  const khoiMap = useMemo(() => new Map(khoi.map((x) => [x.id, x.ten])), [khoi]);
  const tcMap = useMemo(() => new Map(Object.values(tc).flat().map((x) => [x.id, x.ten])), [tc]);
  const cotTT = muc.cot.find((c) => c.k === muc.trangThai);
  const dem = useMemo(() => {
    const m = new Map<string, number>();
    if (muc.trangThai) for (const d of dong) m.set(String(d[muc.trangThai] ?? ""), (m.get(String(d[muc.trangThai] ?? "")) ?? 0) + 1);
    return m;
  }, [dong, muc.trangThai]);
  const sapHetCua = (d: Dong) => {
    const n = muc.canhBao ? SO_NGAY(d[muc.canhBao.cot]) : null;
    return n !== null && n >= 0 && n <= muc.canhBao!.ngay;
  };
  const giaTriLoc = useMemo(() => Object.fromEntries((muc.locTheo ?? []).map((k) => [k, [...new Set(dong.map((d) => String(d[k] ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"))])), [dong, muc.locTheo]);
  const hien = dong.filter((d) => {
    if (loc && muc.trangThai && d[muc.trangThai] !== loc) return false;
    for (const [k, v] of Object.entries(locCot)) if (v && String(d[k] ?? "").trim() !== v) return false;
    if (chiSap && !sapHetCua(d)) return false;
    if (!tim.trim()) return true;
    const q = tim.trim().toLowerCase();
    return muc.cot.some((c) => hienGiaTri(c, d, nvMap, khoiMap, tcMap).toLowerCase().includes(q));
  });
  const cotTieuDe = muc.cot.find((c) => c.k === muc.tieuDe)!;

  const the = (d: Dong) => {
    const tt = muc.trangThai ? String(d[muc.trangThai] ?? "") : "";
    const ngayCB = muc.canhBao ? SO_NGAY(d[muc.canhBao.cot]) : null;
    const sapDen = sapHetCua(d);
    const nTep = soTep[d.id] ?? 0;
    return (
      <div className="the-noi flex h-full flex-col rounded-nho border border-vien bg-giay-sang transition-shadow hover:[box-shadow:var(--bong-2)]">
      <button type="button" onClick={() => !chiXem && setSua(d)} disabled={chiXem} className={`group flex w-full flex-1 flex-col gap-3 p-4 text-left ${chiXem ? "cursor-default" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[16px] font-semibold leading-snug text-muc">{hienGiaTri(cotTieuDe, d, nvMap, khoiMap, tcMap) || "(chưa đặt tên)"}</h3>
          <Pencil strokeWidth={1.6} className="mt-1 h-4 w-4 shrink-0 text-muc-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tt && <NhanTrangThai kieu={KIEU_NHAN(tt)}>{tt}</NhanTrangThai>}
          {sapDen && <span className="inline-flex items-center gap-1 rounded-tag bg-canh-bao-nen px-2 py-0.5 text-[12px] font-medium text-canh-bao"><CalendarClock strokeWidth={1.8} className="h-3.5 w-3.5" />{muc.canhBao!.nhan}{ngayCB === 0 ? " · hôm nay" : ` · ${ngayCB} ngày`}</span>}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
          {muc.cot.filter((c) => c.the && c.k !== muc.trangThai && c.k !== muc.tieuDe).map((c) => {
            const g = hienGiaTri(c, d, nvMap, khoiMap, tcMap);
            return g ? <div key={c.k} className="min-w-0"><dt className="text-muc-3">{c.nhan}</dt><dd className="truncate font-medium text-muc">{g}</dd></div> : null;
          })}
        </dl>
      </button>
      {hienTep && (
        <button type="button" onClick={() => setXemTep(d)} className="flex items-center gap-1.5 border-t border-vien px-4 py-2.5 text-left text-[13px] font-medium text-nhan-dam hover:underline"><Paperclip strokeWidth={1.8} className="h-3.5 w-3.5" />{nTep ? `${nTep} tệp đính kèm` : "Tệp đính kèm"}</button>
      )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
          <Search strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muc-3" />
          <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm nhanh…" aria-label="Tìm trong danh sách" className={`${O_NHAP} pl-9`} />
        </div>
        {chiXem ? <span className="ml-auto text-[13px] text-muc-3">Chỉ xem — {muc.chiGiamDocSua ? "chỉ giám đốc nhập/sửa" : "bạn không có quyền sửa"}</span> : <button type="button" onClick={() => setSua("moi")} className={`${NUT_CHINH} ml-auto flex items-center gap-1.5`}><Plus strokeWidth={1.8} className="h-4 w-4" />Thêm mới</button>}
      </div>
      {cotTT?.luaChon && (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
          {[["", `Tất cả (${dong.length})`] as const, ...cotTT.luaChon.filter((o) => dem.get(o)).map((o) => [o, `${o} (${dem.get(o)})`] as const)].map(([v, nhan]) => (
            <button key={v || "tat-ca"} type="button" onClick={() => setLoc(v)} aria-pressed={loc === v}
              className={`rounded-tag border px-3 py-1.5 text-[13px] transition-colors ${loc === v ? "border-transparent nut-vang" : "border-vien bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>{nhan}</button>
          ))}
        </div>
      )}
      {muc.locTheo && muc.locTheo.length > 0 && (
        <div className="mb-5 flex flex-wrap items-end gap-3" role="group" aria-label="Lọc danh sách">
          {muc.locTheo.map((k) => {
            const nhan = muc.cot.find((c) => c.k === k)?.nhan.replace(/ \(.*\)$/, "") ?? k;
            return (
              <div key={k} className="w-[210px] max-w-full">
                <span className="mb-1 block text-[12px] text-muc-3">{nhan}</span>
                <Chon nho ariaLabel={`Lọc theo ${nhan}`} giaTri={locCot[k] || "tat-ca"} onDoi={(v) => setLocCot({ ...locCot, [k]: v === "tat-ca" ? "" : v })} luaChon={[{ gia_tri: "tat-ca", nhan: "Tất cả" }, ...(giaTriLoc[k] ?? []).map((x) => ({ gia_tri: x, nhan: x }))]} />
              </div>
            );
          })}
          {muc.canhBao && (
            <button type="button" onClick={() => setChiSap(!chiSap)} aria-pressed={chiSap}
              className={`h-9 rounded-tag border px-3 text-[13px] transition-colors ${chiSap ? "border-transparent nut-vang" : "border-vien bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>{muc.canhBao.nhan}</button>
          )}
        </div>
      )}
      {hien.length === 0 ? (
        <p className="rounded-nho border border-dashed border-vien px-5 py-10 text-center text-[14px] text-muc-3">{dong.length === 0 ? muc.trong : "Không có dòng nào khớp."}</p>
      ) : muc.nhomTheo ? (
        <div className="space-y-8">
          {nhomDong(hien, muc.nhomTheo, sapHetCua).map((c) => (
            <section key={c.ten} aria-label={c.ten}>
              <h2 className="mb-3 flex flex-wrap items-center gap-2 border-b border-vien pb-2 text-[18px] font-semibold text-muc">
                {c.ten}
                <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-[12px] font-medium text-muc-2">{c.so} dòng</span>
                {c.sapHet > 0 && <span className="rounded-tag bg-canh-bao-nen px-2 py-0.5 text-[12px] font-medium text-canh-bao">{c.sapHet} {muc.canhBao?.nhan.toLowerCase()}</span>}
              </h2>
              <div className="space-y-5">
                {c.con.map((cc) => (
                  <div key={cc.ten}>
                    <h3 className="mb-2 flex flex-wrap items-center gap-2 text-[14px] font-medium text-muc-2">
                      {cc.ten}
                      <span className="text-[12px] font-normal text-muc-3">{cc.so} dòng</span>
                      {cc.sapHet > 0 && <span className="rounded-tag bg-canh-bao-nen px-2 py-0.5 text-[12px] font-medium text-canh-bao">{cc.sapHet} {muc.canhBao?.nhan.toLowerCase()}</span>}
                    </h3>
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{cc.dong.map((d) => <li key={d.id}>{the(d)}</li>)}</ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {hien.map((d) => <li key={d.id}>{the(d)}</li>)}
        </ul>
      )}
      <Hop mo={sua !== null} dong={() => setSua(null)} tieuDe={sua === "moi" ? `Thêm: ${muc.ten}` : `Sửa: ${muc.ten}`} rong="rong">
        {muc.ma === "offer-tuyen-dung" && sua !== null && sua !== "moi" && (
          <p className="mb-3 text-[14px]"><Link href={`/thu-moi-nhan-viec/${sua.id}`} className="font-medium text-nhan-dam hover:underline">Xem và in thư mời nhận việc →</Link></p>
        )}
        {sua !== null && <FormHr key={sua === "moi" ? "moi" : sua.id} muc={muc} coSan={sua === "moi" ? undefined : sua} nv={nv} khoi={khoi} tc={tc} khongXoa={khongXoa} xong={() => setSua(null)} />}
        {hienTep && sua !== null && (
          <div className="mt-5 border-t border-vien pt-4">
            {sua === "moi" ? <p className="text-[13px] text-muc-3">Lưu dòng này xong sẽ đính kèm được tệp.</p> : <TepDinhKem man={muc.ma} dongId={sua.id} />}
          </div>
        )}
      </Hop>
      <Hop mo={xemTep !== null} dong={() => setXemTep(null)} tieuDe={xemTep ? `Tệp đính kèm: ${hienGiaTri(cotTieuDe, xemTep, nvMap, khoiMap, tcMap) || muc.ten}` : "Tệp đính kèm"} rong="rong">
        {xemTep !== null && <TepDinhKem man={muc.ma} dongId={xemTep.id} />}
      </Hop>
    </div>
  );
}

function FormHr({ muc, coSan, nv, khoi, tc, khongXoa, xong }: { khongXoa: boolean; muc: MucHr; coSan?: Dong; nv: Tra[]; khoi: Tra[]; tc: Record<string, Tra[]>; xong: () => void }) {
  const [loi, setLoi] = useState<string | undefined>();
  const [dang, bat] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const gui = () => {
    if (!ref.current?.reportValidity()) return;
    const fd = new FormData(ref.current);
    bat(async () => { const kq = await luuBanGhiHr(fd); if (kq.loi) setLoi(kq.loi); else xong(); });
  };
  const xoa = () => {
    if (!coSan || !window.confirm("Xoá dòng này? Không khôi phục được.")) return;
    bat(async () => { const kq = await xoaBanGhiHr(muc.ma, coSan.id); if (kq.loi) setLoi(kq.loi); else xong(); });
  };
  const macDinh = (c: CotHr) => String(coSan ? (coSan[c.k] ?? "") : (c.mac ?? ""));
  return (
    <form ref={ref} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
      <input type="hidden" name="ma" value={muc.ma} />
      {coSan && <input type="hidden" name="id" value={coSan.id} />}
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        {muc.cot.map((c) => {
          const id = `hr-${c.k}`;
          const nhan = <label htmlFor={id} className={NHAN_O}>{c.nhan}{c.batBuoc ? " *" : ""}</label>;
          const o = (() => {
            switch (c.kieu) {
              case "nhieu": return <textarea id={id} name={c.k} defaultValue={macDinh(c)} className={O_NHIEU_DONG} style={{ minHeight: 72 }} />;
              case "so": case "tien": return <input id={id} name={c.k} inputMode="numeric" defaultValue={macDinh(c)} className={O_NHAP} />;
              case "ngay": return <NgayChon id={id} ten={c.k} giaTriMacDinh={macDinh(c).slice(0, 10)} batBuoc={c.batBuoc} />;
              case "gio": return <input id={id} name={c.k} type="datetime-local" required={c.batBuoc} defaultValue={coSan?.[c.k] ? new Date(String(coSan[c.k])).toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 16).replace(" ", "T") : ""} className={O_NHAP} />;
              case "chon": return <Chon id={id} ten={c.k} trong="Chọn" giaTriMacDinh={macDinh(c)} luaChon={(c.luaChon ?? []).map((x) => ({ gia_tri: x, nhan: x }))} />;
              case "nhieuNv": return <ChonNhieuNguoi id={id} ten={c.k} nv={nv} daChon={Array.isArray(coSan?.[c.k]) ? (coSan?.[c.k] as string[]) : []} />;
              case "nv": return <Chon id={id} ten={c.k} trong="Chọn nhân viên" giaTriMacDinh={macDinh(c)} luaChon={nv.map((x) => ({ gia_tri: x.id, nhan: x.ten }))} />;
              case "khoi": return <Chon id={id} ten={c.k} trong="Chọn khối" giaTriMacDinh={macDinh(c)} luaChon={khoi.map((x) => ({ gia_tri: x.id, nhan: x.ten }))} />;
              case "tc": return <Chon id={id} ten={c.k} trong="Chọn" giaTriMacDinh={macDinh(c)} luaChon={(tc[c.bangTc ?? ""] ?? []).map((x) => ({ gia_tri: x.id, nhan: x.ten }))} />;
              default: return <input id={id} name={c.k} required={c.batBuoc} placeholder={c.goiY} defaultValue={macDinh(c)} className={O_NHAP} />;
            }
          })();
          return <div key={c.k} className={c.rong || c.kieu === "nhieu" ? "sm:col-span-2" : ""}>{nhan}{o}</div>;
        })}
      </div>
      {loi && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</p>}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>{coSan && !khongXoa && <button type="button" onClick={xoa} disabled={dang} className={NUT_CHU_NGUY}>Xoá</button>}</div>
        <div className="flex gap-2.5"><button type="button" onClick={xong} className={NUT_PHU}>Huỷ</button><button type="button" onClick={gui} disabled={dang} className={NUT_CHINH}>{dang ? "Đang lưu" : "Lưu"}</button></div>
      </div>
    </form>
  );
}
