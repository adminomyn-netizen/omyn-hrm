export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { tinhCongNo } from "@/lib/kinh-doanh";

/** Số dư phải trả từng nhà cung cấp, tính từ các dòng phát sinh và đã trả. Không nhập tay. */
export default async function TrangCongNoNcc() {
  await yeuCauQuyenSo("Tài chính & Kho");
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const cn = await docTatCa<{ nha_cung_cap: string; ngay: string; loai: string; so_tien: number; han_thanh_toan: string | null }>("tc_cong_no_ncc", "id, nha_cung_cap, ngay, loai, so_tien, han_thanh_toan");
  const ten = [...new Set(cn.map((d) => d.nha_cung_cap.trim()))];
  const ds = tinhCongNo(
    ten.map((t) => ({ id: t, ten: t, hanMuc: null })),
    cn.map((d) => ({ daiLyId: d.nha_cung_cap.trim(), ngay: d.ngay, loai: d.loai, soTien: d.so_tien, hanThanhToan: d.han_thanh_toan })),
    homNay,
    "Đã trả",
  );
  const tongNo = ds.reduce((a, d) => a + Math.max(0, d.soDu), 0);
  const quaHan = ds.reduce((a, d) => a + d.quaHan, 0);
  return (
    <>
      <TieuDeTrang tieuDe="Số dư phải trả nhà cung cấp" phu="Số dư = tổng phát sinh − tổng đã trả của từng nhà cung cấp. Quá hạn tính bằng cách trừ tiền đã trả vào khoản nợ cũ nhất trước. Tên nhà cung cấp gõ khác nhau (thừa chữ, khác hoa thường) sẽ thành hai dòng, nên gõ thống nhất ở màn Công nợ nhà cung cấp.">
        <Link href="/hr/cong-no-nha-cung-cap" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi công nợ</Link>
      </TieuDeTrang>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tongNo)}</div><div className="mt-1.5 text-[13px] text-muc-2">tổng phải trả</div></li>
        <li data-m={quaHan > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(quaHan)}</div><div className="mt-1.5 text-[13px] text-muc-2">đã quá hạn thanh toán</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có công nợ nhà cung cấp nào. Ghi khoản phát sinh đầu tiên ở màn Công nợ nhà cung cấp, số dư sẽ tự có.</p>
        ) : (
          <table className="w-full min-w-[560px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Nhà cung cấp</th><th className="px-4 py-3 text-right">Phát sinh</th><th className="px-4 py-3 text-right">Đã trả</th><th className="px-4 py-3 text-right">Còn phải trả</th><th className="px-4 py-3 text-right">Quá hạn</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.id} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{d.ten}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tienVN(d.phatSinh)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tienVN(d.daThu)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums mau-chu">{tienVN(d.soDu)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${d.quaHan > 0 ? "text-loi" : "text-muc-3"}`}>{d.quaHan > 0 ? tienVN(d.quaHan) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
