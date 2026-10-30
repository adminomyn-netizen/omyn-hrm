export const dynamic = "force-dynamic";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { yeuCauDangNhapDaDuyet } from "@/lib/phe-duyet-quyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MAU_PHIEU } from "@/lib/phe-duyet-mau";
import { docNhomMa } from "@/lib/phe-duyet-data";

const TEN_NHOM: Record<string, string> = { HR: "Nhân sự", FIN: "Tài chính", MKT: "Marketing", ADM: "Hành chính" };

/** Chọn loại phiếu để tạo: gom theo nhóm mã (HR, FIN, MKT, ADM…) đang cài đặt. */
const MAU_NHOM: Record<string, number> = { HR: 1, FIN: 7, MKT: 5, ADM: 3 };

export default async function TrangChonPhieu() {
  await yeuCauDangNhapDaDuyet();
  const nhom = await docNhomMa();
  const gom = new Map<string, typeof MAU_PHIEU[number][]>();
  for (const m of MAU_PHIEU) {
    const c = nhom[m.ma];
    if (c && !c.dung) continue;
    const k = c?.nhom ?? m.nhomMacDinh;
    gom.set(k, [...(gom.get(k) ?? []), m]);
  }
  return (
    <>
      <TieuDeTrang tieuDe="Tạo phiếu" phu="Chọn loại phiếu cần nộp. Phiếu được cấp mã riêng để tìm lại." />
      <div className="space-y-7">
        {[...gom.entries()].map(([k, ds]) => (
          <section key={k} data-m={MAU_NHOM[k] ?? 9} className="mau-nhom">
            <h2 className="mau-nen mau-chu mb-2.5 inline-flex items-center gap-2 rounded-nho px-3 py-1.5 text-[13px] font-semibold uppercase tracking-[0.1em]">{TEN_NHOM[k] ?? k} <span className="mau-chip rounded-tag bg-giay-sang px-1.5 normal-case tracking-normal">mã {k}</span></h2>
            <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {ds.map((m) => (
                <li key={m.ma}>
                  <Link href={`/phe-duyet/moi/${m.ma}`} className="the-noi the-noi-thap the-noi-nang mau-hover flex items-center gap-3 border-l-4 border-l-[var(--m-chu)] p-4">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-muc">{m.ten}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-muc-3">{m.moTa}</span>
                    </span>
                    <ChevronRight className="mau-chu h-4 w-4 shrink-0" strokeWidth={1.6} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
