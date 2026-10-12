import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { layDanhSachKhoi, layNhanVienTheoId } from "@/lib/data";
import { FormNhanVien } from "@/components/nhan-su/FormNhanVien";
import { yeuCauVaiTro } from "@/lib/auth";

export default async function TrangSuaNhanVien({ params }: { params: Promise<{ id: string }> }) {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const { id } = await params;
  const [khoi, nhanVien] = await Promise.all([layDanhSachKhoi(), layNhanVienTheoId(id)]);

  if (!nhanVien) notFound();

  return (
    <AppShell>
      <Topbar tieuDe="Sửa thông tin nhân viên" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Link href="/nhan-su" className="text-sm text-omyn-primary hover:underline">
          ← Quay lại danh sách nhân sự
        </Link>

        <Card className="max-w-2xl">
          <FormNhanVien khoi={khoi} coSan={nhanVien} />
        </Card>
      </main>
    </AppShell>
  );
}
