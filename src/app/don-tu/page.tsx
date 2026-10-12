export const dynamic = "force-dynamic";


import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bang, type Cot } from "@/components/ui/Table";
import { layDonTu } from "@/lib/data";

type DonTu = Awaited<ReturnType<typeof layDonTu>>[number];

const cot: Cot<DonTu>[] = [
  { nhan: "Nhân viên", hienThi: (d) => <span className="font-medium">{d.nhan_vien_ho_ten}</span> },
  { nhan: "Loại đơn", hienThi: (d) => d.loai },
  { nhan: "Từ ngày", hienThi: (d) => d.tu_ngay },
  { nhan: "Đến ngày", hienThi: (d) => d.den_ngay },
  {
    nhan: "Trạng thái",
    hienThi: (d) => (
      <Badge mau={d.trang_thai === "Đã duyệt" ? "xanh" : d.trang_thai === "Từ chối" ? "do" : "vang"}>
        {d.trang_thai}
      </Badge>
    ),
  },
  {
    nhan: "",
    hienThi: (d) =>
      d.trang_thai === "Chờ duyệt" ? (
        <div className="flex gap-2">
          <button className="rounded-md bg-omyn-primary px-3 py-1 text-xs font-medium text-white">
            Duyệt
          </button>
          <button className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Từ chối
          </button>
        </div>
      ) : null,
  },
];

export default async function TrangDonTu() {
  const danhSachDonTu = await layDonTu();

  return (
    <AppShell>
      <Topbar tieuDe="Đơn từ & phê duyệt" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Card>
          <div className="mb-4 font-semibold text-slate-900">
            Tất cả đơn ({danhSachDonTu.length})
          </div>
          <Bang cot={cot} duLieu={danhSachDonTu} khoa={(d) => d.id} />
        </Card>
      </main>
    </AppShell>
  );
}
