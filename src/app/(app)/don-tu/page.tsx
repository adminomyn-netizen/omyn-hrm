export const dynamic = "force-dynamic";

import { DanhSachDonTu, type ThongTinNop } from "@/components/don-tu/DanhSachDonTu";
import { layDanhSachNhanVien, layDonTu, layDonTuCuaToi, layHoSoChamCong, layPhepNamDaDung, thangHienTaiHCM } from "@/lib/data";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { loaiDonChoPhep } from "@/lib/don-tu";
import { phepNamDuoc } from "@/lib/quy-phep";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TrangDonTu() {
  const nguoiDung = await layNguoiDungDaDuyet();
  const { nhanVienId, canChamCong, hoTen, chucDanh } = await layHoSoChamCong(nguoiDung.id, nguoiDung.vaiTro);
  const { nam } = thangHienTaiHCM();
  const ngayVao = nhanVienId ? ((await createAdminClient().from("nhan_vien").select("ngay_vao_lam").eq("id", nhanVienId).maybeSingle()).data as { ngay_vao_lam: string | null } | null)?.ngay_vao_lam : null;
  // Ai có hồ sơ nhân sự cũng nộp được đơn cho chính mình — kể cả Quản trị/Hành chính nhân sự.
  // Kỹ thuật thì luôn nộp được MỌI loại đơn và có thể nộp thay cho bất kỳ nhân viên nào đang làm.
  const laKyThuat = nguoiDung.vaiTro === "ky_thuat";
  const nhanVienChon = laKyThuat ? (await layDanhSachNhanVien()).filter((n) => n.trang_thai !== "Đã nghỉ").map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten}${n.chuc_danh ? " · " + n.chuc_danh : ""}` })) : undefined;
  const nopDon: ThongTinNop | undefined =
    nhanVienId || laKyThuat
      ? {
          loaiChoPhep: [...(laKyThuat ? loaiDonChoPhep(true) : loaiDonChoPhep(canChamCong))],
          phepNam: { daDung: nhanVienId ? await layPhepNamDaDung(nhanVienId, nam) : 0, moiNam: phepNamDuoc(ngayVao, nam), nam },
          nhanVienChon,
          macDinhNopCho: nhanVienId ?? "",
          // Không phải Kỹ thuật thì đơn luôn mang tên chính người đăng nhập, hiện cố định để không nộp nhầm người.
          tenNguoiNop: laKyThuat ? undefined : `${hoTen ?? ""}${chucDanh ? " · " + chucDanh : ""}`,
        }
      : undefined;

  if (nguoiDung.vaiTro === "nhan_vien") {
    const don = nhanVienId ? await layDonTuCuaToi(nhanVienId) : [];
    return <DanhSachDonTu che="ca-nhan" don={don} nopDon={nopDon} />;
  }

  const don = await layDonTu();
  return <DanhSachDonTu che="quan-ly" don={don.map((d) => ({ id: d.id, loai: d.loai, tu_ngay: d.tu_ngay, den_ngay: d.den_ngay, gio_tu: d.gio_tu, gio_den: d.gio_den, gio_vao_dung: d.gio_vao_dung, gio_ra_dung: d.gio_ra_dung, ly_do: d.ly_do, trang_thai: d.trang_thai, nhan_vien_ho_ten: d.nhan_vien_ho_ten }))} nopDon={nopDon} />;
}
