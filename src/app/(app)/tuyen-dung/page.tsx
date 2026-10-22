export const dynamic = "force-dynamic";

import { DanhSachTuyenDung } from "@/components/tuyen-dung/DanhSachTuyenDung";
import { layDanhSachKhoi, layTuyenDungDayDu } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

export default async function TrangTuyenDung() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [{ tin, ungVien }, khoi] = await Promise.all([layTuyenDungDayDu(), layDanhSachKhoi()]);

  return (
    <>
        <DanhSachTuyenDung
          tin={tin.map((t) => ({
            id: t.id,
            vi_tri: t.vi_tri,
            khoi_id: t.khoi_id,
            khoi_ten: t.khoi_ten,
            so_luong_can: t.so_luong_can,
            trang_thai: t.trang_thai,
            han_nop: t.han_nop,
            mo_ta: t.mo_ta,
          }))}
          ungVien={ungVien}
          khoi={khoi.map((k) => ({ id: k.id, ten: k.ten }))}
        />
    </>
  );
}
