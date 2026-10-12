"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { taoDonTu } from "../actions";

const o = "w-full rounded-lg border border-omyn-border px-3 py-2 text-sm outline-none focus:border-omyn-primary";
const nhan = "mb-1 block text-sm font-medium text-slate-700";

const LOAI_DON = ["Nghỉ phép năm", "Nghỉ ốm", "Tạm ứng lương", "Công tác"];

export function FormDonTu() {
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // <form> ở đây KHÔNG BAO GIỜ submit thật — xem ghi chú trong
  // FormNhanVien.tsx: hễ nổ sự kiện submit thật là Server Action bị huỷ
  // âm thầm và trang bật về /dang-nhap như mất đăng nhập (đã xác minh thật
  // qua trình duyệt). Nút bấm dùng type="button", gọi action thẳng.
  const gui = () => {
    if (!formRef.current) return;
    if (!formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const ket = await taoDonTu(fd);
      if (ket?.loi) {
        setLoi(ket.loi);
      } else {
        setLoi(undefined);
        router.push("/don-tu");
      }
    });
  };

  return (
    <form ref={formRef} className="space-y-4">
      <div>
        <label className={nhan}>
          Loại đơn <span className="text-rose-500">*</span>
        </label>
        <select name="loai" required defaultValue="" className={o}>
          <option value="" disabled>
            -- Chọn loại đơn --
          </option>
          {LOAI_DON.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={nhan}>
            Từ ngày <span className="text-rose-500">*</span>
          </label>
          <input name="tu_ngay" type="date" required className={o} />
        </div>
        <div>
          <label className={nhan}>
            Đến ngày <span className="text-rose-500">*</span>
          </label>
          <input name="den_ngay" type="date" required className={o} />
        </div>
      </div>

      <div>
        <label className={nhan}>Lý do</label>
        <textarea name="ly_do" rows={3} className={o} placeholder="Mô tả ngắn lý do xin nghỉ / tạm ứng / công tác..." />
      </div>

      {loi && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30">{loi}</div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={dangXuLy}
          onClick={gui}
          className="rounded-lg bg-omyn-primary px-5 py-2 text-sm font-medium text-white hover:bg-omyn-primary-dark disabled:opacity-60"
        >
          {dangXuLy ? "Đang gửi..." : "Nộp đơn"}
        </button>
      </div>
    </form>
  );
}
