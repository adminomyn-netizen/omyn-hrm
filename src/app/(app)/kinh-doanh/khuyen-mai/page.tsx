export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NgayChon } from "@/components/ui/NgayChon";
import { docTatCa } from "@/lib/hr-db";
import { tienVN, ngayVN } from "@/lib/dinh-dang";
import { ngayHomNayHCM } from "@/lib/data";
import { hieuQuaKhuyenMai, trangThaiVoucher, type Voucher } from "@/lib/khuyen-mai";

const laNgay = (s: string | undefined) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const pt = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("vi-VN")}%`);

/** Hiệu quả khuyến mãi theo kênh và theo voucher trong kỳ. Số tự tính từ sổ dùng voucher, không nhập tay. */
export default async function TrangKhuyenMai({ searchParams }: { searchParams: Promise<{ tu?: string; den?: string }> }) {
  await yeuCauQuyenSo("Kinh doanh");
  const homNay = ngayHomNayHCM();
  const q = await searchParams;
  let tu = laNgay(q.tu) ? (q.tu as string) : `${homNay.slice(0, 8)}01`;
  let den = laNgay(q.den) ? (q.den as string) : homNay;
  if (tu > den) [tu, den] = [den, tu];
  const [vr, dr] = await Promise.all([
    docTatCa<Record<string, unknown>>("kd_voucher", "*"),
    docTatCa<{ voucher_id: string; khach_le_id: string | null; ngay: string; kenh: string; so_tien_don: number; so_tien_giam: number }>("kd_voucher_dung", "id, voucher_id, khach_le_id, ngay, kenh, so_tien_don, so_tien_giam"),
  ]);
  const vs: Voucher[] = vr.map((r) => ({
    id: String(r.id), ma: String(r.ma), loai: String(r.loai), giaTri: Number(r.gia_tri), giamToiDa: r.giam_toi_da == null ? null : Number(r.giam_toi_da), donToiThieu: Number(r.don_toi_thieu),
    kenh: String(r.kenh), tuNgay: String(r.tu_ngay), denNgay: String(r.den_ngay), gioiHanLuot: r.gioi_han_luot == null ? null : Number(r.gioi_han_luot),
    gioiHanMoiKhach: r.gioi_han_moi_khach == null ? null : Number(r.gioi_han_moi_khach), bat: Boolean(r.bat),
  }));
  const dung = dr.map((d) => ({ voucherId: d.voucher_id, khachId: d.khach_le_id, ngay: d.ngay, kenh: d.kenh, soTienDon: d.so_tien_don, soTienGiam: d.so_tien_giam }));
  const hq = hieuQuaKhuyenMai(vs, dung, tu, den);
  const tong = hq.theoKenh.reduce((a, k) => ({ luot: a.luot + k.luot, doanhThu: a.doanhThu + k.doanhThu, giam: a.giam + k.giam }), { luot: 0, doanhThu: 0, giam: 0 });
  const soLanDung = (id: string) => dung.filter((d) => d.voucherId === id).length;
  const tt = [...vs].sort((a, b) => (a.denNgay < b.denNgay ? 1 : -1)).map((v) => ({ v, t: trangThaiVoucher(v, soLanDung(v.id), homNay) }));
  const mau = (t: string) => (t === "Đang chạy" ? "text-muc" : t === "Hết lượt" ? "text-canh-bao" : "text-muc-3");
  return (
    <>
      <TieuDeTrang tieuDe="Hiệu quả khuyến mãi" phu="Số lượt dùng, doanh thu của các đơn có voucher và tiền đã giảm, theo kênh và theo voucher. Số lấy từ sổ dùng voucher.">
        <Link href="/hr/voucher-dung" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi lần dùng voucher</Link>
      </TieuDeTrang>
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 text-[13px] text-muc-2">
        <div className="flex flex-col gap-1"><label htmlFor="tu">Từ ngày</label><NgayChon id="tu" ten="tu" giaTriMacDinh={tu} batBuoc /></div>
        <div className="flex flex-col gap-1"><label htmlFor="den">Đến ngày</label><NgayChon id="den" ten="den" giaTriMacDinh={den} batBuoc /></div>
        <button type="submit" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Xem kỳ này</button>
      </form>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tong.luot}</div><div className="mt-1.5 text-[13px] text-muc-2">lượt dùng voucher</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tong.doanhThu)}</div><div className="mt-1.5 text-[13px] text-muc-2">doanh thu các đơn có voucher</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(tong.giam)}</div><div className="mt-1.5 text-[13px] text-muc-2">tiền đã giảm (chi phí khuyến mãi)</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tong.doanhThu > 0 ? pt(Math.round((tong.giam / tong.doanhThu) * 1000) / 10) : "—"}</div><div className="mt-1.5 text-[13px] text-muc-2">giảm trên doanh thu đơn</div></li>
      </ul>
      <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Theo kênh</h2>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
        {hq.theoKenh.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Kỳ này chưa có lần dùng voucher nào.</p> : (
          <table className="w-full min-w-[560px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Kênh</th><th className="px-4 py-3 text-right">Lượt</th><th className="px-4 py-3 text-right">Doanh thu đơn</th><th className="px-4 py-3 text-right">Đã giảm</th><th className="px-4 py-3 text-right">Giảm / doanh thu</th></tr></thead>
            <tbody>{hq.theoKenh.map((k) => <tr key={k.kenh} className="border-t border-vien"><td className="px-4 py-3 font-medium text-muc">{k.kenh}</td><td className="px-4 py-3 text-right tabular-nums">{k.luot}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(k.doanhThu)}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(k.giam)}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{pt(k.phanTramGiam)}</td></tr>)}</tbody>
          </table>
        )}
      </section>
      <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Theo voucher</h2>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
        {hq.theoVoucher.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Kỳ này chưa voucher nào được dùng.</p> : (
          <table className="w-full min-w-[620px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Mã</th><th className="px-4 py-3 text-right">Lượt</th><th className="px-4 py-3 text-right">Doanh thu đơn</th><th className="px-4 py-3 text-right">Đã giảm</th><th className="px-4 py-3 text-right">Giảm / doanh thu</th><th className="px-4 py-3 text-right">Còn lượt</th></tr></thead>
            <tbody>{hq.theoVoucher.map((v) => <tr key={v.voucherId} className="border-t border-vien"><td className="px-4 py-3 font-medium text-muc">{v.ma}</td><td className="px-4 py-3 text-right tabular-nums">{v.luot}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(v.doanhThu)}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(v.giam)}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{pt(v.phanTramGiam)}</td><td className="px-4 py-3 text-right tabular-nums text-muc-3">{v.conLuot === null ? "không giới hạn" : v.conLuot}</td></tr>)}</tbody>
          </table>
        )}
      </section>
      <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Tình trạng các voucher</h2>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {tt.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có voucher nào. <Link href="/hr/voucher" className="underline">Tạo voucher</Link>.</p> : (
          <table className="w-full min-w-[620px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Mã</th><th className="px-4 py-3">Kênh</th><th className="px-4 py-3">Thời hạn</th><th className="px-4 py-3 text-right">Đã dùng</th><th className="px-4 py-3">Tình trạng</th></tr></thead>
            <tbody>{tt.map(({ v, t }) => <tr key={v.id} className="border-t border-vien"><td className="px-4 py-3 font-medium text-muc">{v.ma}</td><td className="px-4 py-3 text-muc-3">{v.kenh}</td><td className="px-4 py-3 tabular-nums">{ngayVN(v.tuNgay)} – {ngayVN(v.denNgay)}</td><td className="px-4 py-3 text-right tabular-nums">{soLanDung(v.id)}{v.gioiHanLuot !== null ? `/${v.gioiHanLuot}` : ""}</td><td className={`px-4 py-3 text-[13px] ${mau(t)}`}>{t}</td></tr>)}</tbody>
          </table>
        )}
      </section>
      <p className="mt-4 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">Đây là chi phí khuyến mãi đã ghi. App chưa so với doanh thu nếu không có voucher nên chưa kết luận chương trình có lời hay không.</p>
    </>
  );
}
