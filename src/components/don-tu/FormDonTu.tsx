"use client";

import { useRef, useState, useTransition } from "react";
import { taoDonTu } from "@/app/(app)/don-tu/actions";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";

const GOI_Y_LY_DO: Record<string, string> = {
  "Nghỉ chế độ": "Ghi rõ loại chế độ: thai sản, ...",
  "Giải trình công": "Ngày nào, giờ vào/ra thực tế, vì sao chưa đúng với dữ liệu chấm công",
  "Chấm công ngoài công ty": "Làm việc ở đâu, với ai, giờ bắt đầu và kết thúc",
  "Làm remote": "Làm remote những việc gì",
  "Đi trễ": "Đến lúc mấy giờ và lý do",
  "Về sớm": "Về lúc mấy giờ và lý do",
};

/** Biểu mẫu nộp đơn trong hộp thoại. Nút type="button" gọi action qua onClick (lý do ở src/lib/actions.ts). */
export function FormDonTu({ xong, huy, loaiChoPhep, phepNam }: { xong: () => void; huy: () => void; loaiChoPhep: string[]; phepNam: { daDung: number; moiNam: number; nam: number } }) {
  const [loaiDangChon, setLoaiDangChon] = useState("");
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
        <Chon id="d-loai" ten="loai" batBuoc trong="Chọn loại đơn" giaTri={loaiDangChon} onDoi={setLoaiDangChon} luaChon={loaiChoPhep.map((l) => ({ gia_tri: l, nhan: l }))} />
        {loaiDangChon === "Nghỉ phép năm" && (
          <p className="mt-1.5 text-[13px] text-muc-3">
            Năm {phepNam.nam}: đã dùng hoặc đang chờ duyệt {phepNam.daDung}/{phepNam.moiNam} ngày, còn {Math.max(0, phepNam.moiNam - phepNam.daDung)} ngày. Chủ nhật không tính.
          </p>
        )}
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
        <textarea id="d-ly-do" name="ly_do" placeholder={GOI_Y_LY_DO[loaiDangChon] ?? "Mô tả ngắn lý do"} className={O_NHIEU_DONG} />
      </div>
      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="flex justify-end gap-2 border-t border-vien pt-4">
        <button type="button" onClick={huy} disabled={dangXuLy} className={NUT_PHU}>Huỷ</button>
        <button type="button" onClick={gui} disabled={dangXuLy} className={NUT_CHINH}>{dangXuLy ? "Đang gửi" : "Nộp đơn"}</button>
      </div>
    </form>
  );
}
