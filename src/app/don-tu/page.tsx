export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bang, type Cot } from "@/components/ui/Table";
import { layDonTu, layDonTuCuaToi, layNhanVienIdTheoUser } from "@/lib/data";
import { layNguoiDungHienTai } from "@/lib/auth";
import { HanhDongDonTu } from "@/components/don-tu/HanhDongDonTu";

type DonTu = Awaited<ReturnType<typeof layDonTu>>[number];
type DonTuCuaToi = Awaited<ReturnType<typeof layDonTuCuaToi>>[number];

function theBadge(trangThai: string) {
  return (
    <Badge mau={trangThai === "Đã duyệt" ? "xanh" : trangThai === "Từ chối" ? "do" : "vang"}>{trangThai}</Badge>
  );
}

const cotQuanLy: Cot<DonTu>[] = [
  { nhan: "Nhân viên", hienThi: (d) => <span className="font-medium">{d.nhan_vien_ho_ten}</span> },
  { nhan: "Loại đơn", hienThi: (d) => d.loai },
  { nhan: "Từ ngày", hienThi: (d) => d.tu_ngay },
  { nhan: "Đến ngày", hienThi: (d) => d.den_ngay },
  { nhan: "Trạng thái", hienThi: (d) => theBadge(d.trang_thai) },
  {
    nhan: "",
    hienThi: (d) => (d.trang_thai === "Chờ duyệt" ? <HanhDongDonTu id={d.id} /> : null),
  },
];

const cotCaNhan: Cot<DonTuCuaToi>[] = [
  { nhan: "Loại đơn", hienThi: (d) => <span className="font-medium">{d.loai}</span> },
  { nhan: "Từ ngày", hienThi: (d) => d.tu_ngay },
  { nhan: "Đến ngày", hienThi: (d) => d.den_ngay },
  { nhan: "Trạng thái", hienThi: (d) => theBadge(d.trang_thai) },
];

export default async function TrangDonTu() {
  const nguoiDung = await layNguoiDungHienTai();

  if (nguoiDung?.vaiTro === "nhan_vien") {
    const nhanVienId = await layNhanVienIdTheoUser(nguoiDung.id);
    const danhSachCuaToi = nhanVienId ? await layDonTuCuaToi(nhanVienId) : [];

    return (
      <AppShell>
        <Topbar tieuDe="Đơn từ của tôi" />
        <main className="flex-1 space-y-6 p-4 lg:p-8">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold text-slate-900 dark:text-white">Đơn của tôi ({danhSachCuaToi.length})</div>
              <Link
                href="/don-tu/moi"
                className="rounded-lg bg-omyn-primary px-4 py-2 text-sm font-medium text-white hover:bg-omyn-primary-dark"
              >
                + Nộp đơn mới
              </Link>
            </div>
            <Bang cot={cotCaNhan} duLieu={danhSachCuaToi} khoa={(d) => d.id} />
          </Card>
        </main>
      </AppShell>
    );
  }

  const danhSachDonTu = await layDonTu();

  return (
    <AppShell>
      <Topbar tieuDe="Đơn từ & phê duyệt" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Card>
          <div className="mb-4 font-semibold text-slate-900 dark:text-white">
            Tất cả đơn ({danhSachDonTu.length})
          </div>
          <Bang cot={cotQuanLy} duLieu={danhSachDonTu} khoa={(d) => d.id} />
        </Card>
      </main>
    </AppShell>
  );
}
