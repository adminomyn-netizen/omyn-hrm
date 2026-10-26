export const dynamic = "force-dynamic";

import { DanhSachNhanSu } from "@/components/nhan-su/DanhSachNhanSu";
import { layKhoiDayDu, layDanhSachNhanVien } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";
import { layTomTatHoSo } from "@/lib/data-ho-so";

export default async function TrangNhanSu({ searchParams }: { searchParams: Promise<{ q?: string; them?: string }> }) {
  const { q, them } = await searchParams;
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [nhanVien, khoi, tomTat] = await Promise.all([layDanhSachNhanVien(), layKhoiDayDu(), layTomTatHoSo()]);

  return (
    <>
        <DanhSachNhanSu nhanVien={nhanVien} khoi={khoi.map((k) => ({ id: k.id, ten: k.ten, viTri: k.viTri }))} moBanDau={them === "1"} timBanDau={q ?? ""} tomTat={Object.fromEntries([...tomTat].map(([id, t]) => [id, { tyLe: t.tyLe, thieu: t.thieu.length, choXacNhan: t.choXacNhan }]))} />
    </>
  );
}
