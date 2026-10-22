"use client";

import { useRef, useState, useTransition } from "react";
import { themNhanVien, suaNhanVien } from "@/lib/actions";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

export type Khoi = { id: string; ten: string };

export type NhanVienCoSan = {
  id: string;
  ma_nhan_vien: string | null;
  ho_ten: string;
  chuc_danh: string | null;
  khoi_id: string | null;
  email: string | null;
  ngay_vao_lam: string | null;
  trang_thai: string;
};

/** Biểu mẫu thêm/sửa nhân viên, đặt trong hộp thoại. `coSan` = chế độ sửa.
 * <form> chỉ để gom ô nhập; KHÔNG submit thật — nút là type="button" gọi action qua onClick
 * (lý do ở src/lib/actions.ts: submit thật làm Server Action bị huỷ trên Next 16 này). */
export function FormNhanVien({
  khoi,
  coSan,
  xong,
  huy,
}: {
  khoi: Khoi[];
  coSan?: NhanVienCoSan;
  xong: () => void;
  huy: () => void;
}) {
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const gui = () => {
    if (!formRef.current || !formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const ket = coSan ? await suaNhanVien(fd) : await themNhanVien(fd);
      if (ket?.loi) setLoi(ket.loi);
      else xong();
    });
  };

  return (
    <form ref={formRef} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
      {coSan && <input type="hidden" name="id" value={coSan.id} />}
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nv-ho-ten" className={NHAN_O}>Họ và tên *</label>
          <input id="nv-ho-ten" name="ho_ten" required defaultValue={coSan?.ho_ten ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="nv-ma" className={NHAN_O}>Mã nhân viên</label>
          <input id="nv-ma" name="ma_nhan_vien" placeholder="NV009" defaultValue={coSan?.ma_nhan_vien ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="nv-chuc-danh" className={NHAN_O}>Chức danh</label>
          <input id="nv-chuc-danh" name="chuc_danh" defaultValue={coSan?.chuc_danh ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="nv-khoi" className={NHAN_O}>Khối *</label>
          <select id="nv-khoi" name="khoi_id" required defaultValue={coSan?.khoi_id ?? ""} className={O_NHAP}>
            <option value="" disabled>Chọn khối</option>
            {khoi.map((k) => (
              <option key={k.id} value={k.id}>{k.ten}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="nv-email" className={NHAN_O}>Email</label>
          <input id="nv-email" name="email" type="email" defaultValue={coSan?.email ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="nv-ngay" className={NHAN_O}>Ngày vào làm *</label>
          <input id="nv-ngay" name="ngay_vao_lam" type="date" required defaultValue={coSan?.ngay_vao_lam ?? ""} className={O_NHAP} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="nv-tt" className={NHAN_O}>Trạng thái</label>
          <select id="nv-tt" name="trang_thai" defaultValue={coSan?.trang_thai ?? "Đang làm"} className={O_NHAP}>
            <option value="Đang làm">Đang làm</option>
            <option value="Thử việc">Thử việc</option>
            <option value="Đã nghỉ">Đã nghỉ</option>
          </select>
        </div>
      </div>

      {loi && (
        <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>
      )}

      <div className="flex justify-end gap-2 border-t border-vien pt-4">
        <button type="button" onClick={huy} disabled={dangXuLy} className={NUT_PHU}>Huỷ</button>
        <button type="button" onClick={gui} disabled={dangXuLy} className={NUT_CHINH}>
          {dangXuLy ? "Đang lưu" : coSan ? "Lưu thay đổi" : "Thêm nhân viên"}
        </button>
      </div>
    </form>
  );
}
