"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Download, Eye, Paperclip, Trash2 } from "lucide-react";
import { dsTepAction, linkTepAction, taoLinkTaiLenAction, xacNhanTepAction, xoaTepAction } from "@/app/(app)/hr/tep-actions";
import { Chon } from "@/components/ui/Chon";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { DUOI_TEP, GIOI_HAN_TEP, dungLuong, kiemTep, loaiTheoMan } from "@/lib/tep-dinh-kem";
import type { TepInfo } from "@/lib/tep-dinh-kem-data";

const NGAY = (s: string) => new Date(s).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
export const CHON_TEP_ACCEPT = DUOI_TEP.map((d) => `.${d}`).join(",");

/** Đẩy 1 tệp từ máy lên kho riêng rồi gắn vào dòng (tải thẳng lên link ký, không qua máy chủ web nên không vướng giới hạn 4,5 MB). Trả chữ lỗi hoặc null nếu xong. */
export async function taiTepLen(v: { man: string; dongId: string; loai: string; file: File }): Promise<string | null> {
  const l = kiemTep(v.file.name, v.file.size);
  if (l) return l;
  try {
    const lk = await taoLinkTaiLenAction({ man: v.man, dongId: v.dongId, loai: v.loai, tenTep: v.file.name, kichThuoc: v.file.size });
    if ("loi" in lk) return lk.loi;
    const r = await fetch(lk.linkTai, { method: "PUT", body: v.file, headers: { "Content-Type": v.file.type || "application/octet-stream", "x-upsert": "false" } });
    if (!r.ok) return "Tải lên chưa được. Thử lại sau.";
    const xn = await xacNhanTepAction({ man: v.man, dongId: v.dongId, loai: v.loai, tenTep: v.file.name, kieu: v.file.type || null, duongDan: lk.duongDan });
    return "loi" in xn ? xn.loi : null;
  } catch {
    return "Tải lên chưa được. Kiểm tra mạng rồi thử lại.";
  }
}

/** Danh sách tệp của một dòng: Xem / Tải xuống cho người có quyền xem, thêm tệp cho người có quyền nhập, gỡ tệp cho Trưởng bộ phận trở lên (máy chủ quyết định, không tin trình duyệt). */
export function TepDinhKem({ man, dongId, khiDoi, tieuDe = "Tệp đính kèm" }: { man: string; dongId: string; khiDoi?: () => void; tieuDe?: string }) {
  const loaiDs = loaiTheoMan(man);
  const [ds, setDs] = useState<TepInfo[] | null>(null);
  const [nhap, setNhap] = useState(false);
  const [duocXoa, setDuocXoa] = useState(false);
  const [loi, setLoi] = useState<string | undefined>();
  const [loai, setLoai] = useState<string>(loaiDs[0]);
  const [tien, setTien] = useState<string | undefined>();
  const [dang, bat] = useTransition();
  const o = useRef<HTMLInputElement>(null);

  const ap = (kq: Awaited<ReturnType<typeof dsTepAction>>) => {
    if ("loi" in kq) return setLoi(kq.loi);
    setDs(kq.ds);
    setNhap(kq.nhap);
    setDuocXoa(kq.xoa);
  };
  const tai = async () => ap(await dsTepAction(man, dongId));
  useEffect(() => {
    let huy = false;
    dsTepAction(man, dongId).then((kq) => { if (!huy) ap(kq); });
    return () => { huy = true; };
  }, [man, dongId]);

  const moLink = (id: string, taiXuong: boolean) => bat(async () => {
    setLoi(undefined);
    const kq = await linkTepAction(id, taiXuong);
    if ("loi" in kq) setLoi(kq.loi); else window.open(kq.url, "_blank", "noopener");
  });

  const guiTep = (f: File) => bat(async () => {
    setLoi(undefined);
    setTien(`Đang tải ${f.name}…`);
    const e = await taiTepLen({ man, dongId, loai, file: f });
    setTien(undefined);
    if (o.current) o.current.value = "";
    if (e) return setLoi(e);
    await tai();
    khiDoi?.();
  });

  const go = (t: TepInfo) => {
    if (!window.confirm(`Gỡ tệp "${t.ten_tep}"? Không khôi phục được.`)) return;
    bat(async () => {
      const kq = await xoaTepAction(t.id);
      if ("loi" in kq) setLoi(kq.loi); else { await tai(); khiDoi?.(); }
    });
  };

  return (
    <section aria-label={tieuDe} className="space-y-3">
      <h4 className="flex items-center gap-1.5 text-[14px] font-semibold text-muc"><Paperclip strokeWidth={1.8} className="h-4 w-4" />{tieuDe}{ds ? ` (${ds.length})` : ""}</h4>
      {ds === null && !loi && <p className="text-[13px] text-muc-3">Đang tải…</p>}
      {ds && ds.length === 0 && <p className="text-[13px] text-muc-3">Chưa có tệp nào.</p>}
      {ds && ds.length > 0 && (
        <ul className="divide-y divide-vien rounded-nho border border-vien">
          {ds.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-muc">{t.ten_tep}</p>
                <p className="text-[12px] text-muc-3">{t.loai_giay} · {dungLuong(t.kich_thuoc)} · {NGAY(t.tao_luc)} · {t.nguoi_tai}</p>
              </div>
              <button type="button" onClick={() => moLink(t.id, false)} disabled={dang} className={`${NUT_PHU} flex items-center gap-1`}><Eye strokeWidth={1.8} className="h-4 w-4" />Xem</button>
              <button type="button" onClick={() => moLink(t.id, true)} disabled={dang} className={`${NUT_PHU} flex items-center gap-1`}><Download strokeWidth={1.8} className="h-4 w-4" />Tải xuống</button>
              {duocXoa && <button type="button" onClick={() => go(t)} disabled={dang} aria-label={`Gỡ ${t.ten_tep}`} className="rounded-nho p-2 text-muc-3 hover:text-loi"><Trash2 strokeWidth={1.8} className="h-4 w-4" /></button>}
            </li>
          ))}
        </ul>
      )}
      {nhap && (
        <div className="flex flex-wrap items-end gap-2.5">
          {loaiDs.length > 1 && (
            <div className="min-w-[200px] flex-1 sm:max-w-[320px]">
              <Chon ariaLabel="Loại giấy" trong="Loại giấy" giaTri={loai} luaChon={loaiDs.map((x) => ({ gia_tri: x, nhan: x }))} onDoi={(v) => setLoai(v || loaiDs[0])} />
            </div>
          )}
          <input ref={o} type="file" accept={CHON_TEP_ACCEPT} className="sr-only" id={`tep-${man}-${dongId}`} onChange={(e) => e.target.files?.[0] && guiTep(e.target.files[0])} />
          <label htmlFor={`tep-${man}-${dongId}`} className={`${NUT_CHINH} cursor-pointer ${dang ? "pointer-events-none opacity-60" : ""}`}>{tien ?? "Chọn tệp từ máy để tải lên"}</label>
          <p className="w-full text-[12px] text-muc-3">Tối đa {Math.round(GIOI_HAN_TEP / 1048576)} MB mỗi tệp: PDF, ảnh, Word, Excel, PowerPoint (slide), văn bản, nén. Tệp để riêng tư, link xem hết hạn sau 2 phút.</p>
        </div>
      )}
      {loi && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</p>}
    </section>
  );
}
