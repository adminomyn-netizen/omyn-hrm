"use client";

import { useActionState } from "react";
import { themNhanVien } from "@/lib/actions";

type Khoi = { id: string; ten: string };

const o = "w-full rounded-lg border border-omyn-border px-3 py-2 text-sm outline-none focus:border-omyn-primary";
const nhan = "mb-1 block text-sm font-medium text-slate-700";

export function FormThemNhanVien({ khoi }: { khoi: Khoi[] }) {
  const [state, action, dangXuLy] = useActionState(themNhanVien, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={nhan}>Mã nhân viên</label>
          <input name="ma_nhan_vien" placeholder="NV009" className={o} />
        </div>
        <div>
          <label className={nhan}>
            Họ tên <span className="text-rose-500">*</span>
          </label>
          <input name="ho_ten" required className={o} />
        </div>
        <div>
          <label className={nhan}>Chức danh</label>
          <input name="chuc_danh" className={o} />
        </div>
        <div>
          <label className={nhan}>
            Khối <span className="text-rose-500">*</span>
          </label>
          <select name="khoi_id" required defaultValue="" className={o}>
            <option value="" disabled>
              -- Chọn khối --
            </option>
            {khoi.map((k) => (
              <option key={k.id} value={k.id}>
                {k.ten}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={nhan}>Email</label>
          <input name="email" type="email" className={o} />
        </div>
        <div>
          <label className={nhan}>
            Ngày vào làm <span className="text-rose-500">*</span>
          </label>
          <input name="ngay_vao_lam" type="date" required className={o} />
        </div>
        <div>
          <label className={nhan}>Trạng thái</label>
          <select name="trang_thai" defaultValue="Đang làm" className={o}>
            <option value="Đang làm">Đang làm</option>
            <option value="Thử việc">Thử việc</option>
            <option value="Đã nghỉ">Đã nghỉ</option>
          </select>
        </div>
      </div>

      {state?.loi && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.loi}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={dangXuLy}
          className="rounded-lg bg-omyn-primary px-5 py-2 text-sm font-medium text-white hover:bg-omyn-primary-dark disabled:opacity-60"
        >
          {dangXuLy ? "Đang lưu..." : "Lưu nhân viên"}
        </button>
      </div>
    </form>
  );
}
