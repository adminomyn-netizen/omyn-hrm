export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN, ngayVN } from "@/lib/dinh-dang";
import { tongHopPhienLive } from "@/lib/bao-cao-live";

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const thangKe = (t: string, n: number) => new Date(Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5)) - 1 + n, 1)).toISOString().slice(0, 7);
const tien = (n: number | null) => (n === null ? "—" : tienVN(n));
const so = (n: number | null) => (n === null ? "—" : n.toLocaleString("vi-VN"));

type Phien = { id: string; ngay: string; nen_tang: string; chu_de: string; host_id: string | null; trang_thai: string; doanh_thu: number | null; so_don: number | null; muc_tieu_doanh_thu: number | null; chi_phi_quang_cao: number | null; gio_bat_dau: string | null; gio_ket_thuc: string | null; luot_xem: number | null };

/** Báo cáo livestream trong tháng: doanh thu từng phiên (từ đơn gắn vào phiên, không có thì số ghi tay), % mục tiêu, doanh thu trên chi phí quảng cáo, theo host. Thiếu số thì ghi "—". */
export default async function TrangBaoCaoLive({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  await yeuCauQuyenSo("Kinh doanh");
  const { thang: t } = await searchParams;
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const thang = t && THANG.test(t) ? t : homNay.slice(0, 7);
  const dau = `${thang}-01`, cuoi = `${thangKe(thang, 1)}-01`;
  const [phien, nv] = await Promise.all([
    docTatCa<Phien>("kd_phien_live", "id, ngay, nen_tang, chu_de, host_id, trang_thai, doanh_thu, so_don, muc_tieu_doanh_thu, chi_phi_quang_cao, gio_bat_dau, gio_ket_thuc, luot_xem", (q) => q.gte("ngay", dau).lt("ngay", cuoi), ["ngay", "id"]),
    docTatCa<{ id: string; ho_ten: string }>("nhan_vien", "id, ho_ten"),
  ]);
  const don: { phien_live_id: string; gia_tri: number; trang_thai: string }[] = [];
  const ids = phien.map((p) => p.id);
  for (let i = 0; i < ids.length; i += 100) don.push(...(await docTatCa<{ phien_live_id: string; gia_tri: number; trang_thai: string }>("kd_don_le", "id, phien_live_id, gia_tri, trang_thai", (q) => q.in("phien_live_id", ids.slice(i, i + 100)))));
  phien.sort((a, b) => (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : 0));
  const tenNv = new Map(nv.map((n) => [n.id, n.ho_ten]));
  const r = tongHopPhienLive(
    phien.map((p) => ({ id: p.id, ngay: p.ngay, nenTang: p.nen_tang, chuDe: p.chu_de, hostId: p.host_id, trangThai: p.trang_thai, doanhThuGhiTay: p.doanh_thu === null ? null : Number(p.doanh_thu), soDonGhiTay: p.so_don, mucTieu: p.muc_tieu_doanh_thu === null ? null : Number(p.muc_tieu_doanh_thu), chiPhiQuangCao: p.chi_phi_quang_cao === null ? null : Number(p.chi_phi_quang_cao), gioBatDau: p.gio_bat_dau, gioKetThuc: p.gio_ket_thuc, luotXem: p.luot_xem })),
    don.map((d) => ({ phienId: d.phien_live_id, giaTri: Number(d.gia_tri), trangThai: d.trang_thai })),
  );
  const host = (id: string | null) => (id ? (tenNv.get(id) ?? "Nhân viên đã xoá") : "Chưa ghi host");
  return (
    <>
      <TieuDeTrang tieuDe="Báo cáo livestream" phu="Chỉ tính phiên đã live. Doanh thu phiên lấy từ các đơn gắn vào phiên (trừ huỷ và hoàn trả); chưa gắn đơn thì dùng số ghi tay. Doanh thu ÷ chi phí quảng cáo chỉ tính khi đã ghi chi phí. Thiếu số thì ghi “—”, không đoán.">
        <Link href="/hr/phien-livestream" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi phiên live</Link>
      </TieuDeTrang>
      <nav aria-label="Chọn tháng" className="mb-5 flex items-center gap-3 text-[14px]">
        <Link href={`?thang=${thangKe(thang, -1)}`} className="text-muc-2 underline-offset-4 hover:underline">← Tháng trước</Link>
        <span className="font-semibold text-muc">Tháng {thang.slice(5)}/{thang.slice(0, 4)}</span>
        <Link href={`?thang=${thangKe(thang, 1)}`} className="text-muc-2 underline-offset-4 hover:underline">Tháng sau →</Link>
      </nav>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{r.soPhienDaLive}</div><div className="mt-1.5 text-[13px] text-muc-2">phiên đã live{r.soPhienKeHoach > 0 ? ` (còn ${r.soPhienKeHoach} lên kế hoạch)` : ""}</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tienVN(r.doanhThu)}</div><div className="mt-1.5 text-[13px] text-muc-2">doanh thu{r.soPhienThieuDoanhThu > 0 ? `, ${r.soPhienThieuDoanhThu} phiên chưa có số` : ""}</div></li>
        <li data-m="5" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{r.soDon.toLocaleString("vi-VN")}</div><div className="mt-1.5 text-[13px] text-muc-2">đơn</div></li>
        <li data-m="3" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{r.chiPhiQuangCao > 0 ? tienVN(r.chiPhiQuangCao) : "—"}</div><div className="mt-1.5 text-[13px] text-muc-2">chi phí quảng cáo đã ghi</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
        {r.phien.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có phiên live nào trong tháng này.</p> : (
          <table className="w-full min-w-[920px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Ngày</th><th className="px-4 py-3">Phiên</th><th className="px-4 py-3">Host</th><th className="px-4 py-3 text-right">Doanh thu</th><th className="px-4 py-3 text-right">Đơn</th><th className="px-4 py-3 text-right">Đạt mục tiêu</th><th className="px-4 py-3 text-right">Chi phí QC</th><th className="px-4 py-3 text-right">Doanh thu ÷ chi phí QC</th><th className="px-4 py-3 text-right">Giờ live</th></tr></thead>
            <tbody>{r.phien.map((p) => (
              <tr key={p.id} className="border-t border-vien align-top">
                <td className="px-4 py-3 tabular-nums">{ngayVN(p.ngay)}</td>
                <td className="px-4 py-3"><span className="text-muc">{p.chuDe}</span><div className="text-[12px] text-muc-3">{p.nenTang}{p.trangThai !== "Đã live" ? ` · ${p.trangThai}` : ""}</div></td>
                <td className="px-4 py-3">{host(p.hostId)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{tien(p.doanhThu)}{p.nguon && <div className="text-[12px] text-muc-3">{p.nguon}</div>}</td>
                <td className="px-4 py-3 text-right tabular-nums">{so(p.soDon)}{p.soDonHoanHuy > 0 && <div className="text-[12px] text-canh-bao">{p.soDonHoanHuy} huỷ/hoàn</div>}</td>
                <td className="px-4 py-3 text-right tabular-nums">{p.phanTramMucTieu === null ? "—" : `${p.phanTramMucTieu.toLocaleString("vi-VN")}%`}{p.mucTieu !== null && <div className="text-[12px] text-muc-3">/ {tienVN(p.mucTieu)}</div>}</td>
                <td className="px-4 py-3 text-right tabular-nums">{tien(p.chiPhiQuangCao)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{p.doanhThuTrenChiPhi === null ? "—" : `${p.doanhThuTrenChiPhi.toLocaleString("vi-VN")} lần`}</td>
                <td className="px-4 py-3 text-right tabular-nums">{p.soGio === null ? "—" : `${p.soGio.toLocaleString("vi-VN")} giờ`}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
      {r.theoHost.length > 0 && (
        <>
          <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Theo host</h2>
          <section data-m="5" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
            <table className="w-full min-w-[420px] text-[14px]">
              <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Host</th><th className="px-4 py-3 text-right">Số phiên</th><th className="px-4 py-3 text-right">Doanh thu</th></tr></thead>
              <tbody>{r.theoHost.map((h) => <tr key={h.hostId ?? "x"} className="border-t border-vien"><td className="px-4 py-3 text-muc">{host(h.hostId)}</td><td className="px-4 py-3 text-right tabular-nums">{h.soPhien}</td><td className="px-4 py-3 text-right tabular-nums">{tienVN(h.doanhThu)}</td></tr>)}</tbody>
            </table>
          </section>
        </>
      )}
      <p className="text-[13px] text-muc-3">Muốn doanh thu phiên tự tính từ đơn thật: ở Sổ đơn lẻ, chọn Phiên livestream cho đơn đến từ phiên đó. Chi phí quảng cáo và mục tiêu ghi ở màn Ghi phiên live.</p>
    </>
  );
}
