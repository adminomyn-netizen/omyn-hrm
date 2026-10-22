import { layNguoiDungHienTai } from "@/lib/auth";
import { layThongBao } from "@/lib/data";
import { DauTrang } from "@/components/layout/DauTrang";

/** Đầu trang (máy chủ): lấy người dùng + thông báo thật rồi giao cho DauTrang (client). */
export async function Topbar({ tieuDe }: { tieuDe: string }) {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung || nguoiDung.vaiTro === "cho_duyet") return null;
  const thongBao = await layThongBao({ id: nguoiDung.id, vaiTro: nguoiDung.vaiTro }).catch(() => []);
  return <DauTrang tieuDe={tieuDe} hoTen={nguoiDung.hoTen} email={nguoiDung.email} thongBao={thongBao} />;
}
