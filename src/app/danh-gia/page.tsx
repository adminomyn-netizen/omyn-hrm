export const dynamic = "force-dynamic";


import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bang, type Cot } from "@/components/ui/Table";
import { layDanhGiaKPI } from "@/lib/data";

type DanhGiaKPI = Awaited<ReturnType<typeof layDanhGiaKPI>>[number];

const cot: Cot<DanhGiaKPI>[] = [
  { nhan: "Nhân viên", hienThi: (k) => <span className="font-medium">{k.nhan_vien_ho_ten}</span> },
  { nhan: "Khối", hienThi: (k) => k.khoi_ten },
  { nhan: "Kỳ đánh giá", hienThi: (k) => k.ky },
  { nhan: "Điểm (/100)", hienThi: (k) => k.diem },
  {
    nhan: "Xếp loại",
    hienThi: (k) => (
      <Badge mau={k.xep_loai === "Xuất sắc" ? "xanh" : k.xep_loai === "Cần cải thiện" ? "do" : "vang"}>
        {k.xep_loai}
      </Badge>
    ),
  },
];

export default async function TrangDanhGia() {
  const danhSachKPI = await layDanhGiaKPI();

  return (
    <AppShell>
      <Topbar tieuDe="Đánh giá hiệu suất" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Card>
          <div className="mb-4 font-semibold text-slate-900">Kết quả đánh giá theo kỳ</div>
          <Bang cot={cot} duLieu={danhSachKPI} khoa={(k) => k.id} />
        </Card>
      </main>
    </AppShell>
  );
}
