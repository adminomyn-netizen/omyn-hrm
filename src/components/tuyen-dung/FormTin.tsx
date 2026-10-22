"use client";

import { useRef, useState, useTransition } from "react";
import { luuTin } from "@/app/(app)/tuyen-dung/actions";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { TRANG_THAI_TIN } from "@/lib/tuyen-dung";

export type KhoiLuaChon = { id: string; ten: string };
export type TinCoSan = {
  id: string;
  vi_tri: string;
  khoi_id: string | null;
  so_luong_can: number;
  trang_thai: string;
  han_nop: string | null;
  mo_ta: string | null;
};

/** Biểu mẫu đăng/sửa tin tuyển dụng trong hộp thoại (nút type="button", xem ghi chú ở src/lib/actions.ts). */
export function FormTin({ khoi, coSan, xong, huy }: { khoi: KhoiLuaChon[]; coSan?: TinCoSan; xong: () => void; huy: () => void }) {
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const gui = () => {
    if (!formRef.current || !formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const kq = await luuTin(fd);
      if (kq.loi) setLoi(kq.loi);
      else xong();
    });
  };

  return (
    <form ref={formRef} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
      {coSan && <input type="hidden" name="id" value={coSan.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="t-vi-tri" className={NHAN_O}>Vị trí cần tuyển *</label>
          <input id="t-vi-tri" name="vi_tri" required defaultValue={coSan?.vi_tri ?? ""} placeholder="Ví dụ: Content Marketing" className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="t-khoi" className={NHAN_O}>Khối *</label>
          <Chon id="t-khoi" ten="khoi_id" batBuoc trong="Chọn khối" giaTriMacDinh={coSan?.khoi_id ?? ""} luaChon={khoi.map((k) => ({ gia_tri: k.id, nhan: k.ten }))} />
        </div>
        <div>
          <label htmlFor="t-sl" className={NHAN_O}>Số lượng cần *</label>
          <input id="t-sl" name="so_luong_can" type="number" min={1} max={99} required defaultValue={coSan?.so_luong_can ?? 1} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="t-tt" className={NHAN_O}>Trạng thái</label>
          <Chon id="t-tt" ten="trang_thai" giaTriMacDinh={coSan?.trang_thai ?? "Đang tuyển"} luaChon={TRANG_THAI_TIN.map((t) => ({ gia_tri: t, nhan: t }))} />
        </div>
        <div>
          <label htmlFor="t-han" className={NHAN_O}>Hạn nộp hồ sơ</label>
          <NgayChon id="t-han" ten="han_nop" giaTriMacDinh={coSan?.han_nop ?? ""} denNam={2100} tuNam={2024} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="t-mo-ta" className={NHAN_O}>Mô tả công việc, yêu cầu</label>
          <textarea id="t-mo-ta" name="mo_ta" defaultValue={coSan?.mo_ta ?? ""} className={O_NHIEU_DONG} />
        </div>
      </div>
      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="flex justify-end gap-2 border-t border-vien pt-4">
        <button type="button" onClick={huy} disabled={dangXuLy} className={NUT_PHU}>Huỷ</button>
        <button type="button" onClick={gui} disabled={dangXuLy} className={NUT_CHINH}>
          {dangXuLy ? "Đang lưu" : coSan ? "Lưu thay đổi" : "Đăng tuyển"}
        </button>
      </div>
    </form>
  );
}
