export const dynamic = "force-dynamic";


import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bang, type Cot } from "@/components/ui/Table";
import { layTuyenDung } from "@/lib/data";
import { yeuCauVaiTro } from "@/lib/auth";

type TuyenDung = Awaited<ReturnType<typeof layTuyenDung>>[number];

const cot: Cot<TuyenDung>[] = [
  { nhan: "Vị trí", hienThi: (t) => <span className="font-medium">{t.vi_tri}</span> },
  { nhan: "Khối", hienThi: (t) => t.khoi_ten },
  { nhan: "Số lượng cần", hienThi: (t) => String(t.so_luong_can) },
  { nhan: "Số ứng viên", hienThi: (t) => String(t.so_ung_vien) },
  {
    nhan: "Trạng thái",
    hienThi: (t) => (
      <Badge mau={t.trang_thai === "Đang phỏng vấn" ? "xanh" : t.trang_thai === "Đã đóng" ? "xam" : "vang"}>
        {t.trang_thai}
      </Badge>
    ),
  },
];

export default async function TrangTuyenDung() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const danhSachTuyenDung = await layTuyenDung();

  return (
    <AppShell>
      <Topbar tieuDe="Tuyển dụng" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="font-semibold text-slate-900">
              Tin tuyển dụng đang mở ({danhSachTuyenDung.length})
            </div>
            <button className="rounded-lg bg-omyn-primary px-4 py-2 text-sm font-medium text-white hover:bg-omyn-primary-dark">
              + Đăng tuyển
            </button>
          </div>
          <Bang cot={cot} duLieu={danhSachTuyenDung} khoa={(t) => t.id} />
        </Card>
      </main>
    </AppShell>
  );
}
