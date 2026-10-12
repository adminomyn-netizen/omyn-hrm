export const dynamic = "force-dynamic";


import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bang, type Cot } from "@/components/ui/Table";
import { layDanhSachNhanVien } from "@/lib/data";
import { HanhDongNhanVien } from "@/components/nhan-su/HanhDongNhanVien";
import { yeuCauVaiTro } from "@/lib/auth";

type NhanVien = Awaited<ReturnType<typeof layDanhSachNhanVien>>[number];

const cot: Cot<NhanVien>[] = [
  { nhan: "Mã NV", hienThi: (n) => n.ma_nhan_vien },
  { nhan: "Họ tên", hienThi: (n) => <span className="font-medium">{n.ho_ten}</span> },
  { nhan: "Chức danh", hienThi: (n) => n.chuc_danh },
  { nhan: "Khối", hienThi: (n) => n.khoi_ten },
  { nhan: "Email", hienThi: (n) => n.email },
  { nhan: "Ngày vào làm", hienThi: (n) => n.ngay_vao_lam },
  {
    nhan: "Trạng thái",
    hienThi: (n) => (
      <Badge mau={n.trang_thai === "Đang làm" ? "xanh" : n.trang_thai === "Thử việc" ? "vang" : "xam"}>
        {n.trang_thai}
      </Badge>
    ),
  },
  { nhan: "", hienThi: (n) => <HanhDongNhanVien id={n.id} hoTen={n.ho_ten} /> },
];

export default async function TrangNhanSu() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const danhSachNhanVien = await layDanhSachNhanVien();

  return (
    <AppShell>
      <Topbar tieuDe="Hồ sơ nhân sự" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="font-semibold text-slate-900">
              Danh sách nhân viên ({danhSachNhanVien.length})
            </div>
            <Link
              href="/nhan-su/them"
              className="rounded-lg bg-omyn-primary px-4 py-2 text-sm font-medium text-white hover:bg-omyn-primary-dark"
            >
              + Thêm nhân viên
            </Link>
          </div>
          <Bang cot={cot} duLieu={danhSachNhanVien} khoa={(n) => n.id} />
        </Card>
      </main>
    </AppShell>
  );
}
