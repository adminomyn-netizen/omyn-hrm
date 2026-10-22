import { redirect } from "next/navigation";
import { layNguoiDungDaDuyet } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Trang() {
  const nguoiDung = await layNguoiDungDaDuyet();
  redirect(nguoiDung.vaiTro === "nhan_vien" ? "/cham-cong" : "/dashboard");
}
