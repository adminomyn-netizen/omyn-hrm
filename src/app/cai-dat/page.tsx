export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { yeuCauVaiTro } from "@/lib/auth";

const vaiTro = [
  { ten: "Quản trị hệ thống", quyen: "Toàn quyền" },
  { ten: "Trưởng khối", quyen: "Xem & duyệt trong khối mình quản lý" },
  { ten: "Nhân viên C&B", quyen: "Xem & sửa lương, chấm công" },
  { ten: "Nhân viên", quyen: "Chỉ xem hồ sơ & gửi đơn của mình" },
];

export default async function TrangCaiDat() {
  await yeuCauVaiTro(["admin"]);
  return (
    <AppShell>
      <Topbar tieuDe="Cài đặt & phân quyền" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Card>
          <div className="mb-4 font-semibold text-slate-900 dark:text-white">Vai trò & phân quyền</div>
          <div className="divide-y divide-omyn-border">
            {vaiTro.map((v) => (
              <div key={v.ten} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{v.ten}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{v.quyen}</div>
                </div>
                <Badge mau="xam">Đang áp dụng</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-2 font-semibold text-slate-900 dark:text-white">Bộ nhận diện thương hiệu</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Giao diện đang dùng màu tạm (xanh rêu) và chữ &quot;OMYN&quot; thay logo. Khi có file
            logo/bộ nhận diện chính thức, thay trực tiếp trong{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">src/app/globals.css</code>{" "}
            và{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              src/components/layout/Sidebar.tsx
            </code>
            .
          </p>
        </Card>
      </main>
    </AppShell>
  );
}
