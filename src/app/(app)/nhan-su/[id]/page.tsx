export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { HoSoNhanVien } from "@/components/nhan-su/HoSoNhanVien";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauVaiTro } from "@/lib/auth";
import { layHoSoDayDu } from "@/lib/data-ho-so";

/** Hồ sơ đầy đủ của một nhân viên (Quản trị/Kỹ thuật): sơ yếu lý lịch, người thân, giấy tờ scan. */
export default async function TrangHoSo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const du = await layHoSoDayDu(id);
  if (!du) notFound();
  return (
    <>
      <TieuDeTrang tieuDe={du.nhanVien.ho_ten} phu={<Link href="/nhan-su" className="text-nhan-dam hover:underline">← Về danh sách hồ sơ nhân sự</Link>} />
      <HoSoNhanVien du={du} quanTri />
    </>
  );
}
