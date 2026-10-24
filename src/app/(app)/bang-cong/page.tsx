export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { layBangCongThang } from "@/lib/bang-cong";
import { thangHienTaiHCM } from "@/lib/data";
import { BangCongThang } from "@/components/bang-cong/BangCongThang";

export default async function TrangBangCong({ searchParams }: { searchParams: Promise<{ nam?: string; thang?: string }> }) {
  const nd = await layNguoiDungDaDuyet();
  if (nd.vaiTro !== "admin" && nd.vaiTro !== "ky_thuat") redirect("/cham-cong");
  const macDinh = thangHienTaiHCM();
  const { nam: n, thang: t } = await searchParams;
  const nam = Number(n) >= 2024 && Number(n) <= 2100 ? Number(n) : macDinh.nam;
  const thang = Number(t) >= 1 && Number(t) <= 12 ? Number(t) : macDinh.thang;
  const bang = await layBangCongThang(nam, thang);
  return <BangCongThang nam={nam} thang={thang} hienTai={macDinh} {...bang} />;
}
