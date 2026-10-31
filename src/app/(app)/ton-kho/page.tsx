export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { ngayVN } from "@/lib/dinh-dang";
import { chenhLechKiemKe, tinhTonKho } from "@/lib/ton-kho";

/** Tồn kho theo sản phẩm, tính từ phiếu nhập xuất. Không nhập tay. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangTonKho() {
  await yeuCauQuyenSo("Tài chính & Kho");
  const [sp, nx, kk] = await Promise.all([
    docTatCa<{ id: string; ma_sp: string; ten: string; ton_toi_thieu: number | null }>("sp_san_pham", "id, ma_sp, ten, ton_toi_thieu"),
    docTatCa<{ san_pham_id: string; loai: string; so_luong: number; ngay: string }>("kho_nhap_xuat", "id, san_pham_id, loai, so_luong, ngay"),
    docTatCa<{ san_pham_id: string; ngay: string; ton_thuc_te: number }>("kho_kiem_ke", "id, san_pham_id, ngay, ton_thuc_te"),
  ]);
  const dsSp = sp.map((s) => ({ id: s.id, ma: s.ma_sp, ten: s.ten, tonToiThieu: s.ton_toi_thieu }));
  const dong = nx.map((d) => ({ sanPhamId: d.san_pham_id, loai: d.loai, soLuong: d.so_luong, ngay: d.ngay }));
  const ds = tinhTonKho(dsSp, dong);
  const tenSp = new Map(dsSp.map((s) => [s.id, `${s.ten} (${s.ma})`]));
  const lech = chenhLechKiemKe(dong, kk.map((k) => ({ sanPhamId: k.san_pham_id, ngay: k.ngay, thucTe: k.ton_thuc_te })));
  const soLech = lech.filter((l) => l.chenh !== 0).length;
  const am = ds.filter((d) => d.ton < 0).length;
  const sapHet = ds.filter((d) => d.sapHet && d.ton >= 0).length;
  return (
    <>
      <TieuDeTrang tieuDe="Tồn kho" phu="Tồn của từng sản phẩm = nhập + điều chỉnh tăng − xuất − điều chỉnh giảm. Số lấy từ phiếu nhập xuất, không nhập tay.">
        <Link href="/hr/nhap-xuat-kho" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Phiếu nhập xuất</Link>
      </TieuDeTrang>
      {am > 0 && (
        <p role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[13px] text-loi">{am} sản phẩm đang tồn âm: xuất nhiều hơn nhập. Kiểm lại phiếu nhập xuất của các sản phẩm này.</p>
      )}
      {sapHet > 0 && (
        <p role="status" className="mb-4 rounded-nho bg-giay-tram px-3 py-2.5 text-[13px] text-muc-2">{sapHet} sản phẩm sắp hết hàng (tồn bằng hoặc dưới mức tối thiểu, đánh dấu ở cột Tồn). Mức tối thiểu đặt ở màn Danh mục sản phẩm.</p>
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
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${d.ton < 0 ? "text-loi" : "mau-chu"}`}>{d.ton}{d.sapHet && d.ton >= 0 ? <span className="ml-2 text-[12px] font-medium text-muc-3">sắp hết</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {lech.length > 0 && (
        <section data-m="7" className="mau-nhom mt-8" aria-label="Kiểm kê gần nhất">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="mau-chu text-[17px] font-semibold">Kiểm kê gần nhất</h2>
            <span className="text-[13px] text-muc-3">{soLech > 0 ? `${soLech} sản phẩm lệch so với sổ` : "Tất cả khớp với sổ"} · chênh = đếm thực tế − sổ tính đến ngày kiểm kê</span>
            <Link href="/hr/kiem-ke-kho" className="ml-auto text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Ghi kiểm kê</Link>
          </div>
          <div className="the-noi the-noi-thap mau-vach overflow-x-auto">
            <table className="w-full min-w-[560px] text-[14px]">
              <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">Ngày</th><th className="px-4 py-3 text-right">Sổ</th><th className="px-4 py-3 text-right">Đếm thực tế</th><th className="px-4 py-3 text-right">Chênh</th></tr></thead>
              <tbody>
                {lech.map((l) => (
                  <tr key={l.sanPhamId} className="border-t border-vien">
                    <td className="px-4 py-3 font-medium text-muc">{tenSp.get(l.sanPhamId) ?? "Sản phẩm đã xoá"}</td>
                    <td className="px-4 py-3 text-muc-2">{ngayVN(l.ngay)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.soSach}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.thucTe}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${l.chenh === 0 ? "text-muc-3" : "text-loi"}`}>{l.chenh > 0 ? "+" : ""}{l.chenh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
