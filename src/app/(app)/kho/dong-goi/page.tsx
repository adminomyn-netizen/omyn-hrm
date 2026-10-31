export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { thongKeDongGoi } from "@/lib/kho";

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const thangKe = (t: string, n: number) => new Date(Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5)) - 1 + n, 1)).toISOString().slice(0, 7);
const TRANG_THAI = ["Chờ đóng", "Đã đóng", "Đã giao", "Hoàn hoặc trả"];

/** Thống kê đóng gói và giao hàng trong tháng: số đơn theo trạng thái, kênh, người đóng và tỷ lệ hoàn. Tự tính từ màn Đóng gói và giao hàng. */
export default async function TrangThongKeDongGoi({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  await yeuCauQuyenSo("Tài chính & Kho");
  const { thang: t } = await searchParams;
  const thang = t && THANG.test(t) ? t : new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 7);
  const dau = `${thang}-01`;
  const cuoi = `${thangKe(thang, 1)}-01`;
  const [don, nv] = await Promise.all([
    docTatCa<{ nguoi_dong_goi_id: string | null; kenh: string; trang_thai: string }>("kho_dong_goi_giao", "id, nguoi_dong_goi_id, kenh, trang_thai", (q) => q.gte("ngay", dau).lt("ngay", cuoi)),
    docTatCa<{ id: string; ho_ten: string }>("nhan_vien", "id, ho_ten"),
  ]);
  const r = thongKeDongGoi(don.map((d) => ({ nguoiId: d.nguoi_dong_goi_id, kenh: d.kenh, trangThai: d.trang_thai })), new Map(nv.map((n) => [n.id, n.ho_ten])));
  return (
    <>
      <TieuDeTrang tieuDe="Thống kê đóng gói" phu="Số đơn đóng gói và giao trong tháng. Tỷ lệ hoàn = đơn hoàn hoặc trả ÷ (đã giao + hoàn hoặc trả). Người đóng chỉ đếm đơn đã đóng trở đi. Số tự tính từ màn Đóng gói và giao hàng.">
        <Link href="/hr/dong-goi-giao-hang" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi đơn đóng gói</Link>
      </TieuDeTrang>
      <nav aria-label="Chọn tháng" className="mb-5 flex items-center gap-3 text-[14px]">
        <Link href={`?thang=${thangKe(thang, -1)}`} className="text-muc-2 underline-offset-4 hover:underline">← Tháng trước</Link>
        <span className="font-semibold text-muc">Tháng {thang.slice(5)}/{thang.slice(0, 4)}</span>
        <Link href={`?thang=${thangKe(thang, 1)}`} className="text-muc-2 underline-offset-4 hover:underline">Tháng sau →</Link>
      </nav>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{r.tong}</div><div className="mt-1.5 text-[13px] text-muc-2">tổng số đơn</div></li>
        {TRANG_THAI.map((tt, i) => (
          <li key={tt} data-m={[5, 3, 1, 9][i]} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{r.theoTrangThai[tt] ?? 0}</div><div className="mt-1.5 text-[13px] text-muc-2">{tt.toLowerCase()}</div></li>
        ))}
      </ul>
      <p className="mb-6 text-[14px] text-muc-2">Tỷ lệ hoàn hoặc trả: <span className="font-semibold text-muc">{r.tiLeHoan === null ? "chưa có đơn kết thúc" : `${r.tiLeHoan.toLocaleString("vi-VN")}%`}</span></p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
          <table className="w-full text-[14px]"><thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Người đóng gói</th><th className="px-4 py-3 text-right">Số đơn</th></tr></thead>
            <tbody>{r.theoNguoi.length === 0 ? <tr><td colSpan={2} className="px-4 py-4 text-muc-3">Chưa có đơn đã đóng trong tháng.</td></tr> : r.theoNguoi.map((n) => <tr key={n.nguoiId ?? "x"} className="border-t border-vien"><td className="px-4 py-3 text-muc">{n.ten}</td><td className="px-4 py-3 text-right tabular-nums">{n.so}</td></tr>)}</tbody></table>
        </section>
        <section data-m="5" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
          <table className="w-full text-[14px]"><thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Kênh</th><th className="px-4 py-3 text-right">Số đơn</th></tr></thead>
            <tbody>{r.theoKenh.length === 0 ? <tr><td colSpan={2} className="px-4 py-4 text-muc-3">Chưa có đơn nào trong tháng.</td></tr> : r.theoKenh.map((k) => <tr key={k.kenh} className="border-t border-vien"><td className="px-4 py-3 text-muc">{k.kenh}</td><td className="px-4 py-3 text-right tabular-nums">{k.so}</td></tr>)}</tbody></table>
        </section>
      </div>
    </>
  );
}
