export const dynamic = "force-dynamic";

import { Download } from "lucide-react";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MucTrang } from "@/components/ui/MucTrang";
import { yeuCauVaiTro } from "@/lib/auth";

const bieuMau = [
  { ten: "Báo cáo tình hình sử dụng lao động (6 tháng/năm)", canCu: "Điều 20 Bộ luật Lao động 2019" },
  { ten: "Đơn xin nghỉ phép năm", canCu: "Nội quy công ty" },
  { ten: "Đơn xin nghỉ ốm hưởng trợ cấp BHXH", canCu: "Luật Bảo hiểm xã hội" },
  { ten: "Hợp đồng lao động và phụ lục", canCu: "Bộ luật Lao động 2019" },
  { ten: "Quyết định bổ nhiệm, điều chuyển, kỷ luật", canCu: "Nội quy công ty" },
];

export default async function TrangBaoCao() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  return (
    <div className="space-y-10">
      <TieuDeTrang tieuDe="Báo cáo và biểu mẫu" phu="Biểu mẫu và quy định hành chính nhân sự" />
      <MucTrang tieuDe="Biểu mẫu và quy định hành chính nhân sự">
      <ul>
        {bieuMau.map((b) => (
          <li key={b.ten} className="flex items-center justify-between gap-4 border-b border-vien py-4 last:border-b-0">
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-muc">{b.ten}</div>
              <div className="text-[13px] text-muc-3">Căn cứ: {b.canCu}</div>
            </div>
            <button type="button" disabled title="Tệp mẫu sẽ được tải lên khi có bản chính thức" className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-muc-3">
              <Download strokeWidth={1.5} className="h-4 w-4" />
              Sắp có
            </button>
          </li>
        ))}
      </ul>
    </MucTrang>
    </div>
  );
}
