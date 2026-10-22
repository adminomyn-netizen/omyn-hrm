"use client";

import { useRef, useState, useTransition } from "react";
import { taoDonTu } from "@/app/(app)/don-tu/actions";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";

const LOAI_DON = ["Nghỉ phép năm", "Nghỉ ốm", "Tạm ứng lương", "Công tác"];

/** Biểu mẫu nộp đơn trong hộp thoại. Nút type="button" gọi action qua onClick (lý do ở src/lib/actions.ts). */
export function FormDonTu({ xong, huy }: { xong: () => void; huy: () => void }) {
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const gui = () => {
    if (!formRef.current || !formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const kq = await taoDonTu(fd);
      if (kq?.loi) setLoi(kq.loi);
      else xong();
    });
  };

  return (
    <form ref={formRef} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
      <div>
        <label htmlFor="d-loai" className={NHAN_O}>Loại đơn *</label>
        <Chon id="d-loai" ten="loai" batBuoc trong="Chọn loại đơn" luaChon={LOAI_DON.map((l) => ({ gia_tri: l, nhan: l }))} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="d-tu" className={NHAN_O}>Từ ngày *</label>
          <NgayChon id="d-tu" ten="tu_ngay" batBuoc />
        </div>
        <div>
          <label htmlFor="d-den" className={NHAN_O}>Đến ngày *</label>
          <NgayChon id="d-den" ten="den_ngay" batBuoc />
        </div>
      </div>
      <div>
        <label htmlFor="d-ly-do" className={NHAN_O}>Lý do</label>
        <textarea id="d-ly-do" name="ly_do" placeholder="Mô tả ngắn lý do nghỉ, tạm ứng hoặc công tác" className={O_NHIEU_DONG} />
      </div>
      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="flex justify-end gap-2 border-t border-vien pt-4">
        <button type="button" onClick={huy} disabled={dangXuLy} className={NUT_PHU}>Huỷ</button>
        <button type="button" onClick={gui} disabled={dangXuLy} className={NUT_CHINH}>{dangXuLy ? "Đang gửi" : "Nộp đơn"}</button>
      </div>
    </form>
  );
}
