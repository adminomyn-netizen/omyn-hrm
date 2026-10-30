export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { dbHr } from "@/lib/hr-db";
import { tinhTonKho } from "@/lib/ton-kho";

/** Tồn kho theo sản phẩm, tính từ phiếu nhập xuất. Không nhập tay. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangTonKho() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const db = dbHr();
  const [sp, nx] = await Promise.all([
    db.from("sp_san_pham").select("id, ma_sp, ten").limit(5000),
    db.from("kho_nhap_xuat").select("san_pham_id, loai, so_luong").limit(100000),
  ]);
  const ds = tinhTonKho(
    ((sp.data ?? []) as { id: string; ma_sp: string; ten: string }[]).map((s) => ({ id: s.id, ma: s.ma_sp, ten: s.ten })),
    ((nx.data ?? []) as { san_pham_id: string; loai: string; so_luong: number }[]).map((d) => ({ sanPhamId: d.san_pham_id, loai: d.loai, soLuong: d.so_luong })),
  );
  const am = ds.filter((d) => d.ton < 0).length;
  return (
    <>
      <TieuDeTrang tieuDe="Tồn kho" phu="Tồn của từng sản phẩm = nhập + điều chỉnh tăng − xuất − điều chỉnh giảm. Số lấy từ phiếu nhập xuất, không nhập tay.">
        <Link href="/hr/nhap-xuat-kho" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Phiếu nhập xuất</Link>
      </TieuDeTrang>
      {am > 0 && (
        <p role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[13px] text-loi">{am} sản phẩm đang tồn âm: xuất nhiều hơn nhập. Kiểm lại phiếu nhập xuất của các sản phẩm này.</p>
      )}
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có phiếu nhập xuất nào. Ghi phiếu nhập đầu tiên ở màn Phiếu nhập xuất, tồn kho sẽ tự có.</p>
        ) : (
          <table className="w-full min-w-[560px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3 text-right">Nhập</th><th className="px-4 py-3 text-right">Xuất</th><th className="px-4 py-3 text-right">Điều chỉnh</th><th className="px-4 py-3 text-right">Tồn</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.id} className="border-t border-vien">
                  <td className="px-4 py-3"><span className="font-medium text-muc">{d.ten}</span> <span className="text-muc-3">{d.ma}</span></td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.nhap}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.xuat}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.dieuChinh > 0 ? "+" : ""}{d.dieuChinh}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${d.ton < 0 ? "text-loi" : "mau-chu"}`}>{d.ton}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
