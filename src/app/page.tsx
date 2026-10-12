import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Trang() {
  const nguoiDung = await layNguoiDungHienTai();
  redirect(nguoiDung?.vaiTro === "nhan_vien" ? "/cham-cong" : "/dashboard");
}
