import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { FormDonTu } from "./FormDonTu";

export const dynamic = "force-dynamic";

export default function TrangTaoDonTu() {
  return (
    <AppShell>
      <Topbar tieuDe="Nộp đơn mới" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Link href="/don-tu" className="text-sm text-omyn-primary hover:underline">
          ← Quay lại đơn từ của tôi
        </Link>

        <Card className="max-w-xl">
          <FormDonTu />
        </Card>
      </main>
    </AppShell>
  );
}
