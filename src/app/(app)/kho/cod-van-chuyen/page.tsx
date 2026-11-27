export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN, ngayVN } from "@/lib/dinh-dang";
import { ngayHomNayHCM } from "@/lib/data";
import { doiSoatCod } from "@/lib/kho";
import { NhapDoiSoatVanChuyen } from "@/components/kho/NhapDoiSoatVanChuyen";

const nguyen = (s: string | undefined, mac: number) => { const n = Number(s); return Number.isInteger(n) && n >= 1 && n <= 180 ? n : mac; };

/** Đối soát COD theo đơn vị vận chuyển: tiền thu hộ, đã nhận, còn treo, đơn quá hạn. Số tự tính từ sổ đóng gói và giao hàng. */
export default async function TrangCod({ searchParams }: { searchParams: Promise<{ han?: string }> }) {
  const { chiXem } = await yeuCauQuyenSo("Tài chính & Kho");
  const han = nguyen((await searchParams).han, 7);
  const homNay = ngayHomNayHCM();
  const dr = await docTatCa<{ id: string; ma_don: string; don_vi_van_chuyen: string | null; trang_thai: string; ngay: string; ngay_giao: string | null; thu_ho: number; cod_da_nhan: number; phi_van_chuyen: number | null }>(
    "kho_dong_goi_giao", "id, ma_don, don_vi_van_chuyen, trang_thai, ngay, ngay_giao, thu_ho, cod_da_nhan, phi_van_chuyen");
  const r = doiSoatCod(dr.map((d) => ({ id: d.id, ma: d.ma_don, donVi: d.don_vi_van_chuyen ?? "", trangThai: d.trang_thai, ngay: d.ngay, ngayGiao: d.ngay_giao, thuHo: d.thu_ho, daNhan: d.cod_da_nhan, phi: d.phi_van_chuyen })), homNay, han);
  const tong = r.theoDonVi.reduce((a, d) => ({ thuHo: a.thuHo + d.thuHo, daNhan: a.daNhan + d.daNhan, conTreo: a.conTreo + d.conTreo, phi: a.phi + d.phi, thieuPhi: a.thieuPhi + d.soDonThieuPhi }), { thuHo: 0, daNhan: 0, conTreo: 0, phi: 0, thieuPhi: 0 });
  return (
    <>
      <TieuDeTrang tieuDe="Đối soát COD vận chuyển" phu="Chỉ đơn đã giao có tiền thu hộ mới là khoản phải thu. Còn treo = thu hộ − đã nhận. Số lấy từ sổ Đóng gói và giao hàng.">
        <Link href="/hr/dong-goi-giao-hang" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Cập nhật đơn</Link>
      </TieuDeTrang>
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 text-[13px] text-muc-2">
        <label className="flex flex-col gap-1">Quá hạn nếu chưa nhận COD sau (ngày kể từ ngày giao)<input type="number" name="han" min={1} max={180} defaultValue={han} className="w-28 rounded-nho border border-vien px-3 py-2 text-[14px] text-muc" /></label>
        <button type="submit" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Tính lại</button>
      </form>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tong.thuHo)}</div><div className="mt-1.5 text-[13px] text-muc-2">COD phải thu (đơn đã giao)</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tong.daNhan)}</div><div className="mt-1.5 text-[13px] text-muc-2">đã nhận về</div></li>
        <li data-m={tong.conTreo > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tong.conTreo)}</div><div className="mt-1.5 text-[13px] text-muc-2">còn treo ở đơn vị vận chuyển</div></li>
        <li data-m={r.quaHan.length > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{r.quaHan.length}</div><div className="mt-1.5 text-[13px] text-muc-2">đơn quá {han} ngày chưa nhận COD</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
        {r.theoDonVi.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có đơn đã giao hoặc hoàn trả nào. Cập nhật trạng thái đơn ở màn Đóng gói và giao hàng.</p> : (
          <table className="w-full min-w-[760px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Đơn vị vận chuyển</th><th className="px-4 py-3 text-right">Đơn</th><th className="px-4 py-3 text-right">Thu hộ</th><th className="px-4 py-3 text-right">Đã nhận</th><th className="px-4 py-3 text-right">Còn treo</th><th className="px-4 py-3 text-right">Quá hạn</th><th className="px-4 py-3 text-right">Phí vận chuyển</th></tr></thead>
            <tbody>{r.theoDonVi.map((d) => <tr key={d.donVi} className="border-t border-vien"><td className="px-4 py-3 font-medium text-muc">{d.donVi}</td><td className="px-4 py-3 text-right tabular-nums">{d.soDon}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(d.thuHo)}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(d.daNhan)}</td><td className={`px-4 py-3 text-right font-semibold tabular-nums ${d.conTreo > 0 ? "text-canh-bao" : ""}`}>{tienVN(d.conTreo)}</td><td className={`px-4 py-3 text-right tabular-nums ${d.soDonQuaHan > 0 ? "text-loi" : "text-muc-3"}`}>{d.soDonQuaHan || "—"}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(d.phi)}{d.soDonThieuPhi > 0 && <span className="ml-1 text-[12px] text-muc-3">({d.soDonThieuPhi} đơn chưa ghi phí)</span>}</td></tr>)}</tbody>
          </table>
        )}
      </section>
      {r.quaHan.length > 0 && (
        <>
          <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Đơn quá hạn chưa nhận COD</h2>
          <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[14px]">
              <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Mã đơn</th><th className="px-4 py-3">Đơn vị</th><th className="px-4 py-3">Ngày giao</th><th className="px-4 py-3 text-right">Quá (ngày)</th><th className="px-4 py-3 text-right">Còn treo</th></tr></thead>
              <tbody>{r.quaHan.map((d) => <tr key={d.id} className="border-t border-vien"><td className="px-4 py-3 font-medium text-muc">{d.ma}</td><td className="px-4 py-3 text-muc-3">{d.donVi}</td><td className="px-4 py-3 tabular-nums">{ngayVN(d.ngayGiao)}</td><td className="px-4 py-3 text-right tabular-nums text-loi">{d.soNgay - han}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(d.conTreo)}</td></tr>)}</tbody>
            </table>
          </section>
        </>
      )}
      {!chiXem && (
        <section className="mb-6" aria-label="Nhập đối soát của đơn vị vận chuyển">
          <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Nhập đối soát của đơn vị vận chuyển</h2>
          <p className="mb-3 text-[13px] text-muc-2">Khớp theo mã vận đơn ghi ở sổ Đóng gói và giao hàng, rồi cập nhật COD đã nhận, ngày nhận và phí vận chuyển. Bắt buộc có cột Mã vận đơn và COD đã chuyển; tuỳ chọn COD thu hộ (để so với sổ), Phí vận chuyển, Ngày chuyển tiền. Số trong file ghi đè số đã nhận của đơn; nhập lại cùng file cho cùng kết quả.</p>
          <NhapDoiSoatVanChuyen />
        </section>
      )}
      {r.nhanDu.length > 0 && <p className="mb-4 rounded-nho border border-vien px-4 py-3 text-[13px] text-canh-bao">Đơn nhận nhiều hơn tiền thu hộ, cần xem lại: {r.nhanDu.map((d) => d.ma).join(", ")}.</p>}
      <p className="rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">Số ngày quá hạn mặc định 7 là TẠM, chỉnh ở ô trên. Đơn thiếu ngày giao thì tính từ ngày đơn. Đơn hoàn hoặc trả không tính là khoản phải thu.</p>
    </>
  );
}
