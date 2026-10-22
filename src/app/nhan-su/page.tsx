export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { DanhSachNhanSu } from "@/components/nhan-su/DanhSachNhanSu";
import { layDanhSachKhoi, layDanhSachNhanVien } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

export default async function TrangNhanSu() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [nhanVien, khoi] = await Promise.all([layDanhSachNhanVien(), layDanhSachKhoi()]);

  return (
    <AppShell>
      <Topbar tieuDe="Hồ sơ nhân sự" />
      <main className="flex-1 px-4 py-6 lg:px-12 lg:py-8">
        <DanhSachNhanSu nhanVien={nhanVien} khoi={khoi.map((k) => ({ id: k.id, ten: k.ten }))} />
      </main>
    </AppShell>
  );
}
