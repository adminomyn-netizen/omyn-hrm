"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Plus, X } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { GioChon } from "@/components/ui/GioChon";
import { OTien } from "@/components/ui/OTien";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { createClient } from "@/lib/supabase/client";
import { nopLaiPhieu, nopPhieu, xinUploadTep, type TepMoi } from "@/app/(app)/phe-duyet/actions";
import { tienBangChu, truongDangHien, type MauPhieu, type Truong } from "@/lib/phe-duyet";

export type NhanSuChon = { id: string; ten: string };
export type PhieuNoi = { id: string; ten: string; maPhieu: string };
type Du = Record<string, unknown>;

const KHO = "phe-duyet-tep";
const chuoi = (v: unknown) => (typeof v === "string" ? v : "");

/** Biểu mẫu nộp phiếu dựng từ cấu hình mẫu (bê nguyên ô nhập Lark): ô hiện theo điều kiện, bảng nhiều dòng, đính kèm tệp. Cũng dùng để sửa và nộp lại khi được yêu cầu bổ sung. */
export function FormPhieu({ mau, danhMuc, nhanSu, phieuNoi, tepCu = {}, ban, nopLai }: {
  mau: MauPhieu; danhMuc: Record<string, string[]>; nhanSu: NhanSuChon[]; phieuNoi: PhieuNoi[];
  tepCu?: Record<string, string[]>; ban?: Du; nopLai?: string;
}) {
  const router = useRouter();
  // Ô chọn chỉ còn đúng 1 lựa chọn (vd Đơn vị làm việc = Omyn) thì chọn sẵn, người nộp không phải bấm.
  const [du, setDu] = useState<Du>(() => {
    const d: Du = { ...(ban ?? {}) };
    for (const t of mau.truong) {
      if (typeof d[t.ma] === "string" && d[t.ma]) continue;
      const ds = t.kieu === "dm" ? danhMuc[t.danhMuc ?? ""] ?? [] : t.kieu === "chon" ? [...(t.luaChon ?? [])] : [];
      if (ds.length === 1) d[t.ma] = ds[0];
    }
    // Bảng bắt buộc (vd Hạng mục chi phí) hiện sẵn một dòng trống để người nộp thấy ngay chỗ nhập.
    for (const t of mau.truong) if (t.kieu === "bang" && t.batBuoc && !Array.isArray(d[t.ma])) d[t.ma] = [{}];
    return d;
  });
  const [tep, setTep] = useState<Record<string, TepMoi[]>>({});
  const [loi, setLoi] = useState<string>();
  const [loiO, setLoiO] = useState<Record<string, string>>({});
  const [dangTai, setDangTai] = useState(false);
  const [dangGui, batDau] = useTransition();
  const dat = (ma: string, v: unknown) => setDu((d) => ({ ...d, [ma]: v }));

  async function chonTep(truong: string, ds: FileList | null) {
    if (!ds || ds.length === 0) return;
    setDangTai(true); setLoi(undefined);
    try {
      const files = [...ds];
      const r = await xinUploadTep(files.map((f) => ({ ten: f.name, kichThuoc: f.size })));
      if (r.loi || !r.ds) { setLoi(r.loi ?? "Không tải được tệp."); return; }
      const kho = createClient().storage.from(KHO);
      const xong: TepMoi[] = [];
      for (let i = 0; i < files.length; i++) {
        const { error } = await kho.uploadToSignedUrl(r.ds[i].duongDan, r.ds[i].token, files[i]);
        if (error) { setLoi(`Tải “${files[i].name}” lên không được, thử lại.`); continue; }
        xong.push({ truong, ten: files[i].name, duongDan: r.ds[i].duongDan, kichThuoc: files[i].size, loai: files[i].type || null });
      }
      setTep((t) => ({ ...t, [truong]: [...(t[truong] ?? []), ...xong] }));
    } finally {
      setDangTai(false);
    }
  }

  const gui = () => batDau(async () => {
    setLoi(undefined); setLoiO({});
    const moi = Object.values(tep).flat();
    const r = nopLai ? await nopLaiPhieu(nopLai, du, moi) : await nopPhieu(mau.ma, du, moi);
    if (!r.ok) { setLoi(r.loi); setLoiO(r.loiO ?? {}); return; }
    router.push(`/phe-duyet/${r.id}`);
    router.refresh();
  });

  function Cap({ t, khoa, nhan, children }: { t: Truong; khoa: string; nhan?: string; children: React.ReactNode }) {
    return (
      <div className={t.kieu === "nhieu" || t.kieu === "bang" || t.kieu === "tep" ? "sm:col-span-2" : ""}>
        <label className={NHAN_O}>{nhan ?? t.ten}{t.batBuoc && <span className="text-loi"> *</span>}</label>
        {children}
        {loiO[khoa] && <p role="alert" className="mt-1 text-[13px] text-loi">{loiO[khoa]}</p>}
      </div>
    );
  }

  function Truong1({ t, v, dat1, khoa, goc }: { t: Truong; v: unknown; dat1: (x: unknown) => void; khoa: string; goc: Du }) {
    if (!truongDangHien(t, goc)) return null;
    switch (t.kieu) {
      case "chu": {
        if (t.bangChuTu) return <Cap t={t} khoa={khoa} nhan={`${t.ten} (tự điền, không nhập)`}><input readOnly tabIndex={-1} value={tienBangChu(Number(du[t.bangChuTu]))} placeholder={t.goiY} className={`${O_NHAP} cursor-not-allowed bg-giay-tram`} /></Cap>;
        return <Cap t={t} khoa={khoa}><input value={chuoi(v)} onChange={(e) => dat1(e.target.value)} placeholder={t.goiY} maxLength={300} className={O_NHAP} /></Cap>;
      }
      case "nhieu":
        return <Cap t={t} khoa={khoa}><textarea value={chuoi(v)} onChange={(e) => dat1(e.target.value)} maxLength={4000} className={O_NHIEU_DONG} /></Cap>;
      case "ngay":
        return <Cap t={t} khoa={khoa}><NgayChon ariaLabel={t.ten} giaTri={chuoi(v)} onDoi={dat1} denNam={2100} tuNam={2020} /></Cap>;
      case "ngay_gio": {
        const [d = "", g = ""] = chuoi(v).split("T");
        return (
          <Cap t={t} khoa={khoa}>
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <NgayChon ariaLabel={`${t.ten} (ngày)`} giaTri={d} onDoi={(x) => dat1(x && g ? `${x}T${g}` : x ? `${x}T` : "")} denNam={2100} tuNam={2020} />
              <GioChon ariaLabel={`${t.ten} (giờ)`} giaTriMacDinh={g} onDoi={(x) => dat1(d && x ? `${d}T${x}` : d ? `${d}T` : "")} />
            </div>
          </Cap>
        );
      }
      case "so":
        return <Cap t={t} khoa={khoa}><input inputMode="numeric" value={v === undefined || v === null ? "" : String(v)} onChange={(e) => dat1(e.target.value.replace(/\D/g, ""))} className={O_NHAP} /></Cap>;
      case "tien":
        return <Cap t={t} khoa={khoa}><OTien ariaLabel={t.ten} giaTriMacDinh={typeof v === "number" ? v : 0} onDoi={dat1} /></Cap>;
      case "chon":
        return <Cap t={t} khoa={khoa}><Chon ariaLabel={t.ten} giaTri={chuoi(v)} onDoi={dat1} luaChon={(t.luaChon ?? []).map((x) => ({ gia_tri: x, nhan: x }))} /></Cap>;
      case "dm": {
        const ds = danhMuc[t.danhMuc ?? ""] ?? [];
        return (
          <Cap t={t} khoa={khoa}>
            {ds.length > 0
              ? <Chon ariaLabel={t.ten} giaTri={chuoi(v)} onDoi={dat1} luaChon={ds.map((x) => ({ gia_tri: x, nhan: x }))} />
              : <input value={chuoi(v)} onChange={(e) => dat1(e.target.value)} maxLength={200} placeholder={`Nhập ${t.ten.toLowerCase()}`} className={O_NHAP} />}
          </Cap>
        );
      }
      case "nv": {
        const ds = t.nhieu ? (Array.isArray(v) ? (v as string[]) : []) : [];
        const ten = (id: string) => nhanSu.find((n) => n.id === id)?.ten ?? "(đã nghỉ)";
        return (
          <Cap t={t} khoa={khoa}>
            {t.nhieu ? (
              <div className="space-y-2">
                {ds.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {ds.map((id) => (
                      <li key={id} className="flex items-center gap-1 rounded-tag bg-giay-tram px-2 py-1 text-[13px] text-muc-2">
                        {ten(id)}
                        <button type="button" aria-label={`Bỏ ${ten(id)}`} onClick={() => dat1(ds.filter((x) => x !== id))} className="text-muc-3 hover:text-loi"><X className="h-3.5 w-3.5" strokeWidth={1.8} /></button>
                      </li>
                    ))}
                  </ul>
                )}
                <Chon ariaLabel={`Thêm ${t.ten}`} trong="Thêm người" giaTri="" onDoi={(id) => id && !ds.includes(id) && dat1([...ds, id])} luaChon={nhanSu.filter((n) => !ds.includes(n.id)).map((n) => ({ gia_tri: n.id, nhan: n.ten }))} />
              </div>
            ) : (
              <Chon ariaLabel={t.ten} trong="Chọn người" giaTri={chuoi(v)} onDoi={dat1} luaChon={nhanSu.map((n) => ({ gia_tri: n.id, nhan: n.ten }))} />
            )}
          </Cap>
        );
      }
      case "phieu": {
        const ds = phieuNoi.filter((p) => !t.loaiPhieuNoi || t.loaiPhieuNoi.includes(p.maPhieu));
        return (
          <Cap t={t} khoa={khoa}>
            <Chon ariaLabel={t.ten} trong={ds.length ? "Chọn phiếu" : "Chưa có phiếu nào để nối"} giaTri={chuoi(v)} onDoi={dat1} luaChon={ds.map((p) => ({ gia_tri: p.id, nhan: p.ten }))} />
          </Cap>
        );
      }
      case "cong":
        return <Cap t={t} khoa={khoa} nhan={`${t.ten} (tự cộng từ các dòng hạng mục, không nhập)`}><div className={`${O_NHAP} flex cursor-not-allowed items-center bg-giay-tram tabular-nums`}>{Number(tongBang(t)).toLocaleString("vi-VN")} đ</div></Cap>;
      case "tep": {
        const moi = tep[t.ma] ?? [];
        const cu = tepCu[t.ma] ?? [];
        return (
          <Cap t={t} khoa={khoa}>
            <div className="space-y-2">
              {(cu.length > 0 || moi.length > 0) && (
                <ul className="space-y-1">
                  {cu.map((ten, i) => <li key={`c${i}`} className="flex items-center gap-2 text-[13px] text-muc-2"><Paperclip className="h-3.5 w-3.5 text-muc-3" strokeWidth={1.6} />{ten}<span className="text-muc-3">(đã đính kèm)</span></li>)}
                  {moi.map((f, i) => (
                    <li key={f.duongDan} className="flex items-center gap-2 text-[13px] text-muc-2">
                      <Paperclip className="h-3.5 w-3.5 text-muc-3" strokeWidth={1.6} />{f.ten}
                      <button type="button" className={NUT_CHU_NGUY} onClick={() => setTep((x) => ({ ...x, [t.ma]: moi.filter((_, j) => j !== i) }))}>Bỏ</button>
                    </li>
                  ))}
                </ul>
              )}
              <label className={`${NUT_PHU} inline-flex cursor-pointer items-center gap-2 ${dangTai ? "pointer-events-none opacity-60" : ""}`}>
                <Plus className="h-4 w-4" strokeWidth={1.6} />{dangTai ? "Đang tải lên…" : "Đính kèm tệp"}
                <input type="file" multiple className="sr-only" disabled={dangTai} onChange={(e) => { void chonTep(t.ma, e.target.files); e.target.value = ""; }} />
              </label>
              <p className="text-[12px] text-muc-3">PDF, ảnh, Word, Excel, PowerPoint, CSV, TXT, ZIP; mỗi tệp tối đa 25 MB.</p>
            </div>
          </Cap>
        );
      }
      case "bang": {
        const dong = Array.isArray(v) ? (v as Du[]) : [];
        const sua = (i: number, ma: string, x: unknown) => dat1(dong.map((d, j) => (j === i ? { ...d, [ma]: x } : d)));
        return (
          <Cap t={t} khoa={khoa}>
            <div className="space-y-2.5">
              {dong.map((d, i) => (
                <div key={i} className="rounded-nho border border-vien p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(t.con ?? []).map((c) => <Truong1 key={c.ma} t={c} v={d[c.ma]} dat1={(x) => sua(i, c.ma, x)} khoa={`${t.ma}.${i}.${c.ma}`} goc={d} />)}
                  </div>
                  <button type="button" className={`${NUT_CHU_NGUY} mt-2`} onClick={() => dat1(dong.filter((_, j) => j !== i))}>Xoá dòng {i + 1}</button>
                </div>
              ))}
              <button type="button" className={`${NUT_PHU} inline-flex items-center gap-2`} onClick={() => dat1([...dong, {}])}><Plus className="h-4 w-4" strokeWidth={1.6} />Thêm dòng</button>
            </div>
          </Cap>
        );
      }
    }
  }

  const tongBang = (t: Truong) => ((du[t.tong?.bang ?? ""] as Du[] | undefined) ?? []).reduce((s, d) => s + (typeof d[t.tong?.cot ?? ""] === "number" ? (d[t.tong?.cot ?? ""] as number) : 0), 0);

  return (
    <div className="the-noi the-noi-thap p-5 sm:p-6">
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        {mau.truong.map((t) => <Truong1 key={t.ma} t={t} v={du[t.ma]} dat1={(x) => dat(t.ma, x)} khoa={t.ma} goc={du} />)}
      </div>
      {loi && <p role="alert" className="mt-5 text-[14px] text-loi">{loi}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-vien pt-5">
        <button type="button" onClick={gui} disabled={dangGui || dangTai} className={NUT_CHINH}>{dangGui ? "Đang gửi…" : nopLai ? "Nộp lại phiếu" : "Gửi phiếu"}</button>
        <button type="button" onClick={() => router.back()} className={NUT_CHU}>Quay lại</button>
      </div>
    </div>
  );
}
