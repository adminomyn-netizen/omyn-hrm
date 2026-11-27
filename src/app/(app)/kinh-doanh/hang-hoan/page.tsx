export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Badge } from "@/components/ui/Badge";
import { docTatCa } from "@/lib/hr-db";
import { ngayVN, tienVN } from "@/lib/dinh-dang";

type Don = { id: string; ma_don: string; kenh: string; ngay: string; gia_tri: number; trang_thai: string };
type Hoan = { id: string; don_le_id: string; ngay_hoan: string; so_tien_hoan: number | null; tinh_trang_hang: string; ma_van_don_hoan: string | null };
const homNay = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
const soNgay = (tu: string, den: string) => Math.max(0, Math.round((Date.parse(den) - Date.parse(tu)) / 86_400_000));

/** Đơn hoàn cần làm gì tiếp: đơn đã Hoàn trả mà chưa ghi chi tiết hoàn, và hàng hoàn chưa về hoặc nhận thiếu. Số lấy từ Sổ đơn lẻ và Đơn hoàn, không nhập tay. */
export default async function TrangHangHoan() {
  await yeuCauQuyenSo("Kinh doanh");
  const hn = homNay(), dauThang = `${hn.slice(0, 7)}-01`;
  const [don, hoan] = await Promise.all([
    docTatCa<Don>("kd_don_le", "id, ma_don, kenh, ngay, gia_tri, trang_thai"),
    docTatCa<Hoan>("kd_don_hoan", "id, don_le_id, ngay_hoan, so_tien_hoan, tinh_trang_hang, ma_van_don_hoan"),
  ]);
  const donTheoId = new Map(don.map((d) => [d.id, d]));
  const daGhi = new Set(hoan.map((h) => h.don_le_id));
  const chuaGhi = don.filter((d) => d.trang_thai === "Hoàn trả" && !daGhi.has(d.id)).sort((a, b) => b.ngay.localeCompare(a.ngay));
  const chuaVe = hoan.filter((h) => h.tinh_trang_hang === "Chờ hàng về" || h.tinh_trang_hang === "Nhận thiếu").sort((a, b) => a.ngay_hoan.localeCompare(b.ngay_hoan));
  const hoanThang = hoan.filter((h) => h.ngay_hoan >= dauThang);
  const tienHoanThang = hoanThang.reduce((a, h) => a + (h.so_tien_hoan ?? 0), 0);
  const donThang = don.filter((d) => d.ngay >= dauThang);
  const donHoanThang = donThang.filter((d) => d.trang_thai === "Hoàn trả").length;
  const tyLe = donThang.length > 0 ? Math.round((donHoanThang / donThang.length) * 1000) / 10 : null;
  const the = [
    { v: String(chuaGhi.length), n: "đơn Hoàn trả chưa ghi chi tiết", m: chuaGhi.length > 0 ? 3 : 1 },
    { v: String(chuaVe.length), n: "hàng hoàn chưa về hoặc nhận thiếu", m: chuaVe.length > 0 ? 3 : 1 },
    { v: tienVN(tienHoanThang), n: `tiền hoàn trong tháng (${hoanThang.length} lần hoàn)`, m: 7 },
    { v: tyLe === null ? "—" : `${tyLe.toLocaleString("vi-VN")}%`, n: tyLe === null ? "tỷ lệ hoàn tháng này (chưa có đơn)" : `đơn Hoàn trả / đơn tháng này (${donHoanThang}/${donThang.length})`, m: 7 },
  ];
  return (
    <>
      <TieuDeTrang tieuDe="Hàng hoàn cần xử lý" phu="Đơn đã chuyển Hoàn trả mà chưa ghi chi tiết hoàn, và hàng hoàn chưa về hoặc nhận thiếu. Số lấy từ Sổ đơn lẻ và Đơn hoàn, không nhập tay.">
        <Link href="/hr/don-hoan" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi đơn hoàn</Link>
      </TieuDeTrang>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {the.map((o) => (
          <li key={o.n} data-m={o.m} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[24px] leading-none">{o.v}</div><div className="mt-1.5 text-[13px] text-muc-2">{o.n}</div></li>
        ))}
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto" aria-label="Đơn Hoàn trả chưa ghi chi tiết">
        <h2 className="chu-tieu-de px-4 pt-4 text-[16px]">Đơn Hoàn trả chưa ghi chi tiết</h2>
        {chuaGhi.length === 0 ? <p className="px-4 py-5 text-[14px] text-muc-3">Không có. Mọi đơn Hoàn trả đã có dòng trong Đơn hoàn.</p> : (
          <table className="w-full min-w-[560px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Mã đơn</th><th className="px-4 py-3">Kênh</th><th className="px-4 py-3">Ngày đơn</th><th className="px-4 py-3 text-right">Giá trị</th></tr></thead>
            <tbody>{chuaGhi.slice(0, 100).map((d) => (
              <tr key={d.id} className="border-t border-vien"><td className="px-4 py-3 font-medium text-muc">{d.ma_don}</td><td className="px-4 py-3 text-muc-2">{d.kenh}</td><td className="px-4 py-3 text-muc-2">{ngayVN(d.ngay)}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(d.gia_tri)}</td></tr>
            ))}</tbody>
          </table>
        )}
      </section>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mt-6 overflow-x-auto" aria-label="Hàng hoàn chưa về">
        <h2 className="chu-tieu-de px-4 pt-4 text-[16px]">Hàng hoàn chưa về hoặc nhận thiếu</h2>
        {chuaVe.length === 0 ? <p className="px-4 py-5 text-[14px] text-muc-3">Không có.</p> : (
          <table className="w-full min-w-[640px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Mã đơn</th><th className="px-4 py-3">Tình trạng</th><th className="px-4 py-3">Mã vận đơn hoàn</th><th className="px-4 py-3">Ngày hoàn</th><th className="px-4 py-3 text-right">Đã chờ</th><th className="px-4 py-3 text-right">Tiền hoàn</th></tr></thead>
            <tbody>{chuaVe.slice(0, 100).map((h) => (
              <tr key={h.id} className="border-t border-vien">
                <td className="px-4 py-3 font-medium text-muc">{donTheoId.get(h.don_le_id)?.ma_don ?? "—"}</td>
                <td className="px-4 py-3"><Badge mau={h.tinh_trang_hang === "Nhận thiếu" ? "do" : "vang"}>{h.tinh_trang_hang}</Badge></td>
                <td className="px-4 py-3 text-muc-2">{h.ma_van_don_hoan ?? "—"}</td>
                <td className="px-4 py-3 text-muc-2">{ngayVN(h.ngay_hoan)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{soNgay(h.ngay_hoan, hn)} ngày</td>
                <td className="px-4 py-3 text-right tabular-nums">{h.so_tien_hoan === null ? "—" : tienVN(h.so_tien_hoan)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
      <p className="mt-4 text-[13px] text-muc-3">Lưu ý: khi đổi đơn lẻ sang Hoàn trả, kho tự coi hàng đã về và cộng lại tồn. Nếu hàng còn chờ về thì tồn kho đang cao hơn thực tế đến khi hàng về; theo dõi ở bảng trên.</p>
    </>
  );
}
