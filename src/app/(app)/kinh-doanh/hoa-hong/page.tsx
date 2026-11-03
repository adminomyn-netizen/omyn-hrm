export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NgayChon } from "@/components/ui/NgayChon";
import { docTatCa } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { ngayHomNayHCM } from "@/lib/data";
import { hoaHongTheoCtv } from "@/lib/hoa-hong";

const laNgay = (s: string | undefined) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

/** Hoa hồng cộng tác viên, đại lý giới thiệu theo kỳ: doanh số, chờ duyệt, còn phải chi, đã chi. Số tự tính từ sổ hoa hồng. */
export default async function TrangHoaHong({ searchParams }: { searchParams: Promise<{ tu?: string; den?: string }> }) {
  await yeuCauQuyenSo("Kinh doanh");
  const homNay = ngayHomNayHCM();
  const q = await searchParams;
  let tu = laNgay(q.tu) ? (q.tu as string) : `${homNay.slice(0, 8)}01`;
  let den = laNgay(q.den) ? (q.den as string) : homNay;
  if (tu > den) [tu, den] = [den, tu];
  const [cr, hr] = await Promise.all([
    docTatCa<{ id: string; ten: string; loai: string; ty_le_hoa_hong: number | null; dang_hop_tac: boolean }>("kd_ctv", "id, ten, loai, ty_le_hoa_hong, dang_hop_tac"),
    docTatCa<{ ctv_id: string; ngay: string; so_tien_don: number; ty_le: number; so_tien_hoa_hong: number; trang_thai: string }>("kd_hoa_hong", "id, ctv_id, ngay, so_tien_don, ty_le, so_tien_hoa_hong, trang_thai"),
  ]);
  const r = hoaHongTheoCtv(
    cr.map((c) => ({ id: c.id, ten: c.ten, loai: c.loai, tyLe: c.ty_le_hoa_hong, dangHopTac: c.dang_hop_tac })),
    hr.map((h) => ({ ctvId: h.ctv_id, ngay: h.ngay, soTienDon: h.so_tien_don, tyLe: h.ty_le, soTien: h.so_tien_hoa_hong, trangThai: h.trang_thai })),
    tu, den,
  );
  const t = r.reduce((a, x) => ({ soDon: a.soDon + x.soDon, doanhSo: a.doanhSo + x.doanhSo, cho: a.cho + x.choDuyet, phaiChi: a.phaiChi + x.daDuyetChuaChi, daChi: a.daChi + x.daChi }), { soDon: 0, doanhSo: 0, cho: 0, phaiChi: 0, daChi: 0 });
  return (
    <>
      <TieuDeTrang tieuDe="Hoa hồng giới thiệu" phu="Hoa hồng cộng tác viên và đại lý giới thiệu theo kỳ. Còn phải chi = đã duyệt mà chưa chi. Số lấy từ Sổ hoa hồng.">
        <Link href="/hr/hoa-hong" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi hoa hồng</Link>
      </TieuDeTrang>
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 text-[13px] text-muc-2">
        <div className="flex flex-col gap-1"><label htmlFor="tu">Từ ngày</label><NgayChon id="tu" ten="tu" giaTriMacDinh={tu} batBuoc /></div>
        <div className="flex flex-col gap-1"><label htmlFor="den">Đến ngày</label><NgayChon id="den" ten="den" giaTriMacDinh={den} batBuoc /></div>
        <button type="submit" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Xem kỳ này</button>
      </form>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(t.doanhSo)}</div><div className="mt-1.5 text-[13px] text-muc-2">doanh số do giới thiệu ({t.soDon} đơn)</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(t.cho)}</div><div className="mt-1.5 text-[13px] text-muc-2">hoa hồng chờ duyệt</div></li>
        <li data-m={t.phaiChi > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(t.phaiChi)}</div><div className="mt-1.5 text-[13px] text-muc-2">đã duyệt, còn phải chi</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(t.daChi)}</div><div className="mt-1.5 text-[13px] text-muc-2">đã chi</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {r.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Kỳ này chưa có hoa hồng nào. Thêm người giới thiệu ở màn Cộng tác viên, rồi ghi hoa hồng từng đơn.</p> : (
          <table className="w-full min-w-[720px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Người giới thiệu</th><th className="px-4 py-3 text-right">Đơn</th><th className="px-4 py-3 text-right">Doanh số</th><th className="px-4 py-3 text-right">Chờ duyệt</th><th className="px-4 py-3 text-right">Còn phải chi</th><th className="px-4 py-3 text-right">Đã chi</th></tr></thead>
            <tbody>{r.map((x) => <tr key={x.ctvId} className="border-t border-vien"><td className="px-4 py-3 font-medium text-muc">{x.ten}</td><td className="px-4 py-3 text-right tabular-nums">{x.soDon}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(x.doanhSo)}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(x.choDuyet)}</td><td className={`px-4 py-3 text-right font-semibold tabular-nums ${x.daDuyetChuaChi > 0 ? "text-canh-bao" : ""}`}>{tienVN(x.daDuyetChuaChi)}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(x.daChi)}</td></tr>)}</tbody>
          </table>
        )}
      </section>
      <p className="mt-4 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">Tỷ lệ hoa hồng là số nguyên (%). Đơn Huỷ không tính. App chưa tự biết đơn nào do ai giới thiệu, nên mỗi đơn cần ghi vào Sổ hoa hồng.</p>
    </>
  );
}
