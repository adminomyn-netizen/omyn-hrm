export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { giaVonMoiNhat } from "@/lib/kinh-doanh";
import { tongPhi } from "@/lib/doi-soat-don";
import { laiLoTheoKenh } from "@/lib/lai-lo-kenh";

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const thangKe = (t: string, n: number) => new Date(Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5)) - 1 + n, 1)).toISOString().slice(0, 7);
const pt = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("vi-VN")}%`);
const tien = (n: number | null) => (n === null ? "—" : tienVN(n));

/** Lãi lỗ theo kênh trong tháng: doanh thu đơn đã giao, hoàn trả, lãi gộp, phí sàn lấy từ Đối soát sàn theo đơn. Không đoán: thiếu giá vốn hoặc chưa đối soát thì ghi "—". */
export default async function TrangLaiLoKenh({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  await yeuCauQuyenSo("Kinh doanh");
  const { thang: t } = await searchParams;
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const thang = t && THANG.test(t) ? t : homNay.slice(0, 7);
  const dau = `${thang}-01`, cuoi = `${thangKe(thang, 1)}-01`;
  const [don, dongHang, gia, doiSoat] = await Promise.all([
    docTatCa<{ id: string; kenh: string; trang_thai: string; gia_tri: number }>("kd_don_le", "id, kenh, trang_thai, gia_tri", (q) => q.gte("ngay", dau).lt("ngay", cuoi)),
    docTatCa<{ don_le_id: string; san_pham_id: string; so_luong: number; don_gia: number; chiet_khau: number }>("kd_don_le_dong", "id, don_le_id, san_pham_id, so_luong, don_gia, chiet_khau"),
    docTatCa<{ san_pham_id: string; kenh: string; gia_von: number | null; gia_ban: number | null; trang_thai: string; hieu_luc_tu: string | null; tao_luc: string }>("sp_gia", "id, san_pham_id, kenh, gia_von, gia_ban, trang_thai, hieu_luc_tu, tao_luc"),
    docTatCa<{ don_le_id: string | null; phi_hoa_hong: number; phi_giao_dich: number; phi_van_chuyen: number; phi_dich_vu: number; phi_affiliate: number; thue: number; phi_khac: number }>("kd_doi_soat_dong", "id, don_le_id, phi_hoa_hong, phi_giao_dich, phi_van_chuyen, phi_dich_vu, phi_affiliate, thue, phi_khac", (q) => q.not("don_le_id", "is", null)),
  ]);
  const von = giaVonMoiNhat(gia.map((x) => ({ sanPhamId: x.san_pham_id, kenh: x.kenh, giaVon: x.gia_von, giaBan: x.gia_ban, trangThai: x.trang_thai, hieuLucTu: x.hieu_luc_tu, taoLuc: x.tao_luc })));
  const phiTheoDon = new Map<string, number>();
  for (const d of doiSoat) if (d.don_le_id) phiTheoDon.set(d.don_le_id, (phiTheoDon.get(d.don_le_id) ?? 0) + tongPhi({ phiHoaHong: d.phi_hoa_hong, phiGiaoDich: d.phi_giao_dich, phiVanChuyen: d.phi_van_chuyen, phiDichVu: d.phi_dich_vu, phiAffiliate: d.phi_affiliate, thue: d.thue, phiKhac: d.phi_khac }));
  const r = laiLoTheoKenh(
    don.map((d) => ({ id: d.id, kenh: d.kenh, trangThai: d.trang_thai, giaTri: Number(d.gia_tri) })),
    dongHang.map((d) => ({ donId: d.don_le_id, sanPhamId: d.san_pham_id, soLuong: d.so_luong, donGia: d.don_gia, chietKhau: d.chiet_khau })),
    von, phiTheoDon,
  );
  const tong = r.reduce((a, k) => ({ doanhThu: a.doanhThu + k.doanhThu, tienHoan: a.tienHoan + k.tienHoan, phiSan: a.phiSan + k.phiSan }), { doanhThu: 0, tienHoan: 0, phiSan: 0 });
  return (
    <>
      <TieuDeTrang tieuDe="Lãi lỗ theo kênh" phu="Theo tháng của ngày đặt đơn. Doanh thu là đơn Đã giao; lãi gộp cần giá vốn và dòng hàng; phí sàn lấy từ Đối soát sàn theo đơn. Thiếu thì ghi —, không đoán.">
        <Link href="/kinh-doanh/doi-soat-don" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Đối soát theo đơn</Link>
      </TieuDeTrang>
      <nav className="mb-4 flex items-center gap-3 text-[14px]" aria-label="Chọn tháng">
        <Link href={`/kinh-doanh/lai-lo-kenh?thang=${thangKe(thang, -1)}`} className="rounded-nho border border-vien px-3 py-1.5 text-muc-2">← {thangKe(thang, -1)}</Link>
        <strong className="text-muc">Tháng {thang.slice(5)}/{thang.slice(0, 4)}</strong>
        <Link href={`/kinh-doanh/lai-lo-kenh?thang=${thangKe(thang, 1)}`} className="rounded-nho border border-vien px-3 py-1.5 text-muc-2">{thangKe(thang, 1)} →</Link>
      </nav>
      <ul className="mb-6 grid grid-cols-3 gap-3">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[22px] leading-none">{tienVN(tong.doanhThu)}</div><div className="mt-1.5 text-[13px] text-muc-2">doanh thu đơn đã giao</div></li>
        <li data-m={tong.tienHoan > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[22px] leading-none">{tienVN(tong.tienHoan)}</div><div className="mt-1.5 text-[13px] text-muc-2">giá trị đơn hoàn trả</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[22px] leading-none">{tienVN(tong.phiSan)}</div><div className="mt-1.5 text-[13px] text-muc-2">phí sàn (đơn đã đối soát)</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {r.length === 0 ? <p className="px-4 py-6 text-[14px] text-muc-3">Tháng này chưa có đơn nào trong Sổ đơn lẻ. Nhập đơn từ file ở màn Nhập đơn lẻ.</p> : (
          <table className="w-full min-w-[900px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Kênh</th><th className="px-4 py-3 text-right">Đơn giao</th><th className="px-4 py-3 text-right">Doanh thu</th><th className="px-4 py-3 text-right">Hoàn trả</th><th className="px-4 py-3 text-right">Tỷ lệ hoàn</th><th className="px-4 py-3 text-right">Lãi gộp</th><th className="px-4 py-3 text-right">Đã đối soát</th><th className="px-4 py-3 text-right">Phí sàn</th><th className="px-4 py-3 text-right">Lãi sau phí sàn</th></tr></thead>
            <tbody>
              {r.map((k) => (
                <tr key={k.kenh} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{k.kenh}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{k.soDonGiao}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tienVN(k.doanhThu)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${k.soDonHoan > 0 ? "text-canh-bao" : "text-muc-3"}`}>{k.soDonHoan > 0 ? `${k.soDonHoan} đơn · ${tienVN(k.tienHoan)}` : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{pt(k.tyLeHoan)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tien(k.laiGop)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${k.soDonDoiSoat < k.soDonGiao ? "text-canh-bao" : ""}`}>{k.soDonDoiSoat}/{k.soDonGiao}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{k.soDonDoiSoat > 0 ? tienVN(k.phiSan) : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{tien(k.laiSauPhi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <div className="mt-6 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">
        <p><strong className="text-muc">Cách đọc:</strong> Tỷ lệ hoàn = số đơn Hoàn trả / tổng đơn của kênh trong tháng. Lãi gộp tính trên đơn đã giao có dòng hàng và giá vốn đã duyệt. Lãi sau phí sàn chỉ tính trên các đơn đã giao ĐÃ đối soát (cột Đã đối soát), nên đơn chưa đối soát không bị trừ phí thiếu.</p>
        <p className="mt-2">Chưa trừ chi phí quảng cáo, vận chuyển và hàng tặng, vì các khoản này chưa gắn được vào từng kênh bán. Cần quy tắc phân bổ do chị chốt trước.</p>
      </div>
    </>
  );
}
