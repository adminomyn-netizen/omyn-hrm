export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { doiChieuDonSi } from "@/lib/kinh-doanh";

/** Đối chiếu đơn bán sỉ: tổng các dòng hàng (đã trừ chiết khấu) so với giá trị đơn đã ghi. Số tự tính, không nhập tay. */
export default async function TrangDoiChieuDonSi() {
  await yeuCauQuyenSo("Kinh doanh");
  const [don, dong] = await Promise.all([
    docTatCa<{ id: string; ma_don: string; gia_tri: number }>("kd_don_si", "id, ma_don, gia_tri"),
    docTatCa<{ don_si_id: string; so_luong: number; don_gia: number; chiet_khau: number }>("kd_don_si_dong", "id, don_si_id, so_luong, don_gia, chiet_khau"),
  ]);
  const ds = doiChieuDonSi(
    don.map((d) => ({ id: d.id, ma: d.ma_don, giaTri: d.gia_tri })),
    dong.map((d) => ({ donSiId: d.don_si_id, soLuong: d.so_luong, donGia: d.don_gia, chietKhau: d.chiet_khau })),
  );
  const chuaCoDong = ds.filter((d) => d.soDong === 0).length;
  const lech = ds.filter((d) => d.lech !== null && d.lech !== 0).length;
  return (
    <>
      <TieuDeTrang tieuDe="Đối chiếu đơn bán sỉ" phu="Thành tiền mỗi dòng = số lượng × đơn giá × (100 − chiết khấu %). Tổng các dòng được so với giá trị đơn đã ghi; lệch thì cần sửa một trong hai chỗ.">
        <Link href="/hr/don-si-dong-hang" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Thêm dòng hàng</Link>
      </TieuDeTrang>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{ds.length}</div><div className="mt-1.5 text-[13px] text-muc-2">đơn sỉ</div></li>
        <li data-m={lech > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{lech}</div><div className="mt-1.5 text-[13px] text-muc-2">đơn lệch tiền so với dòng hàng</div></li>
        <li data-m={chuaCoDong > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{chuaCoDong}</div><div className="mt-1.5 text-[13px] text-muc-2">đơn chưa có dòng hàng</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có đơn sỉ nào. Tạo đơn ở màn Đơn bán sỉ, rồi thêm dòng hàng cho từng đơn.</p>
        ) : (
          <table className="w-full min-w-[640px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Mã đơn</th><th className="px-4 py-3 text-right">Số dòng</th><th className="px-4 py-3 text-right">Tổng dòng hàng</th><th className="px-4 py-3 text-right">Giá trị đơn</th><th className="px-4 py-3">Đối chiếu</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.id} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{d.ma}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.soDong}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.soDong ? tienVN(d.tongDong) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tienVN(d.giaTri)}</td>
                  <td className={`px-4 py-3 text-[13px] ${d.lech === null || d.lech === 0 ? "text-muc-3" : "text-loi"}`}>{d.lech === null ? "Chưa có dòng hàng" : d.lech === 0 ? "Khớp" : `Đơn ${d.lech > 0 ? "cao hơn" : "thấp hơn"} dòng hàng ${tienVN(Math.abs(d.lech))}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
