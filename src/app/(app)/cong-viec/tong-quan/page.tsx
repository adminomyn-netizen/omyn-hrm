export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { TabHieuSuat } from "@/components/hieu-suat/TabHieuSuat";
import { ThanhCongViec } from "@/components/cong-viec/ThanhCongViec";
import { TongQuanBaoCaoBang } from "@/components/cong-viec/TongQuanBaoCaoBang";
import { duocXemTongQuanBaoCao, layTongQuanBaoCao } from "@/lib/bao-cao-cv-data";
import { homNayHcm } from "@/lib/kpi-data";
import { congNgay } from "@/lib/nhac-hr";

/** Tổng quan báo cáo công việc của mọi người: chỉ Giám đốc, Phó giám đốc, Kỹ thuật xem được. Chọn ngày để xem lại các ngày trước. */
export default async function TrangTongQuanBaoCao({ searchParams }: { searchParams: Promise<{ ngay?: string }> }) {
  if (!(await duocXemTongQuanBaoCao())) redirect("/cong-viec");
  const homNay = homNayHcm();
  const sp = await searchParams;
  const ngay = sp.ngay && /^\d{4}-\d{2}-\d{2}$/.test(sp.ngay) && sp.ngay <= homNay ? sp.ngay : homNay;
  const tq = await layTongQuanBaoCao(ngay);
  const truoc = congNgay(ngay, -1), sau = congNgay(ngay, 1);
  const hien = `${ngay.slice(8)}/${ngay.slice(5, 7)}/${ngay.slice(0, 4)}`;
  return (
    <>
      <TabHieuSuat dang="cong-viec" />
      <ThanhCongViec dang="tong-quan" coTongQuan />
      <TieuDeTrang tieuDe="Tổng quan báo cáo" phu={`Ngày ${hien}${ngay === homNay ? " (hôm nay)" : ""}: ai đã nộp báo cáo, việc làm được và link minh chứng.`}>
        <div className="flex items-center gap-2 text-[13px]">
          <Link href={`/cong-viec/tong-quan?ngay=${truoc}`} className="rounded-tag border border-vien px-3 py-1.5 font-medium text-muc-2 hover:bg-giay-tram">Hôm trước</Link>
          {ngay < homNay && <Link href={`/cong-viec/tong-quan?ngay=${sau}`} className="rounded-tag border border-vien px-3 py-1.5 font-medium text-muc-2 hover:bg-giay-tram">Hôm sau</Link>}
          {ngay !== homNay && <Link href="/cong-viec/tong-quan" className="rounded-tag border border-vien px-3 py-1.5 font-medium text-muc-2 hover:bg-giay-tram">Hôm nay</Link>}
        </div>
      </TieuDeTrang>
      <TongQuanBaoCaoBang tq={tq} />
    </>
  );
}
