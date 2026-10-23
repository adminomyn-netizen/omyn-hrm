"use client";

import { Chon } from "@/components/ui/Chon";

import { useState, useTransition } from "react";
import { duyetTaiKhoan, tuChoiTaiKhoan } from "@/app/(app)/dashboard/actions";
import type { VaiTro } from "@/lib/auth";
import { nenLaQuanTri } from "@/lib/chuc-danh";

type HoSo = { id: string; ho_ten: string; chuc_danh: string | null; email: string | null; khoi_ten: string | null };
type TaiKhoan = { id: string; email: string; hoTen: string; taoLuc: string; yeuCau: { khoiId: string; khoiTen: string } | null };
const TAO_MOI = "__moi__";

/** Một dòng tài khoản chờ duyệt. Nút type="button" gọi action qua onClick — KHÔNG
 * dùng <form> submit (xem ghi chú ở src/lib/actions.ts). */
function Dong({ tk, hoSo }: { tk: TaiKhoan; hoSo: HoSo[] }) {
  // Quyền Quản trị đặt cứng theo vị trí (Hành chính nhân sự, lãnh đạo) — không chọn tay ở đây.
  const hoSoKhop = hoSo.find((h) => h.email?.toLowerCase() === tk.email.toLowerCase());
  const [kyThuat, setKyThuat] = useState(false);
  const [hoSoId, setHoSoId] = useState(() => hoSoKhop?.id ?? (tk.yeuCau ? TAO_MOI : ""));
  const hoSoDangChon = hoSo.find((h) => h.id === hoSoId);
  const seLaQuanTri = !kyThuat && (hoSoDangChon ? nenLaQuanTri(hoSoDangChon.chuc_danh, hoSoDangChon.khoi_ten) : hoSoId === TAO_MOI && nenLaQuanTri(null, tk.yeuCau?.khoiTen));
  const vaiTro = kyThuat ? "ky_thuat" : "nhan_vien";
  const chonHoSo = (id: string) => setHoSoId(id);
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
        {tk.yeuCau && (
          <div className="mt-1 inline-block rounded-tag bg-nhan-nhat px-2 py-0.5 text-[12px] font-medium text-nhan-dam">
            Phòng ban: {tk.yeuCau.khoiTen || "—"}
          </div>
        )}
        <div className="text-[12px] text-muc-3">
          Đăng ký {new Date(tk.taoLuc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        </div>
      </td>
      <td className="py-3 pr-4">
        <Chon nho ariaLabel="Vai trò" giaTri={vaiTro} onDoi={(v) => setKyThuat(v === "ky_thuat")} className="w-44" luaChon={[{ gia_tri: "nhan_vien", nhan: "Theo vị trí" }, { gia_tri: "ky_thuat", nhan: "Kỹ thuật" }]} />
        <div className="mt-1 text-[12px] text-muc-3">{kyThuat ? "Quyền cao nhất" : seLaQuanTri ? "Sẽ có quyền Quản trị theo vị trí" : "Nhân viên"}</div>
      </td>
      <td className="py-3 pr-4">
        <Chon nho ariaLabel="Hồ sơ nhân sự" giaTri={hoSoId} onDoi={chonHoSo} className="w-60" luaChon={[{ gia_tri: "", nhan: !kyThuat ? "Chọn hồ sơ nhân sự" : "Không gắn hồ sơ" }, ...(tk.yeuCau ? [{ gia_tri: TAO_MOI, nhan: "Tạo hồ sơ mới theo đăng ký" }] : []), ...hoSo.map((h) => ({ gia_tri: h.id, nhan: `${h.ho_ten}${h.chuc_danh ? " · " + h.chuc_danh : ""}` }))]} />
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
              <Dong key={tk.id} tk={tk} hoSo={hoSo} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
