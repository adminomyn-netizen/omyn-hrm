export const dynamic = "force-dynamic";

import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Bang, type Cot } from "@/components/ui/Table";
import {
  layChamCongHomNay,
  layChamCongHomNayCuaToi,
  layChamCongThang,
  layNhanVienIdTheoUser,
  thangHienTaiHCM,
} from "@/lib/data";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { DongHoHCM } from "@/components/cham-cong/DongHoHCM";
import { LichChamCongTre } from "@/components/cham-cong/LichChamCongTre";
import { NutChamCong } from "@/components/cham-cong/NutChamCong";

type DongChamCong = Awaited<ReturnType<typeof layChamCongHomNay>>["chiTiet"][number];
const kieu = (t: string) => (t === "Đúng giờ" ? "tot" : t === "Đi muộn" ? "cho" : "loi");

const cot: Cot<DongChamCong>[] = [
  { nhan: "Nhân viên", hienThi: (d) => <span className="font-medium text-muc">{d.nhan_vien_ho_ten}</span> },
  { nhan: "Khối", hienThi: (d) => d.khoi_ten },
  { nhan: "Giờ vào", phai: true, hienThi: (d) => d.gio_vao ?? "--:--" },
  { nhan: "Giờ ra", phai: true, hienThi: (d) => d.gio_ra ?? "--:--" },
  { nhan: "Trạng thái", hienThi: (d) => <NhanTrangThai kieu={kieu(d.trang_thai)}>{d.trang_thai}</NhanTrangThai> },
];

export default async function TrangChamCong({ searchParams }: { searchParams: Promise<{ nam?: string; thang?: string }> }) {
  const macDinh = thangHienTaiHCM();
  const { nam: namThamSo, thang: thangThamSo } = await searchParams;
  const nam = Number(namThamSo) || macDinh.nam;
  const thang = Number(thangThamSo) || macDinh.thang;

  const nguoiDung = await layNguoiDungDaDuyet();
  const nhanVienId = await layNhanVienIdTheoUser(nguoiDung.id);

  // Nhân viên chỉ thấy chấm công/lịch của CHÍNH MÌNH (chị Lâm chốt 12/10/2026).
  if (nguoiDung.vaiTro === "nhan_vien") {
    const [homNay, suKien] = await Promise.all([
      nhanVienId ? layChamCongHomNayCuaToi(nhanVienId) : null,
      nhanVienId ? layChamCongThang(nam, thang, nhanVienId) : Promise.resolve([]),
    ]);
    return (
      <div className="space-y-10">
        <section className="grid gap-x-16 gap-y-10 lg:grid-cols-2">
          <DongHoHCM />
          <NutChamCong gioVao={homNay?.gio_vao ?? null} gioRa={homNay?.gio_ra ?? null} trangThai={homNay?.trang_thai ?? null} />
        </section>
        {!nhanVienId && (
          <div role="status" className="rounded-nho bg-canh-bao-nen px-4 py-3 text-[14px] text-canh-bao">
            Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào. Báo bộ phận Nhân sự để được gắn hồ sơ trước khi chấm công.
          </div>
        )}
        <MucTrang tieuDe={`Lịch chấm công của tôi · Tháng ${thang}/${nam}`}>
          <LichChamCongTre suKien={suKien} nam={nam} thang={thang} />
        </MucTrang>
      </div>
    );
  }

  const [chamCong, suKien] = await Promise.all([layChamCongHomNay(), layChamCongThang(nam, thang)]);

  return (
    <div className="space-y-10">
      <DongHoHCM />
      <HangChiSo
        muc={[
          { nhan: "Đã chấm công hôm nay", so: `${chamCong.daChamCong}/${chamCong.tongNhanVien}` },
          { nhan: "Đi muộn", so: String(chamCong.diMuon) },
          { nhan: "Vắng mặt", so: String(chamCong.vangMat) },
        ]}
      />
      <MucTrang tieuDe={`Lịch chấm công · Tháng ${thang}/${nam}`}>
        <LichChamCongTre suKien={suKien} nam={nam} thang={thang} />
      </MucTrang>
      <MucTrang tieuDe="Chấm công hôm nay">
        <Bang cot={cot} duLieu={chamCong.chiTiet} khoa={(d) => d.nhan_vien_ho_ten} trong="Hôm nay chưa ai chấm công." />
      </MucTrang>
    </div>
  );
}
