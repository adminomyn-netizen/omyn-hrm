"use client";

import { useState } from "react";
import { useLuuTru } from "@/lib/luu-tru";

const KHOA = "omyn-hrm-tong-quan-tab";

/** Tổng quan chia thành các tab cho đỡ dài: mọi tab đã dựng sẵn ở máy chủ, chỉ ẩn/hiện; nhớ tab đang xem lần trước. */
export function TabTongQuan({ tabs }: { tabs: { ma: string; ten: string; noiDung: React.ReactNode }[] }) {
  const [luu, ghi] = useLuuTru(KHOA, "");
  const [chon, setChon] = useState<string | null>(null);
  const ma = tabs.some((t) => t.ma === (chon ?? luu)) ? (chon ?? luu) : tabs[0].ma;
  return (
    <section>
      <div role="tablist" aria-label="Các phần của Tổng quan" className="mb-6 flex flex-wrap gap-1 border-b border-vien">
        {tabs.map((t) => (
          <button
            key={t.ma}
            type="button"
            role="tab"
            id={`tq-tab-${t.ma}`}
            aria-selected={t.ma === ma}
            aria-controls={`tq-${t.ma}`}
            onClick={() => { setChon(t.ma); ghi(t.ma); }}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] ${t.ma === ma ? "border-nhan font-semibold text-muc" : "border-transparent text-muc-2 hover:text-muc"}`}
          >
            {t.ten}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.ma} id={`tq-${t.ma}`} role="tabpanel" aria-labelledby={`tq-tab-${t.ma}`} hidden={t.ma !== ma} className="space-y-10">
          {t.noiDung}
        </div>
      ))}
    </section>
  );
}
