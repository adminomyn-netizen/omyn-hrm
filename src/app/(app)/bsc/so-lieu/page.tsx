export const dynamic = "force-dynamic";

import Link from "next/link";
import { FormSoLieu } from "@/components/bsc/FormSoLieu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { yeuCauVaiTro } from "@/lib/auth";
import { docNamThang, taiBsc } from "@/lib/bsc-data";

/** Nhập kế hoạch + thực tế BSC cả công ty theo tháng (Quản trị/Kỹ thuật). */
export default async function TrangSoLieuBsc({ searchParams }: { searchParams: Promise<{ nam?: string; thang?: string }> }) {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const sp = await searchParams;
  const { nam, thang } = docNamThang(sp.nam, sp.thang);
  const b = await taiBsc(nam, thang);
  const dong = b.cay.goc.flatMap((g) => g.mucTieu.flatMap((m) => m.chiSo.map((c) => {
    const t = c.thangs.find((x) => x.thang === thang);
    return { id: c.id, ten: c.ten, donVi: c.donVi, goc: g.ten, muc: m.ten, ke: t?.keHoach?.toString() ?? "", thuc: t?.thucTe?.toString() ?? "" };
  })));
  const lk = (t: number) => `/bsc/so-lieu?nam=${nam}&thang=${t}`;
  return (
    <>
      <TieuDeTrang tieuDe="Nhập số liệu BSC" phu={<><Link href={`/bsc?nam=${nam}&thang=${thang}`} className="text-nhan-dam hover:underline">← Mục tiêu BSC</Link><span className="mx-2 text-vien-dam">·</span>Năm {nam}, tháng {thang}</>} />
      <nav aria-label="Chọn tháng" className="mb-5 flex flex-wrap gap-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => <Link key={t} href={lk(t)} aria-current={t === thang ? "page" : undefined} className={`rounded-tag px-2.5 py-1.5 text-[13px] font-medium ${t === thang ? "nut-vang" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>T{t}{b.khoa.has(t) ? " ·" : ""}</Link>)}
      </nav>
      {dong.length === 0
        ? <p className="rounded-nho border border-vien bg-giay-sang p-5 text-[14px] text-muc-2">Năm {nam} chưa có chỉ số nào. Thêm ở <Link href="/hr/bsc-chi-so" className="text-nhan-dam underline-offset-4 hover:underline">Chỉ số BSC</Link> rồi quay lại nhập số.</p>
        : <FormSoLieu key={`${nam}-${thang}-${b.khoa.has(thang)}`} nam={nam} thang={thang} dong={dong} khoa={b.khoa.has(thang)} />}
    </>
  );
}
