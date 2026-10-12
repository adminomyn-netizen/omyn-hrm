export const dynamic = "force-dynamic";


import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card, ThongKe } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bang, type Cot } from "@/components/ui/Table";
import { layBangLuongKyGanNhat } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

type DongLuong = NonNullable<Awaited<ReturnType<typeof layBangLuongKyGanNhat>>>["chiTiet"][number];

const tien = (so: number) => so.toLocaleString("vi-VN") + " đ";

const cot: Cot<DongLuong>[] = [
  { nhan: "Nhân viên", hienThi: (d) => <span className="font-medium">{d.nhan_vien_ho_ten}</span> },
  { nhan: "Khối", hienThi: (d) => d.khoi_ten },
  { nhan: "Lương cơ bản", hienThi: (d) => tien(d.luong_co_ban) },
  { nhan: "Phụ cấp", hienThi: (d) => tien(d.phu_cap) },
  { nhan: "Thực lĩnh", hienThi: (d) => <span className="font-semibold text-slate-900">{tien(d.thuc_linh)}</span> },
];

export default async function TrangLuong() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const luong = await layBangLuongKyGanNhat();

  if (!luong) {
    return (
      <AppShell>
        <Topbar tieuDe="Bảng lương" />
        <main className="flex-1 p-4 lg:p-8">
          <Card>
            <div className="text-sm text-slate-500">Chưa có kỳ lương nào trong hệ thống.</div>
          </Card>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Topbar tieuDe="Bảng lương" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ThongKe nhan="Kỳ lương" giaTri={luong.ky} />
          <ThongKe nhan="Tổng quỹ lương" giaTri={`${(luong.tongQuyLuong / 1_000_000).toLocaleString("vi-VN")}tr`} />
          <Card>
            <div className="text-sm text-slate-500">Trạng thái</div>
            <div className="mt-1">
              <Badge mau={luong.daThanhToan ? "xanh" : "vang"}>
                {luong.daThanhToan ? "Đã thanh toán" : "Chưa thanh toán"}
              </Badge>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="font-semibold text-slate-900">Chi tiết bảng lương — {luong.ky}</div>
            <button className="rounded-lg bg-omyn-primary px-4 py-2 text-sm font-medium text-white hover:bg-omyn-primary-dark">
              Xuất file chuyển khoản
            </button>
          </div>
          <Bang cot={cot} duLieu={luong.chiTiet} khoa={(d) => d.nhan_vien_ho_ten} />
        </Card>
      </main>
    </AppShell>
  );
}
