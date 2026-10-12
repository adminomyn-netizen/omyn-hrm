export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card, ThongKe } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { layThongKeHeThong } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

const TEN_BANG: Record<string, string> = {
  nhan_vien: "Nhân viên",
  khoi: "Khối",
  cham_cong: "Chấm công",
  don_tu: "Đơn từ",
  bang_luong: "Dòng bảng lương",
  tin_tuyen_dung: "Tin tuyển dụng",
  ung_vien: "Ứng viên",
  danh_gia_hieu_suat: "Đánh giá hiệu suất",
};

export default async function TrangKyThuat() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const he = await layThongKeHeThong();
  const tongDong = he.bang.reduce((t, b) => t + b.soDong, 0);

  return (
    <AppShell>
      <Topbar tieuDe="Kỹ thuật — Hiệu suất hệ thống" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ThongKe nhan="Tổng số dòng dữ liệu" giaTri={tongDong.toLocaleString("vi-VN")} ghiChu="Toàn bộ 8 bảng" />
          <ThongKe nhan="Đơn chờ xử lý" giaTri={String(he.soDonChoDuyet)} />
          <Card>
            <div className="text-sm text-slate-500 dark:text-slate-400">Database</div>
            <div className="mt-1">
              <Badge mau="xanh">Supabase · Singapore (ap-southeast-1)</Badge>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 font-semibold text-slate-900 dark:text-white">Số dòng theo bảng</div>
          <div className="space-y-3">
            {he.bang.map((b) => {
              const tyLe = tongDong ? Math.round((b.soDong / tongDong) * 100) : 0;
              return (
                <div key={b.bang}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{TEN_BANG[b.bang] ?? b.bang}</span>
                    <span className="text-slate-500 dark:text-slate-400">{b.soDong.toLocaleString("vi-VN")} dòng</span>
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
          <div className="mb-4 font-semibold text-slate-900 dark:text-white">Hạ tầng đang triển khai</div>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="flex justify-between border-b border-omyn-border py-2">
              <span className="text-slate-500 dark:text-slate-400">Framework</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Next.js 16 (App Router)</span>
            </div>
            <div className="flex justify-between border-b border-omyn-border py-2">
              <span className="text-slate-500 dark:text-slate-400">Hosting</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Vercel · sin1 (Singapore)</span>
            </div>
            <div className="flex justify-between border-b border-omyn-border py-2">
              <span className="text-slate-500 dark:text-slate-400">Database</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Supabase Postgres · ap-southeast-1</span>
            </div>
            <div className="flex justify-between border-b border-omyn-border py-2">
              <span className="text-slate-500 dark:text-slate-400">Xác thực</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Supabase Auth (email/mật khẩu)</span>
            </div>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
