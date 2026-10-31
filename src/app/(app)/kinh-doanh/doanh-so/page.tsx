export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { dbHr } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { tinhDoanhSo } from "@/lib/kinh-doanh";

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const thangKe = (t: string, n: number) => {
  const d = new Date(Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

/** Doanh số tháng so với chỉ tiêu theo kênh, tự tính từ doanh thu sàn theo ngày, đơn bán sỉ và phiên live. */
export default async function TrangDoanhSo({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  await yeuCauQuyenSo("Kinh doanh");
  const { thang: t } = await searchParams;
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const thang = t && THANG.test(t) ? t : homNay.slice(0, 7);
  const dau = `${thang}-01`;
  const cuoi = `${thangKe(thang, 1)}-01`;
  const db = dbHr();
  const [ct, san, si, live] = await Promise.all([
    db.from("kd_chi_tieu").select("kenh, chi_tieu").eq("thang", dau),
    db.from("kd_doanh_thu_ngay").select("doanh_thu, doanh_thu_hoan").gte("ngay", dau).lt("ngay", cuoi).limit(50000),
    db.from("kd_don_si").select("trang_thai, gia_tri").gte("ngay", dau).lt("ngay", cuoi).limit(50000),
    db.from("kd_phien_live").select("doanh_thu").eq("trang_thai", "Đã live").gte("ngay", dau).lt("ngay", cuoi).limit(50000),
  ]);
  const tong = (r: { data: unknown }, c: string) => ((r.data ?? []) as Record<string, number | null>[]).reduce((a, d) => a + (d[c] ?? 0), 0);
  const kq = tinhDoanhSo(
    ((ct.data ?? []) as { kenh: string; chi_tieu: number }[]).map((c) => ({ kenh: c.kenh, chiTieu: c.chi_tieu })),
    tong(san, "doanh_thu"),
    tong(san, "doanh_thu_hoan"),
    ((si.data ?? []) as { trang_thai: string; gia_tri: number }[]).map((d) => ({ trangThai: d.trang_thai, giaTri: d.gia_tri })),
    tong(live, "doanh_thu"),
  );
  return (
    <>
      <TieuDeTrang tieuDe="Doanh số so chỉ tiêu" phu="Thực đạt tự tính: Sàn = doanh thu theo ngày trừ tiền hoàn; Sỉ và đại lý = đơn đã chốt trở đi; Livestream = phiên đã live. Tổng = Sàn + Sỉ (live bán qua sàn đã nằm trong Sàn nên không cộng lại).">
        <Link href="/hr/chi-tieu-doanh-so" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Giao chỉ tiêu</Link>
      </TieuDeTrang>
      <nav aria-label="Chọn tháng" className="mb-5 flex items-center gap-3 text-[14px]">
        <Link href={`?thang=${thangKe(thang, -1)}`} className="text-muc-2 underline-offset-4 hover:underline">← Tháng trước</Link>
        <span className="font-semibold text-muc">Tháng {thang.slice(5)}/{thang.slice(0, 4)}</span>
        <Link href={`?thang=${thangKe(thang, 1)}`} className="text-muc-2 underline-offset-4 hover:underline">Tháng sau →</Link>
      </nav>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kq.map((k, i) => (
          <li key={k.kenh} data-m={[7, 1, 5, 3][i]} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4">
            <div className="text-[13px] font-medium text-muc-2">{k.kenh}</div>
            <div className="chu-tieu-de mau-chu mt-1 text-[26px] leading-none">{tienVN(k.thucDat)}</div>
            <div className="mt-2 text-[13px] text-muc-3">{k.chiTieu === null ? "Chưa giao chỉ tiêu" : `Chỉ tiêu ${tienVN(k.chiTieu)} · đạt ${k.phanTram}%`}</div>
          </li>
        ))}
      </ul>
    </>
  );
}
