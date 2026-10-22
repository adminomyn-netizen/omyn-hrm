"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { luuThamSo, xacNhanThamSo } from "@/app/(app)/luong/actions";
import { tienVN } from "@/lib/dinh-dang";

export type ThamSoView = { khoa: string; nhan: string; gia_tri: number; don_vi: string; nguon: string | null; xac_nhan_luc: string | null };

const hienGiaTri = (t: ThamSoView) => (t.don_vi === "dong" ? `${tienVN(t.gia_tri)}` : t.don_vi === "phan_tram" ? `${t.gia_tri}%` : t.don_vi === "ngay" ? `${t.gia_tri} ngày` : String(t.gia_tri));

/** Tham số tính lương (BH, thuế, giảm trừ, tăng ca...). Số liệu pháp lý phải được Quản trị xác nhận trước khi duyệt kỳ lương. */
export function ThamSoLuong({ ds }: { ds: ThamSoView[] }) {
  const router = useRouter();
  const [sua, setSua] = useState<ThamSoView | null>(null);
  const [gia, setGia] = useState("");
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const chua = ds.filter((t) => !t.xac_nhan_luc).length;

  const luu = () => {
    if (!sua) return;
    const fd = new FormData();
    fd.set("khoa", sua.khoa);
    fd.set("gia_tri", gia);
    startXuLy(async () => {
      const r = await luuThamSo(fd);
      if (r.loi) setLoi(r.loi);
      else {
        setSua(null);
        setLoi(undefined);
        router.refresh();
      }
    });
  };
  const xacNhan = () =>
    startXuLy(async () => {
      const r = await xacNhanThamSo();
      if (r.loi) setLoi(r.loi);
      else router.refresh();
    });

  return (
    <>
      {chua > 0 ? (
        <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-nho bg-canh-bao-nen px-4 py-3 text-[14px] text-canh-bao">
          <span>{chua} tham số chưa được xác nhận. Đối chiếu với quy định hiện hành rồi xác nhận — chưa xác nhận hết thì không duyệt được kỳ lương.</span>
          <button type="button" className={NUT_CHINH} disabled={dangXuLy} onClick={xacNhan}>Xác nhận tất cả</button>
        </div>
      ) : (
        <div role="status" className="mb-5 rounded-nho bg-nhan-nhat px-4 py-3 text-[14px] text-nhan-dam">Mọi tham số đã được xác nhận.</div>
      )}
      {loi && !sua && <div role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-[14px]">
          <thead>
            <tr className="nhan-muc border-b border-vien">
              <th className="py-3 pr-4 font-medium">Tham số</th>
              <th className="py-3 pr-4 text-right font-medium">Giá trị</th>
              <th className="py-3 pr-4 font-medium">Nguồn</th>
              <th className="py-3 pr-4 font-medium">Trạng thái</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {ds.map((t) => (
              <tr key={t.khoa} className="h-[52px] border-b border-vien hover:bg-giay-tram/60">
                <td className="py-2 pr-4 font-medium text-muc">{t.nhan}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-muc">{hienGiaTri(t)}</td>
                <td className="py-2 pr-4 text-[13px] text-muc-3">{t.nguon ?? "—"}</td>
                <td className="py-2 pr-4"><NhanTrangThai kieu={t.xac_nhan_luc ? "tot" : "cho"}>{t.xac_nhan_luc ? "Đã xác nhận" : "Chưa xác nhận"}</NhanTrangThai></td>
                <td className="py-2 text-right"><button type="button" className={NUT_CHU} onClick={() => { setSua(t); setGia(String(t.gia_tri)); setLoi(undefined); }}>Sửa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Hop mo={!!sua} dong={() => setSua(null)} tieuDe="Sửa tham số" moTa={sua?.nhan}>
        {sua && (
          <div className="space-y-4">
            <div>
              <label className={NHAN_O} htmlFor="ts-gia">Giá trị ({sua.don_vi === "dong" ? "đồng" : sua.don_vi === "phan_tram" ? "%" : sua.don_vi === "ngay" ? "ngày" : "số"})</label>
              <input id="ts-gia" inputMode="decimal" value={gia} onChange={(e) => setGia(e.target.value)} className={`${O_NHAP} text-right tabular-nums`} />
              <div className="mt-1 text-[12px] text-muc-3">Sửa xong tham số này sẽ về trạng thái chưa xác nhận.</div>
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={() => setSua(null)} disabled={dangXuLy}>Huỷ</button>
              <button type="button" className={NUT_CHINH} onClick={luu} disabled={dangXuLy}>{dangXuLy ? "Đang lưu" : "Lưu"}</button>
            </div>
          </div>
        )}
      </Hop>
    </>
  );
}
