export const dynamic = "force-dynamic";


import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card, ThongKe } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  layDanhSachKhoi,
  layDanhSachNhanVien,
  layChamCongHomNay,
  layDonTu,
  layDanhGiaKPI,
  layBangLuongKyGanNhat,
} from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

export default async function TrangTongQuan() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [khoi, nhanVien, chamCong, donTu, kpi, luong] = await Promise.all([
    layDanhSachKhoi(),
    layDanhSachNhanVien(),
    layChamCongHomNay(),
    layDonTu(),
    layDanhGiaKPI(),
    layBangLuongKyGanNhat(),
  ]);

  const dangLam = nhanVien.filter((n) => n.trang_thai === "Đang làm").length;
  const choDuyet = donTu.filter((d) => d.trang_thai === "Chờ duyệt");

  return (
    <AppShell>
      <Topbar tieuDe="Tổng quan" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ThongKe nhan="Nhân viên đang làm" giaTri={String(dangLam)} ghiChu={`Tổng ${nhanVien.length} người`} />
          <ThongKe nhan="Đơn chờ duyệt" giaTri={String(choDuyet.length)} ghiChu="Nghỉ phép, tạm ứng..." />
          <ThongKe
            nhan="Chấm công hôm nay"
            giaTri={`${chamCong.daChamCong}/${chamCong.tongNhanVien}`}
            ghiChu={`${chamCong.diMuon} đi muộn · ${chamCong.vangMat} vắng`}
          />
          <ThongKe
            nhan={luong ? `Quỹ lương ${luong.ky}` : "Quỹ lương"}
            giaTri={luong ? `${(luong.tongQuyLuong / 1_000_000).toLocaleString("vi-VN")}tr` : "--"}
            ghiChu={luong ? (luong.daThanhToan ? "Đã thanh toán" : "Chưa thanh toán") : "Chưa có kỳ lương"}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 font-semibold text-slate-900 dark:text-white">Nhân sự theo khối</div>
            <div className="space-y-3">
              {khoi.map((k) => {
                const soNguoi = nhanVien.filter((n) => n.khoi_ten === k.ten).length;
                const tyLe = nhanVien.length ? Math.round((soNguoi / nhanVien.length) * 100) : 0;
                return (
                  <div key={k.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{k.ten}</span>
                      <span className="text-slate-500 dark:text-slate-400">{soNguoi} người</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-omyn-primary" style={{ width: `${tyLe}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="mb-4 font-semibold text-slate-900 dark:text-white">Đơn chờ xử lý</div>
            <div className="space-y-3">
              {choDuyet.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-slate-700 dark:text-slate-300">{d.nhan_vien_ho_ten}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{d.loai}</div>
                  </div>
                  <Badge mau="vang">Chờ duyệt</Badge>
                </div>
              ))}
              {choDuyet.length === 0 && (
                <div className="text-sm text-slate-400 dark:text-slate-500">Không có đơn nào chờ duyệt.</div>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 font-semibold text-slate-900 dark:text-white">Đánh giá hiệu suất gần nhất</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-omyn-border text-left text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-4">Nhân viên</th>
                  <th className="pb-2 pr-4">Khối</th>
                  <th className="pb-2 pr-4">Kỳ</th>
                  <th className="pb-2 pr-4">Điểm</th>
                  <th className="pb-2">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {kpi.map((k) => (
                  <tr key={k.id} className="border-b border-omyn-border last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">{k.nhan_vien_ho_ten}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{k.khoi_ten}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{k.ky}</td>
                    <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{k.diem}</td>
                    <td className="py-2">
                      <Badge mau={k.xep_loai === "Xuất sắc" ? "xanh" : k.xep_loai === "Cần cải thiện" ? "do" : "vang"}>
                        {k.xep_loai}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
