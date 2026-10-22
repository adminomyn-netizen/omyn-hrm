export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { DanhSachTuyenDung } from "@/components/tuyen-dung/DanhSachTuyenDung";
import { layDanhSachKhoi, layTuyenDungDayDu } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

export default async function TrangTuyenDung() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [{ tin, ungVien }, khoi] = await Promise.all([layTuyenDungDayDu(), layDanhSachKhoi()]);

  return (
    <AppShell>
      <Topbar tieuDe="Tuyển dụng" />
      <main className="flex-1 px-4 py-6 lg:px-12 lg:py-8">
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
      </main>
    </AppShell>
  );
}
