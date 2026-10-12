import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { FileText, Download } from "lucide-react";

const bieuMau = [
  { ten: "Báo cáo tình hình sử dụng lao động (6 tháng/năm)", can_cu: "Điều 20 BLLĐ 2019" },
  { ten: "Đơn xin nghỉ phép năm", can_cu: "Nội quy công ty" },
  { ten: "Đơn xin nghỉ ốm hưởng trợ cấp BHXH", can_cu: "Luật BHXH" },
  { ten: "Hợp đồng lao động & phụ lục", can_cu: "Bộ luật Lao động 2019" },
  { ten: "Quyết định bổ nhiệm / điều chuyển / kỷ luật", can_cu: "Nội quy công ty" },
];

export default function TrangBaoCao() {
  return (
    <AppShell>
      <Topbar tieuDe="Báo cáo & biểu mẫu" />
      <main className="flex-1 space-y-6 p-4 lg:p-8">
        <Card>
          <div className="mb-4 font-semibold text-slate-900">Biểu mẫu & quy định hành chính nhân sự</div>
          <div className="divide-y divide-omyn-border">
            {bieuMau.map((b) => (
              <div key={b.ten} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-omyn-primary" />
                  <div>
                    <div className="text-sm font-medium text-slate-800">{b.ten}</div>
                    <div className="text-xs text-slate-400">Căn cứ: {b.can_cu}</div>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
                  <Download className="h-3.5 w-3.5" />
                  Tải mẫu
                </button>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
