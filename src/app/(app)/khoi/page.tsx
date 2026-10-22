export const dynamic = "force-dynamic";

import { DanhSachKhoi } from "@/components/khoi/DanhSachKhoi";
import { layKhoiDayDu } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

export default async function TrangKhoi() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const khoi = await layKhoiDayDu();
  return <DanhSachKhoi khoi={khoi} />;
}
