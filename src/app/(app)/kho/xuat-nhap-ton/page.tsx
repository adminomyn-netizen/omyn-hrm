export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NgayChon } from "@/components/ui/NgayChon";
import { docTatCa } from "@/lib/hr-db";
import { ngayHomNayHCM } from "@/lib/data";
import { dieuChinhTheoLyDo, xuatNhapTon } from "@/lib/ton-kho";

const so = (n: number) => n.toLocaleString("vi-VN");
const laNgay = (s: string | undefined) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

/** Báo cáo xuất-nhập-tồn theo kỳ chọn. Số lấy từ phiếu nhập xuất, không nhập tay. */
export default async function TrangXuatNhapTon({ searchParams }: { searchParams: Promise<{ tu?: string; den?: string }> }) {
  await yeuCauQuyenSo("Tài chính & Kho");
  const homNay = ngayHomNayHCM();
  const q = await searchParams;
  const dauThang = `${homNay.slice(0, 8)}01`;
  let tu = laNgay(q.tu) ? (q.tu as string) : dauThang;
  let den = laNgay(q.den) ? (q.den as string) : homNay;
  if (tu > den) [tu, den] = [den, tu];
  const [sp, nx] = await Promise.all([
    docTatCa<{ id: string; ma_sp: string; ten: string }>("sp_san_pham", "id, ma_sp, ten"),
    docTatCa<{ san_pham_id: string; loai: string; so_luong: number; ngay: string; ly_do: string | null }>("kho_nhap_xuat", "id, san_pham_id, loai, so_luong, ngay, ly_do"),
  ]);
  const dong = nx.map((d) => ({ sanPhamId: d.san_pham_id, loai: d.loai, soLuong: d.so_luong, ngay: d.ngay, lyDo: d.ly_do }));
  const r = xuatNhapTon(sp.map((s) => ({ id: s.id, ma: s.ma_sp, ten: s.ten })), dong, tu, den);
  const lyDo = dieuChinhTheoLyDo(dong, tu, den);
  return (
    <>
      <TieuDeTrang tieuDe="Xuất nhập tồn" phu="Tồn đầu kỳ, nhập, xuất, điều chỉnh và tồn cuối kỳ của từng sản phẩm. Số lấy từ phiếu nhập xuất, không nhập tay.">
        <Link href="/hr/nhap-xuat-kho" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Phiếu nhập xuất</Link>
      </TieuDeTrang>
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 text-[13px] text-muc-2">
        <div className="flex flex-col gap-1"><label htmlFor="tu">Từ ngày</label><NgayChon id="tu" ten="tu" giaTriMacDinh={tu} batBuoc /></div>
        <div className="flex flex-col gap-1"><label htmlFor="den">Đến ngày</label><NgayChon id="den" ten="den" giaTriMacDinh={den} batBuoc /></div>
        <button type="submit" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Xem kỳ này</button>
      </form>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
        {r.dong.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có phiếu nhập xuất nào tới hết ngày {den}.</p>
        ) : (
          <table className="w-full min-w-[760px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3 text-right">Tồn đầu</th><th className="px-4 py-3 text-right">Nhập</th><th className="px-4 py-3 text-right">Điều chỉnh tăng</th><th className="px-4 py-3 text-right">Xuất</th><th className="px-4 py-3 text-right">Điều chỉnh giảm</th><th className="px-4 py-3 text-right">Tồn cuối</th></tr></thead>
            <tbody>
              {r.dong.map((d) => (
                <tr key={d.id} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{d.ten} <span className="text-[12px] text-muc-3">({d.ma})</span></td>
                  <td className="px-4 py-3 text-right tabular-nums">{so(d.tonDau)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{so(d.nhap)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{so(d.tang)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{so(d.xuat)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{so(d.giam)}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${d.tonCuoi < 0 ? "text-loi" : ""}`}>{so(d.tonCuoi)}</td>
                </tr>
              ))}
              <tr className="border-t border-vien font-semibold"><td className="px-4 py-3">Cộng</td><td className="px-4 py-3 text-right tabular-nums">{so(r.tong.tonDau)}</td><td className="px-4 py-3 text-right tabular-nums">{so(r.tong.nhap)}</td><td className="px-4 py-3 text-right tabular-nums">{so(r.tong.tang)}</td><td className="px-4 py-3 text-right tabular-nums">{so(r.tong.xuat)}</td><td className="px-4 py-3 text-right tabular-nums">{so(r.tong.giam)}</td><td className="px-4 py-3 text-right tabular-nums">{so(r.tong.tonCuoi)}</td></tr>
            </tbody>
          </table>
        )}
      </section>
      <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Điều chỉnh trong kỳ theo lý do</h2>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {lyDo.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Kỳ này chưa có phiếu điều chỉnh hay xuất huỷ nào.</p>
        ) : (
          <table className="w-full min-w-[420px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Lý do</th><th className="px-4 py-3 text-right">Tăng</th><th className="px-4 py-3 text-right">Giảm</th></tr></thead>
            <tbody>{lyDo.map((l) => <tr key={l.lyDo} className="border-t border-vien"><td className="px-4 py-3">{l.lyDo}</td><td className="px-4 py-3 text-right tabular-nums">{so(l.tang)}</td><td className="px-4 py-3 text-right tabular-nums">{so(l.giam)}</td></tr>)}</tbody>
          </table>
        )}
      </section>
    </>
  );
}
