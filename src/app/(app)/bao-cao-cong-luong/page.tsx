export const dynamic = "force-dynamic";

import { yeuCauVaiTro } from "@/lib/auth";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { layDuLieuLuongBc } from "@/lib/bao-cao-luong-data";
import { quyLuongTheoKhoi, tongTheoKy } from "@/lib/bao-cao-luong";

const TIEN = (v: number) => `${Math.round(v).toLocaleString("vi-VN")} đ`;
const PT = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toLocaleString("vi-VN")}%`);

/** Báo cáo công lương: tổng từng kỳ lương (người, thu nhập, thực lĩnh, bảo hiểm, thuế, chi phí công ty) và quỹ lương theo khối của kỳ mới nhất. Chỉ Quản trị/Kỹ thuật. */
export default async function TrangBaoCaoCongLuong() {
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const { ky, dong } = await layDuLieuLuongBc();
  const ds = tongTheoKy(ky, dong);
  const moi = ds[ds.length - 1];
  const khoi = moi ? quyLuongTheoKhoi(dong, moi.id) : [];
  return (
    <>
      <TieuDeTrang tieuDe="Báo cáo công lương" phu={moi ? `Kỳ mới nhất ${moi.ten}: ${moi.soNguoi} người, thực lĩnh ${TIEN(moi.thucLinh)}.` : "Chưa có kỳ lương nào. Lập bảng lương ở màn Bảng lương, báo cáo sẽ tự có số."} />
      {ds.length > 0 && (
        <div className="space-y-5">
          <section className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto" data-m="7">
            <h2 className="mau-chu px-4 pt-4 text-[15px] font-semibold">Theo kỳ lương</h2>
            <table className="w-full min-w-[820px] text-[14px]">
              <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Kỳ</th><th className="px-4 py-3 text-right">Người</th><th className="px-4 py-3 text-right">Tổng thu nhập</th><th className="px-4 py-3 text-right">Thực lĩnh</th><th className="px-4 py-3 text-right">BH người LĐ</th><th className="px-4 py-3 text-right">BH công ty</th><th className="px-4 py-3 text-right">Thuế TNCN</th><th className="px-4 py-3 text-right">Chi phí công ty</th><th className="px-4 py-3 text-right">So kỳ trước</th></tr></thead>
              <tbody>
                {[...ds].reverse().map((k) => (
                  <tr key={k.id} className="border-t border-vien">
                    <td className="px-4 py-3 font-medium text-muc">{k.ten}<span className="block text-[12px] font-normal text-muc-3">{k.trangThai}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums">{k.soNguoi}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{TIEN(k.tongThuNhap)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{TIEN(k.thucLinh)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{TIEN(k.bhNld)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{TIEN(k.bhCty)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{TIEN(k.thue)}</td>
                    <td className="mau-chu px-4 py-3 text-right font-semibold tabular-nums">{TIEN(k.chiPhiCty)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{PT(k.doiChiPhi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {moi && (
            <section className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto self-start" data-m="7">
              <h2 className="mau-chu px-4 pt-4 text-[15px] font-semibold">Quỹ lương theo khối, {moi.ten}</h2>
              <table className="w-full min-w-[480px] text-[14px]">
                <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Khối</th><th className="px-4 py-3 text-right">Người</th><th className="px-4 py-3 text-right">Tổng thu nhập</th><th className="px-4 py-3 text-right">Chi phí công ty</th></tr></thead>
                <tbody>
                  {khoi.map((k) => (
                    <tr key={k.khoi} className="border-t border-vien"><td className="px-4 py-2.5">{k.khoi}</td><td className="px-4 py-2.5 text-right tabular-nums">{k.soNguoi}</td><td className="px-4 py-2.5 text-right tabular-nums">{TIEN(k.tongThuNhap)}</td><td className="px-4 py-2.5 text-right tabular-nums">{TIEN(k.chiPhiCty)}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          <p className="text-[12.5px] text-muc-3">Chi phí công ty = tổng thu nhập + bảo hiểm công ty đóng. Số liệu lấy thẳng từ Bảng lương đã tính, không nhập tay.</p>
        </div>
      )}
    </>
  );
}
