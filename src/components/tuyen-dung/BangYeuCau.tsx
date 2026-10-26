"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { doiTrangThaiYeuCau, guiYeuCau, taoTinTuYeuCau } from "@/app/(app)/tuyen-dung/yeu-cau-actions";
import { LOAI_TUYEN, buocTiepTheoYeuCau } from "@/lib/tuyen-dung";
import { ngayVN } from "@/lib/dinh-dang";
import type { YeuCauTd } from "@/lib/data-tuyen-dung";

const kieu = (tt: string) => (tt === "Hoàn thành" ? "tot" : tt === "Từ chối" || tt === "Huỷ" ? "loi" : tt === "Chờ tiếp nhận" ? "cho" : "tram");
type HopMo = { k: "gui" } | { k: "ly-do"; yc: YeuCauTd; den: "Từ chối" | "Huỷ" };

/** Yêu cầu tuyển dụng: người gửi (trưởng bộ phận/Quản trị) tạo yêu cầu; HCNS (quanTri) tiếp nhận, từ chối có lý do, tạo tin, hoàn thành. Không có nút xoá: chỉ huỷ kèm lý do. */
export function BangYeuCau({ yeuCau, khoi, quanTri, choGui, trong }: { yeuCau: YeuCauTd[]; khoi: { id: string; ten: string }[]; quanTri: boolean; choGui: boolean; trong: string }) {
  const router = useRouter();
  const [hop, setHop] = useState<HopMo | null>(null);
  const [loi, setLoi] = useState<string | undefined>();
  const [lyDo, setLyDo] = useState("");
  const [loai, setLoai] = useState<string>("Trong định biên");
  const [dang, bat] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const dong = () => { setHop(null); setLoi(undefined); setLyDo(""); };
  const chay = (fn: (fd: FormData) => Promise<{ loi?: string }>, fd: FormData, sau?: () => void) =>
    bat(async () => {
      const kq = await fn(fd);
      if (kq.loi) setLoi(kq.loi);
      else { setLoi(undefined); sau?.(); router.refresh(); }
    });
  const doi = (yc: YeuCauTd, den: string, ly?: string) => {
    const fd = new FormData();
    fd.set("id", yc.id); fd.set("den", den); if (ly) fd.set("ly_do", ly);
    chay(doiTrangThaiYeuCau, fd, dong);
  };
  const taoTin = (yc: YeuCauTd) => {
    const fd = new FormData(); fd.set("id", yc.id);
    bat(async () => {
      const kq = await taoTinTuYeuCau(fd);
      if (kq.loi) setLoi(kq.loi);
      else if (kq.tinId) router.push(`/tuyen-dung?tab=tin&tin=${kq.tinId}`);
    });
  };
  const gui = () => {
    if (!formRef.current?.reportValidity()) return;
    chay(guiYeuCau, new FormData(formRef.current), dong);
  };

  return (
    <>
      {choGui && <div className="mb-5 flex justify-end"><button type="button" className={NUT_CHINH} onClick={() => setHop({ k: "gui" })}>+ Gửi yêu cầu tuyển dụng</button></div>}
      {loi && !hop && <div role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {yeuCau.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-muc-3">{trong}</p>
      ) : (
        <ul className="space-y-3">
          {yeuCau.map((y) => {
            const tiep = quanTri ? buocTiepTheoYeuCau(y.trang_thai) : [];
            return (
              <li key={y.id} className="rounded-[10px] border border-vien bg-giay-sang p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-medium tabular-nums text-muc-3">{y.ma}</span>
                      <NhanTrangThai kieu={kieu(y.trang_thai)}>{y.trang_thai}</NhanTrangThai>
                      <span className="rounded-tag bg-giay-tram px-2 py-px text-[11px] font-medium text-muc-2">{y.loai_tuyen}</span>
                    </div>
                    <h3 className="mt-1.5 text-[16px] font-semibold text-muc">{y.vi_tri} <span className="font-normal text-muc-3">· cần {y.so_luong}</span></h3>
                    <p className="mt-0.5 text-[13px] text-muc-3">
                      {[y.khoi_ten, `Gửi bởi ${y.nguoi_yeu_cau_ten}`, ngayVN(y.tao_luc.slice(0, 10)), y.han_can_nhan_su && `Cần nhân sự trước ${ngayVN(y.han_can_nhan_su)}`, y.muc_luong && `Lương: ${y.muc_luong}`].filter(Boolean).join(" · ")}
                    </p>
                    {y.thay_the_cho && <p className="mt-1 text-[13px] text-muc-2">Thay cho: {y.thay_the_cho}</p>}
                    {(y.mo_ta_ngan || y.yeu_cau_chinh) && <p className="mt-2 whitespace-pre-line text-[13px] text-muc-2">{[y.mo_ta_ngan, y.yeu_cau_chinh && `Yêu cầu: ${y.yeu_cau_chinh}`].filter(Boolean).join("\n")}</p>}
                    {y.ly_do_tu_choi && <p className="mt-2 text-[13px] text-loi">Lý do: {y.ly_do_tu_choi}</p>}
                    {y.soTin > 0 && <p className="mt-2 text-[13px]"><Link className={NUT_CHU} href="/tuyen-dung?tab=tin">Đã có {y.soTin} tin tuyển dụng</Link></p>}
                  </div>
                  {tiep.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {tiep.includes("Đã tiếp nhận") && <button type="button" disabled={dang} className={NUT_CHINH} onClick={() => doi(y, "Đã tiếp nhận")}>Tiếp nhận</button>}
                      {(y.trang_thai === "Đã tiếp nhận" || y.trang_thai === "Đang đăng tin") && <button type="button" disabled={dang} className={NUT_PHU} onClick={() => taoTin(y)}>{y.soTin > 0 ? "Tạo thêm tin" : "Tạo tin tuyển dụng"}</button>}
                      {tiep.includes("Hoàn thành") && <button type="button" disabled={dang} className={NUT_PHU} onClick={() => doi(y, "Hoàn thành")}>Đánh dấu hoàn thành</button>}
                      {tiep.includes("Từ chối") && <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ k: "ly-do", yc: y, den: "Từ chối" })}>Từ chối</button>}
                      {tiep.includes("Huỷ") && <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ k: "ly-do", yc: y, den: "Huỷ" })}>Huỷ yêu cầu</button>}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Hop mo={hop?.k === "gui"} dong={dong} tieuDe="Gửi yêu cầu tuyển dụng" moTa="HCNS sẽ tiếp nhận, đăng tin và báo kết quả. Yêu cầu đã gửi không xoá được, chỉ huỷ kèm lý do.">
        {hop?.k === "gui" && (
          <form ref={formRef} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label htmlFor="y-vt" className={NHAN_O}>Vị trí cần tuyển *</label><input id="y-vt" name="vi_tri" required className={O_NHAP} placeholder="Ví dụ: Nhân viên bán hàng" /></div>
              <div><label htmlFor="y-khoi" className={NHAN_O}>Bộ phận cần người *</label><Chon id="y-khoi" ten="khoi_id" batBuoc trong="Chọn bộ phận" luaChon={khoi.map((k) => ({ gia_tri: k.id, nhan: k.ten }))} /></div>
              <div><label htmlFor="y-sl" className={NHAN_O}>Số lượng *</label><input id="y-sl" name="so_luong" type="number" min={1} max={99} defaultValue={1} required className={O_NHAP} /></div>
              <div><label htmlFor="y-loai" className={NHAN_O}>Loại tuyển dụng *</label><Chon id="y-loai" ten="loai_tuyen" giaTri={loai} onDoi={setLoai} luaChon={LOAI_TUYEN.map((t) => ({ gia_tri: t, nhan: t }))} /></div>
              {loai === "Thay thế" && <div><label htmlFor="y-tt" className={NHAN_O}>Thay cho ai *</label><input id="y-tt" name="thay_the_cho" className={O_NHAP} /></div>}
              <div><label htmlFor="y-han" className={NHAN_O}>Cần nhân sự trước ngày</label><NgayChon id="y-han" ten="han_can_nhan_su" tuNam={2024} denNam={2100} /></div>
              <div><label htmlFor="y-luong" className={NHAN_O}>Mức lương dự kiến</label><input id="y-luong" name="muc_luong" className={O_NHAP} placeholder="Ví dụ: 10–15 triệu" /></div>
              <div className="sm:col-span-2"><label htmlFor="y-mt" className={NHAN_O}>Mô tả ngắn công việc</label><textarea id="y-mt" name="mo_ta_ngan" className={O_NHIEU_DONG} /></div>
              <div className="sm:col-span-2"><label htmlFor="y-yc" className={NHAN_O}>Yêu cầu chính với ứng viên</label><textarea id="y-yc" name="yeu_cau_chinh" className={O_NHIEU_DONG} /></div>
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={dong} disabled={dang}>Đóng</button>
              <button type="button" className={NUT_CHINH} onClick={gui} disabled={dang}>{dang ? "Đang gửi" : "Gửi yêu cầu"}</button>
            </div>
          </form>
        )}
      </Hop>

      <Hop mo={hop?.k === "ly-do"} dong={dong} tieuDe={hop?.k === "ly-do" ? `${hop.den} yêu cầu ${hop.yc.ma}` : ""} moTa={hop?.k === "ly-do" ? hop.yc.vi_tri : undefined}>
        {hop?.k === "ly-do" && (
          <div className="space-y-4">
            <div><label htmlFor="y-ly-do" className={NHAN_O}>Lý do (người gửi sẽ thấy) *</label><textarea id="y-ly-do" value={lyDo} onChange={(e) => setLyDo(e.target.value)} className={O_NHIEU_DONG} /></div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={dong} disabled={dang}>Đóng</button>
              <button type="button" disabled={dang} className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white disabled:opacity-60" onClick={() => doi(hop.yc, hop.den, lyDo)}>{hop.den}</button>
            </div>
          </div>
        )}
      </Hop>
    </>
  );
}
