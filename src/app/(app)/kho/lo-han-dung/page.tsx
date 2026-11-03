export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { ngayVN } from "@/lib/dinh-dang";
import { ngayHomNayHCM } from "@/lib/data";
import { goiYXuatTruoc, tinhTonLo } from "@/lib/ton-kho";

const so = (n: number) => n.toLocaleString("vi-VN");

/** Cảnh báo lô sắp hết hạn và gợi ý xuất lô gần hết hạn trước. Số lấy từ sổ lô và phiếu nhập xuất, không nhập tay. */
export default async function TrangLoHanDung() {
  await yeuCauQuyenSo("Tài chính & Kho");
  const homNay = ngayHomNayHCM();
  const [sp, lo, nx] = await Promise.all([
    docTatCa<{ id: string; ma_sp: string; ten: string }>("sp_san_pham", "id, ma_sp, ten"),
    docTatCa<{ id: string; san_pham_id: string; so_lo: string; han_dung: string; so_luong_nhap: number | null; trang_thai: string }>("kho_lo_hang", "id, san_pham_id, so_lo, han_dung, so_luong_nhap, trang_thai"),
    docTatCa<{ san_pham_id: string; so_lo: string | null; loai: string; so_luong: number; ngay: string }>("kho_nhap_xuat", "id, san_pham_id, so_lo, loai, so_luong, ngay"),
  ]);
  const ten = new Map(sp.map((s) => [s.id, `${s.ten} (${s.ma_sp})`]));
  const ds = tinhTonLo(
    lo.map((l) => ({ id: l.id, sanPhamId: l.san_pham_id, soLo: l.so_lo, hanDung: l.han_dung, soLuongNhap: l.so_luong_nhap, trangThai: l.trang_thai })),
    nx.map((d) => ({ sanPhamId: d.san_pham_id, soLo: d.so_lo, loai: d.loai, soLuong: d.so_luong, ngay: d.ngay })),
    homNay,
  );
  const goiY = goiYXuatTruoc(ds);
  const dem = (m: string) => ds.filter((l) => l.muc === m);
  const quaHan = dem("Quá hạn"), trong30 = dem("Trong 30 ngày"), trong90 = dem("Trong 90 ngày");
  const sl = (a: typeof ds) => a.reduce((t, l) => t + l.conLai, 0);
  const mau = (m: string) => (m === "Quá hạn" ? "text-loi" : m === "Trong 30 ngày" ? "text-canh-bao" : "text-muc-3");
  return (
    <>
      <TieuDeTrang tieuDe="Lô sắp hết hạn" phu="Cảnh báo lô quá hạn và sắp hết hạn, gợi ý xuất lô gần hết hạn trước. Số còn lại tính từ phiếu nhập xuất theo số lô.">
        <Link href="/hr/lo-hang-han-dung" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Sổ lô hàng</Link>
      </TieuDeTrang>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m={quaHan.length ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{quaHan.length}</div><div className="mt-1.5 text-[13px] text-muc-2">lô quá hạn còn hàng ({so(sl(quaHan))} sản phẩm), không được bán</div></li>
        <li data-m={trong30.length ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{trong30.length}</div><div className="mt-1.5 text-[13px] text-muc-2">lô hết hạn trong 30 ngày ({so(sl(trong30))} sản phẩm)</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{trong90.length}</div><div className="mt-1.5 text-[13px] text-muc-2">lô hết hạn trong 90 ngày ({so(sl(trong90))} sản phẩm)</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{ds.length}</div><div className="mt-1.5 text-[13px] text-muc-2">lô còn hàng đang theo dõi</div></li>
      </ul>
      <p className="mb-4 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">
        Còn lại của lô = phiếu nhập cùng số lô (chưa có phiếu nhập thì lấy số lượng nhập ghi ở lô) + điều chỉnh tăng − xuất − điều chỉnh giảm. Phiếu không ghi số lô không tính vào lô nào, nên khi xuất hàng hãy ghi số lô ở{" "}
        <Link href="/hr/nhap-xuat-kho" className="underline">Phiếu nhập xuất</Link>.
      </p>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có lô nào còn hàng. Thêm lô ở Sổ lô hàng và ghi phiếu nhập kèm số lô.</p>
        ) : (
          <table className="w-full min-w-[760px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">Số lô</th><th className="px-4 py-3">Hạn dùng</th><th className="px-4 py-3 text-right">Còn (ngày)</th><th className="px-4 py-3 text-right">Còn lại</th><th className="px-4 py-3">Tình trạng</th><th className="px-4 py-3">Gợi ý</th></tr></thead>
            <tbody>
              {ds.map((l) => (
                <tr key={l.id} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{ten.get(l.sanPhamId) ?? "—"}</td>
                  <td className="px-4 py-3">{l.soLo}</td>
                  <td className="px-4 py-3 tabular-nums">{ngayVN(l.hanDung)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${mau(l.muc)}`}>{l.ngayCon < 0 ? `quá ${so(-l.ngayCon)}` : so(l.ngayCon)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{so(l.conLai)}</td>
                  <td className={`px-4 py-3 text-[13px] ${mau(l.muc)}`}>{l.muc === "Còn lâu" ? "Ổn" : l.muc === "Quá hạn" ? "Quá hạn, huỷ hoặc trả" : `Hết hạn ${l.muc.toLowerCase()}`}</td>
                  <td className="px-4 py-3 text-[13px] text-muc-2">{goiY.get(l.sanPhamId)?.id === l.id ? "Xuất lô này trước" : l.muc === "Quá hạn" ? "Không bán" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
