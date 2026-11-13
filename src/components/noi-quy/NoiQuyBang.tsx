"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY } from "@/components/ui/dinh-dang";
import { dungLuong } from "@/lib/tep-dinh-kem";
import { LOAI_NOI_QUY, kiemTepNoiQuy } from "@/lib/noi-quy";
import { layLinkNoiQuy, taoLinkNoiQuy, xacNhanNoiQuy, xoaNoiQuy } from "@/app/(app)/noi-quy/actions";

export type TaiLieu = { id: string; loai: string; ten: string; ghiChu: string; tenTep: string; kichThuoc: number; nguoiTai: string; taoLuc: string };

const O = "w-full rounded-nho border border-vien bg-giay-sang px-3 py-2.5 text-[15px] text-muc placeholder:text-muc-3";
const ngay = (s: string) => new Date(s).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

export function NoiQuyBang({ ds, quanLy }: { ds: TaiLieu[]; quanLy: boolean }) {
  const router = useRouter();
  const [dangXuLy, startXuLy] = useTransition();
  const [loi, setLoi] = useState<string | undefined>();
  const [tb, setTb] = useState<string | undefined>();
  const [loai, setLoai] = useState<string>(LOAI_NOI_QUY[0].ma);
  const [ten, setTen] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [tep, setTep] = useState<File | null>(null);
  const [khoa, setKhoa] = useState(0);

  const taiVe = (id: string) => {
    setLoi(undefined);
    startXuLy(async () => {
      const r = await layLinkNoiQuy(id);
      if ("loi" in r) return setLoi(r.loi);
      const a = document.createElement("a");
      a.href = r.url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  };

  const xoa = (t: TaiLieu) => {
    if (!window.confirm(`Xoá “${t.ten}”? Không khôi phục được.`)) return;
    setLoi(undefined);
    setTb(undefined);
    startXuLy(async () => {
      const r = await xoaNoiQuy(t.id);
      if ("loi" in r) return setLoi(r.loi);
      setTb(`Đã xoá “${t.ten}”.`);
      router.refresh();
    });
  };

  const tailen = () => {
    if (!tep) return setLoi("Chọn tệp cần tải lên.");
    if (!ten.trim()) return setLoi("Nhập tên tài liệu.");
    const l = kiemTepNoiQuy(tep.name, tep.size);
    if (l) return setLoi(l);
    setLoi(undefined);
    setTb(undefined);
    startXuLy(async () => {
      const lk = await taoLinkNoiQuy({ loai, tenTep: tep.name, kichThuoc: tep.size });
      if ("loi" in lk) return setLoi(lk.loi);
      const up = await fetch(lk.linkTai, { method: "PUT", body: tep, headers: { "Content-Type": tep.type || "application/octet-stream", "x-upsert": "false" } });
      if (!up.ok) return setLoi("Tải tệp lên kho chưa xong. Thử lại sau.");
      const xn = await xacNhanNoiQuy({ loai, ten, ghiChu, tenTep: tep.name, duongDan: lk.duongDan });
      if ("loi" in xn) return setLoi(xn.loi);
      setTb(`Đã tải lên “${ten.trim()}”.`);
      setTen("");
      setGhiChu("");
      setTep(null);
      setKhoa((k) => k + 1);
      router.refresh();
    });
  };

  const cuaLoai = (ma: string) => ds.filter((t) => t.loai === ma);

  return (
    <div className="space-y-8">
      {quanLy && (
        <section aria-label="Tải tài liệu lên" className="rounded-[14px] border border-vien bg-giay-sang p-5 lg:p-6">
          <h2 className="text-[15px] font-semibold text-muc">Tải tài liệu lên</h2>
          <p className="mt-1 text-[13px] text-muc-3">Tệp PDF, Word, Excel, ảnh… tối đa 25 MB. Ai đăng nhập cũng xem và tải được.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className={`${NHAN_O} block`}>Loại tài liệu</span>
              <Chon giaTri={loai} onDoi={setLoai} luaChon={LOAI_NOI_QUY.map((l) => ({ gia_tri: l.ma, nhan: l.ten }))} />
            </div>
            <div>
              <label htmlFor="nq-ten" className={NHAN_O}>Tên tài liệu *</label>
              <input id="nq-ten" className={O} value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Ví dụ: Nội quy lao động 2026" maxLength={200} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="nq-ghi-chu" className={NHAN_O}>Ghi chú</label>
              <input id="nq-ghi-chu" className={O} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} placeholder="Không bắt buộc, ví dụ: có hiệu lực từ 01/01/2027" maxLength={500} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="nq-tep" className={NHAN_O}>Tệp *</label>
              <input key={khoa} id="nq-tep" type="file" className="text-[14px] text-muc-2" onChange={(e) => setTep(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="button" className={NUT_CHINH} disabled={dangXuLy} onClick={tailen}>{dangXuLy ? "Đang xử lý" : "Tải lên"}</button>
          </div>
        </section>
      )}

      {(loi || tb) && <div role={loi ? "alert" : "status"} className={`rounded-nho px-3 py-2.5 text-[14px] ${loi ? "bg-loi-nen text-loi" : "bg-nhan-nhat text-nhan-dam"}`}>{loi ?? tb}</div>}

      {LOAI_NOI_QUY.map((l) => {
        const ds2 = cuaLoai(l.ma);
        if (ds2.length === 0 && !quanLy) return null;
        return (
          <section key={l.ma} aria-label={l.ten}>
            <h2 className="chu-tieu-de text-[18px] text-muc">{l.ten}</h2>
            {ds2.length === 0 ? (
              <p className="mt-3 rounded-nho border border-vien bg-giay-sang p-5 text-center text-[14px] text-muc-3">Chưa có tài liệu nào.</p>
            ) : (
              <ul className="mt-3 divide-y divide-vien rounded-[14px] border border-vien bg-giay-sang">
                {ds2.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-muc">{t.ten}</p>
                      {t.ghiChu && <p className="mt-0.5 text-[13px] text-muc-2">{t.ghiChu}</p>}
                      <p className="mt-1 text-[12px] text-muc-3">{t.tenTep} · {dungLuong(t.kichThuoc)} · {ngay(t.taoLuc)}{t.nguoiTai ? ` · ${t.nguoiTai}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" className={NUT_CHU} disabled={dangXuLy} onClick={() => taiVe(t.id)}>Tải về</button>
                      {quanLy && <button type="button" className={NUT_CHU_NGUY} disabled={dangXuLy} onClick={() => xoa(t)}>Xoá</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
