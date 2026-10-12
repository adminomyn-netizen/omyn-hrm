"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { themNhanVien, suaNhanVien } from "@/lib/actions";

type Khoi = { id: string; ten: string };

type NhanVienCoSan = {
  id: string;
  ma_nhan_vien: string | null;
  ho_ten: string;
  chuc_danh: string | null;
  khoi_id: string | null;
  email: string | null;
  ngay_vao_lam: string | null;
  trang_thai: string;
};

const o = "w-full rounded-lg border border-omyn-border px-3 py-2 text-sm outline-none focus:border-omyn-primary";
const nhan = "mb-1 block text-sm font-medium text-slate-700";

/** Dùng chung cho cả form thêm và sửa nhân viên — truyền `coSan` để vào chế độ sửa. */
export function FormNhanVien({ khoi, coSan }: { khoi: Khoi[]; coSan?: NhanVienCoSan }) {
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // QUAN TRỌNG: thẻ <form> ở đây KHÔNG BAO GIỜ được submit thật (nút bấm là
  // type="button", không phải type="submit") — chỉ dùng <form> làm nơi gom
  // field để new FormData(formRef.current) đọc tiện. Đã xác minh thật qua
  // trình duyệt: hễ form này NỔ RA một sự kiện submit thật (dù có
  // preventDefault() hay gắn action={serverAction}), request Server Action
  // ngay sau đó bị Next.js/React âm thầm huỷ — không chạy tới thân hàm, và
  // trang bật về /dang-nhap như mất đăng nhập. Gọi action thẳng từ onClick
  // của nút (không qua sự kiện submit) thì chạy đúng, y như nút Duyệt/Xóa.
  const gui = () => {
    if (!formRef.current) return;
    // Không có sự kiện submit thật thì trình duyệt không tự kiểm required —
    // gọi tay để vẫn báo lỗi field trống như form bình thường.
    if (!formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const ket = coSan ? await suaNhanVien(fd) : await themNhanVien(fd);
      if (ket?.loi) {
        setLoi(ket.loi);
      } else {
        setLoi(undefined);
        router.push("/nhan-su");
      }
    });
  };

  return (
    <form ref={formRef} className="space-y-4">
      {coSan && <input type="hidden" name="id" value={coSan.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={nhan}>Mã nhân viên</label>
          <input name="ma_nhan_vien" placeholder="NV009" defaultValue={coSan?.ma_nhan_vien ?? ""} className={o} />
        </div>
        <div>
          <label className={nhan}>
            Họ tên <span className="text-rose-500">*</span>
          </label>
          <input name="ho_ten" required defaultValue={coSan?.ho_ten ?? ""} className={o} />
        </div>
        <div>
          <label className={nhan}>Chức danh</label>
          <input name="chuc_danh" defaultValue={coSan?.chuc_danh ?? ""} className={o} />
        </div>
        <div>
          <label className={nhan}>
            Khối <span className="text-rose-500">*</span>
          </label>
          <select name="khoi_id" required defaultValue={coSan?.khoi_id ?? ""} className={o}>
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
          <input name="email" type="email" defaultValue={coSan?.email ?? ""} className={o} />
        </div>
        <div>
          <label className={nhan}>
            Ngày vào làm <span className="text-rose-500">*</span>
          </label>
          <input name="ngay_vao_lam" type="date" required defaultValue={coSan?.ngay_vao_lam ?? ""} className={o} />
        </div>
        <div>
          <label className={nhan}>Trạng thái</label>
          <select name="trang_thai" defaultValue={coSan?.trang_thai ?? "Đang làm"} className={o}>
            <option value="Đang làm">Đang làm</option>
            <option value="Thử việc">Thử việc</option>
            <option value="Đã nghỉ">Đã nghỉ</option>
          </select>
        </div>
      </div>

      {loi && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{loi}</div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={dangXuLy}
          onClick={gui}
          className="rounded-lg bg-omyn-primary px-5 py-2 text-sm font-medium text-white hover:bg-omyn-primary-dark disabled:opacity-60"
        >
          {dangXuLy ? "Đang lưu..." : coSan ? "Lưu thay đổi" : "Lưu nhân viên"}
        </button>
      </div>
    </form>
  );
}
