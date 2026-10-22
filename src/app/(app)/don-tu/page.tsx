export const dynamic = "force-dynamic";

import { DanhSachDonTu } from "@/components/don-tu/DanhSachDonTu";
import { layDonTu, layDonTuCuaToi, layNhanVienIdTheoUser } from "@/lib/data";
import { layNguoiDungDaDuyet } from "@/lib/auth";

export default async function TrangDonTu() {
  const nguoiDung = await layNguoiDungDaDuyet();

  if (nguoiDung.vaiTro === "nhan_vien") {
    const nhanVienId = await layNhanVienIdTheoUser(nguoiDung.id);
    const don = nhanVienId ? await layDonTuCuaToi(nhanVienId) : [];
    return <DanhSachDonTu che="ca-nhan" don={don} />;
  }

  const don = await layDonTu();
  return <DanhSachDonTu che="quan-ly" don={don.map((d) => ({ id: d.id, loai: d.loai, tu_ngay: d.tu_ngay, den_ngay: d.den_ngay, ly_do: d.ly_do, trang_thai: d.trang_thai, nhan_vien_ho_ten: d.nhan_vien_ho_ten }))} />;
}
