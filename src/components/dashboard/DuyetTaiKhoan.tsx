"use client";

import { useState, useTransition } from "react";
import { duyetTaiKhoan, tuChoiTaiKhoan } from "@/app/(app)/dashboard/actions";
import type { VaiTro } from "@/lib/auth";
import { laChucDanhNhayCam } from "@/lib/chuc-danh";

type HoSo = { id: string; ho_ten: string; chuc_danh: string | null; email: string | null };
type TaiKhoan = { id: string; email: string; hoTen: string; taoLuc: string };

const chon =
  "h-9 rounded-nho border border-vien-dam bg-giay-sang px-2 text-[13px] text-muc outline-none focus:border-nhan";

/** Một dòng tài khoản chờ duyệt. Nút type="button" gọi action qua onClick — KHÔNG
 * dùng <form> submit (xem ghi chú ở src/lib/actions.ts). */
function Dong({ tk, hoSo, nguoiGoi }: { tk: TaiKhoan; hoSo: HoSo[]; nguoiGoi: VaiTro }) {
  const [vaiTro, setVaiTro] = useState("nhan_vien");
  const [hoSoId, setHoSoId] = useState(() => hoSo.find((h) => h.email?.toLowerCase() === tk.email.toLowerCase())?.id ?? "");
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();

  const gui = (hanhDong: "duyet" | "tu_choi") => {
    const fd = new FormData();
    fd.set("user_id", tk.id);
    if (hanhDong === "duyet") {
      fd.set("vai_tro", vaiTro);
      fd.set("nhan_vien_id", hoSoId);
    }
    startXuLy(async () => {
      const kq = await (hanhDong === "duyet" ? duyetTaiKhoan(fd) : tuChoiTaiKhoan(fd));
      setLoi(kq.loi);
    });
  };

  return (
    <tr className="border-b border-vien align-top">
      <td className="py-3 pr-4">
        <div className="text-[14px] font-medium text-muc">{tk.hoTen}</div>
        <div className="text-[13px] text-muc-3">{tk.email}</div>
        <div className="text-[12px] text-muc-3">
          Đăng ký {new Date(tk.taoLuc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        </div>
      </td>
      <td className="py-3 pr-4">
        <select value={vaiTro} onChange={(e) => setVaiTro(e.target.value)} className={chon} aria-label="Vai trò">
          <option value="nhan_vien">Nhân viên</option>
          {nguoiGoi === "admin" && <option value="ky_thuat">Kỹ thuật</option>}
          {nguoiGoi === "admin" && <option value="admin">Quản trị</option>}
        </select>
      </td>
      <td className="py-3 pr-4">
        <select value={hoSoId} onChange={(e) => setHoSoId(e.target.value)} className={`${chon} max-w-[240px]`} aria-label="Hồ sơ nhân sự">
          <option value="">{vaiTro === "nhan_vien" ? "Chọn hồ sơ nhân sự" : "Không gắn hồ sơ"}</option>
          {hoSo
            .filter((h) => nguoiGoi === "admin" || !laChucDanhNhayCam(h.chuc_danh))
            .map((h) => (
            <option key={h.id} value={h.id}>
              {h.ho_ten}
              {h.chuc_danh ? ` · ${h.chuc_danh}` : ""}
            </option>
          ))}
        </select>
        {loi && <div className="mt-1 text-[12px] text-loi">{loi}</div>}
      </td>
      <td className="py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={dangXuLy}
            onClick={() => gui("duyet")}
            className="h-9 rounded-nho nut-vang px-3 text-[13px] disabled:opacity-50"
          >
            Duyệt
          </button>
          <button
            type="button"
            disabled={dangXuLy}
            onClick={() => gui("tu_choi")}
            className="h-9 rounded-nho border border-vien-dam px-3 text-[13px] font-medium text-muc-2 hover:bg-giay-tram disabled:opacity-50"
          >
            Từ chối
          </button>
        </div>
      </td>
    </tr>
  );
}

export function DuyetTaiKhoan({ taiKhoan, hoSo, nguoiGoi }: { taiKhoan: TaiKhoan[]; hoSo: HoSo[]; nguoiGoi: VaiTro }) {
  if (taiKhoan.length === 0) return null;
  return (
    <section aria-labelledby="tk-cho-duyet">
      <div className="flex items-baseline justify-between border-b border-vien pb-2">
        <h2 id="tk-cho-duyet" className="text-[16px] font-semibold text-muc">
          Tài khoản chờ duyệt <span className="font-normal text-muc-3">({taiKhoan.length})</span>
        </h2>
        <span className="text-[12px] text-muc-3">Email do người đăng ký tự nhập, CHƯA xác minh: đối chiếu với người thật trước khi duyệt.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="nhan-muc">
              <th className="py-2 pr-4 font-medium">Người đăng ký</th>
              <th className="py-2 pr-4 font-medium">Vai trò</th>
              <th className="py-2 pr-4 font-medium">Gắn hồ sơ nhân sự</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {taiKhoan.map((tk) => (
              <Dong key={tk.id} tk={tk} hoSo={hoSo} nguoiGoi={nguoiGoi} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
