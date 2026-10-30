export const dynamic = "force-dynamic";

import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { FormMoNghiViec } from "@/components/nghi-viec/FormMoNghiViec";
import { dbHr } from "@/lib/hr-db";

export default async function TrangMoNghiViec() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const { data } = await dbHr().from("nhan_vien").select("id, ho_ten, chuc_danh").neq("trang_thai", "Đã nghỉ").order("ho_ten");
  const nhanSu = ((data ?? []) as { id: string; ho_ten: string; chuc_danh: string | null }[]).map((n) => ({ id: n.id, ten: n.chuc_danh ? `${n.ho_ten} · ${n.chuc_danh}` : n.ho_ten }));
  return (
    <>
      <TieuDeTrang tieuDe="Mở hồ sơ nghỉ việc" phu="Tạo checklist bàn giao, chốt công-lương-BHXH và phỏng vấn thôi việc cho một nhân sự." />
      <FormMoNghiViec nhanSu={nhanSu} homNay={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })} />
    </>
  );
}
