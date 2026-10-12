export const dynamic = "force-dynamic";


import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card, ThongKe } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bang, type Cot } from "@/components/ui/Table";
import { layChamCongHomNay, layChamCongThang, thangHienTaiHCM } from "@/lib/data";
import { DongHoHCM } from "@/components/cham-cong/DongHoHCM";
import { LichChamCong } from "@/components/cham-cong/LichChamCong";

type DongChamCong = Awaited<ReturnType<typeof layChamCongHomNay>>["chiTiet"][number];

const cot: Cot<DongChamCong>[] = [
  { nhan: "Nhân viên", hienThi: (d) => <span className="font-medium">{d.nhan_vien_ho_ten}</span> },
  { nhan: "Khối", hienThi: (d) => d.khoi_ten },
  { nhan: "Giờ vào", hienThi: (d) => d.gio_vao ?? "--:--" },
  { nhan: "Giờ ra", hienThi: (d) => d.gio_ra ?? "--:--" },
  {
    nhan: "Trạng thái",
    hienThi: (d) => (
      <Badge mau={d.trang_thai === "Đúng giờ" ? "xanh" : d.trang_thai === "Đi muộn" ? "vang" : "do"}>
        {d.trang_thai}
      </Badge>
    ),
  },
];

export default async function TrangChamCong({
  searchParams,
}: {
  searchParams: Promise<{ nam?: string; thang?: string }>;
}) {
  const macDinh = thangHienTaiHCM();
  const { nam: namThamSo, thang: thangThamSo } = await searchParams;
  const nam = Number(namThamSo) || macDinh.nam;
  const thang = Number(thangThamSo) || macDinh.thang;

  const [chamCong, suKienThang] = await Promise.all([
    layChamCongHomNay(),
    layChamCongThang(nam, thang),
  ]);

  return (
    <AppShell>
      <Topbar tieuDe="Chấm công" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <DongHoHCM />
          <ThongKe nhan="Đã chấm công hôm nay" giaTri={`${chamCong.daChamCong}/${chamCong.tongNhanVien}`} />
          <ThongKe nhan="Đi muộn" giaTri={String(chamCong.diMuon)} />
          <ThongKe nhan="Vắng mặt" giaTri={String(chamCong.vangMat)} />
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="font-semibold text-slate-900">Lưới lịch chấm công theo tháng</div>
            <div className="text-sm text-slate-500">Tháng {thang}/{nam}</div>
          </div>
          <LichChamCong suKien={suKienThang} nam={nam} thang={thang} />
        </Card>

        <Card>
          <div className="mb-4 font-semibold text-slate-900">Chấm công hôm nay</div>
          <Bang cot={cot} duLieu={chamCong.chiTiet} khoa={(d) => d.nhan_vien_ho_ten} />
        </Card>
      </main>
    </AppShell>
  );
}
