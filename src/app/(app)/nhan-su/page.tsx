export const dynamic = "force-dynamic";

import { DanhSachNhanSu } from "@/components/nhan-su/DanhSachNhanSu";
import { layDanhSachKhoi, layDanhSachNhanVien } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

export default async function TrangNhanSu({ searchParams }: { searchParams: Promise<{ q?: string; them?: string }> }) {
  const { q, them } = await searchParams;
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [nhanVien, khoi] = await Promise.all([layDanhSachNhanVien(), layDanhSachKhoi()]);

  return (
    <>
        <DanhSachNhanSu nhanVien={nhanVien} khoi={khoi.map((k) => ({ id: k.id, ten: k.ten }))} moBanDau={them === "1"} timBanDau={q ?? ""} />
    </>
  );
}
