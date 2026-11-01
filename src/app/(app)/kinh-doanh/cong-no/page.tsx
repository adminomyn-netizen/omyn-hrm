export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { tinhCongNo } from "@/lib/kinh-doanh";

/** Số dư công nợ từng đại lý, khách sỉ, tính từ các dòng phát sinh và đã thu. Không nhập tay. */
export default async function TrangCongNo() {
  await yeuCauQuyenSo("Kinh doanh");
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const [dl, cn] = await Promise.all([
    docTatCa<{ id: string; ten: string; han_muc_cong_no: number | null }>("kd_dai_ly", "id, ten, han_muc_cong_no"),
    docTatCa<{ dai_ly_id: string; ngay: string; loai: string; so_tien: number; han_thanh_toan: string | null }>("kd_cong_no_dai_ly", "id, dai_ly_id, ngay, loai, so_tien, han_thanh_toan"),
  ]);
  const ds = tinhCongNo(
    dl.map((d) => ({ id: d.id, ten: d.ten, hanMuc: d.han_muc_cong_no })),
    cn.map((d) => ({ daiLyId: d.dai_ly_id, ngay: d.ngay, loai: d.loai, soTien: d.so_tien, hanThanhToan: d.han_thanh_toan })),
    homNay,
  );
  const tongNo = ds.reduce((a, d) => a + Math.max(0, d.soDu), 0);
  const canChu = ds.filter((d) => d.vuotHanMuc || d.quaHan > 0).length;
  const tongQuaHan = ds.reduce((a, d) => a + d.quaHan, 0), tongDen7 = ds.reduce((a, d) => a + d.denHan7Ngay, 0);
  return (
    <>
      <TieuDeTrang tieuDe="Số dư công nợ đại lý" phu="Số dư = tổng phát sinh − tổng đã thu của từng đại lý, khách sỉ. Quá hạn tính bằng cách trừ tiền đã thu vào khoản nợ cũ nhất trước. Số lấy từ màn Công nợ đại lý, không nhập tay.">
        <Link href="/hr/cong-no-dai-ly" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi công nợ</Link>
      </TieuDeTrang>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tongNo)}</div><div className="mt-1.5 text-[13px] text-muc-2">tổng đang nợ</div></li>
        <li data-m={canChu > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{canChu}</div><div className="mt-1.5 text-[13px] text-muc-2">đại lý cần nhắc (quá hạn hoặc vượt hạn mức)</div></li>
        <li data-m={tongQuaHan > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tongQuaHan)}</div><div className="mt-1.5 text-[13px] text-muc-2">đã quá hạn thanh toán</div></li>
        <li data-m={tongDen7 > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tongDen7)}</div><div className="mt-1.5 text-[13px] text-muc-2">đến hạn trong 7 ngày tới</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có công nợ nào. Ghi khoản phát sinh đầu tiên ở màn Công nợ đại lý, số dư sẽ tự có.</p>
        ) : (
          <table className="w-full min-w-[720px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Đại lý, khách sỉ</th><th className="px-4 py-3 text-right">Phát sinh</th><th className="px-4 py-3 text-right">Đã thu</th><th className="px-4 py-3 text-right">Số dư</th><th className="px-4 py-3 text-right">Quá hạn</th><th className="px-4 py-3 text-right">Đến hạn 7 ngày</th><th className="px-4 py-3">Ghi chú</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.id} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{d.ten}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tienVN(d.phatSinh)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tienVN(d.daThu)}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${d.vuotHanMuc ? "text-loi" : "mau-chu"}`}>{tienVN(d.soDu)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${d.quaHan > 0 ? "text-loi" : "text-muc-3"}`}>{d.quaHan > 0 ? tienVN(d.quaHan) : "—"}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${d.denHan7Ngay > 0 ? "text-canh-bao" : "text-muc-3"}`}>{d.denHan7Ngay > 0 ? tienVN(d.denHan7Ngay) : "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-muc-3">{d.vuotHanMuc ? `Vượt hạn mức ${tienVN(d.hanMuc ?? 0)}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
