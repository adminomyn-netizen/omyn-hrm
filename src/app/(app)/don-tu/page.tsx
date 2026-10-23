export const dynamic = "force-dynamic";

import { DanhSachDonTu, type ThongTinNop } from "@/components/don-tu/DanhSachDonTu";
import { layDonTu, layDonTuCuaToi, layHoSoChamCong, layPhepNamDaDung, thangHienTaiHCM } from "@/lib/data";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { PHEP_NAM_MOI_NAM, loaiDonChoPhep } from "@/lib/don-tu";

export default async function TrangDonTu() {
  const nguoiDung = await layNguoiDungDaDuyet();
  const { nhanVienId, canChamCong } = await layHoSoChamCong(nguoiDung.id, nguoiDung.vaiTro);
  const { nam } = thangHienTaiHCM();
  // Ai có hồ sơ nhân sự cũng nộp được đơn cho chính mình — kể cả Quản trị/Hành chính nhân sự.
  const nopDon: ThongTinNop | undefined = nhanVienId
    ? { loaiChoPhep: [...loaiDonChoPhep(canChamCong)], phepNam: { daDung: await layPhepNamDaDung(nhanVienId, nam), moiNam: PHEP_NAM_MOI_NAM, nam } }
    : undefined;

  if (nguoiDung.vaiTro === "nhan_vien") {
    const don = nhanVienId ? await layDonTuCuaToi(nhanVienId) : [];
    return <DanhSachDonTu che="ca-nhan" don={don} nopDon={nopDon} />;
  }

  const don = await layDonTu();
  return <DanhSachDonTu che="quan-ly" don={don.map((d) => ({ id: d.id, loai: d.loai, tu_ngay: d.tu_ngay, den_ngay: d.den_ngay, ly_do: d.ly_do, trang_thai: d.trang_thai, nhan_vien_ho_ten: d.nhan_vien_ho_ten }))} nopDon={nopDon} />;
}
