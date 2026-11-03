export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tienVN } from "@/lib/dinh-dang";
import { bienTheoGia, giaVonMoiNhat, laiGopSi } from "@/lib/kinh-doanh";

const DA_CHOT = ["Đã chốt", "Đang giao", "Đã giao", "Đã thu đủ"];

/** Lãi gộp theo kênh: biên theo bảng giá đã duyệt, và lãi thực tế kênh sỉ. Chỉ tính khi có giá vốn, thiếu thì nói rõ, không đoán. */
export default async function TrangLaiGop() {
  await yeuCauQuyenSo("Kinh doanh");
  const [sp, gia, don, dong] = await Promise.all([
    docTatCa<{ id: string; ma_sp: string; ten: string }>("sp_san_pham", "id, ma_sp, ten"),
    docTatCa<{ san_pham_id: string; kenh: string; gia_von: number | null; gia_ban: number | null; trang_thai: string; hieu_luc_tu: string | null; tao_luc: string }>("sp_gia", "id, san_pham_id, kenh, gia_von, gia_ban, trang_thai, hieu_luc_tu, tao_luc"),
    docTatCa<{ id: string; trang_thai: string }>("kd_don_si", "id, trang_thai"),
    docTatCa<{ don_si_id: string; san_pham_id: string; so_luong: number; don_gia: number; chiet_khau: number }>("kd_don_si_dong", "id, don_si_id, san_pham_id, so_luong, don_gia, chiet_khau"),
  ]);
  const ten = new Map(sp.map((s) => [s.id, `${s.ten} (${s.ma_sp})`]));
  const g = gia.map((x) => ({ sanPhamId: x.san_pham_id, kenh: x.kenh, giaVon: x.gia_von, giaBan: x.gia_ban, trangThai: x.trang_thai, hieuLucTu: x.hieu_luc_tu, taoLuc: x.tao_luc }));
  const bien = bienTheoGia(g);
  const donChot = new Set(don.filter((d) => DA_CHOT.includes(d.trang_thai)).map((d) => d.id));
  const si = laiGopSi(
    dong.filter((d) => donChot.has(d.don_si_id)).map((d) => ({ sanPhamId: d.san_pham_id, soLuong: d.so_luong, donGia: d.don_gia, chietKhau: d.chiet_khau })),
    giaVonMoiNhat(g),
  );
  const pt = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("vi-VN")}%`);
  return (
    <>
      <TieuDeTrang tieuDe="Lãi gộp theo kênh" phu="Lãi gộp = giá bán − giá vốn. Chỉ tính khi có giá vốn đã duyệt; thiếu thì ghi rõ, không đoán.">
        <Link href="/hr/bang-gia" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Bảng giá theo kênh</Link>
      </TieuDeTrang>
      <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Biên lãi gộp theo bảng giá đã duyệt</h2>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
        {bien.theoKenh.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có giá nào được duyệt. Nhập giá vốn và giá bán ở Bảng giá theo kênh, rồi duyệt.</p>
        ) : (
          <table className="w-full min-w-[560px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Kênh</th><th className="px-4 py-3 text-right">Dòng giá đã duyệt</th><th className="px-4 py-3 text-right">Đủ vốn và giá bán</th><th className="px-4 py-3 text-right">Biên thấp nhất</th><th className="px-4 py-3 text-right">Biên cao nhất</th></tr></thead>
            <tbody>
              {bien.theoKenh.map((k) => (
                <tr key={k.kenh} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{k.kenh}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{k.soDong}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${k.soDuSo < k.soDong ? "text-canh-bao" : ""}`}>{k.soDuSo}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{pt(k.thapNhat)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{pt(k.caoNhat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {bien.dong.length > 0 && (
        <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach mb-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">Kênh</th><th className="px-4 py-3 text-right">Giá vốn</th><th className="px-4 py-3 text-right">Giá bán</th><th className="px-4 py-3 text-right">Lãi gộp</th><th className="px-4 py-3 text-right">Biên</th></tr></thead>
            <tbody>
              {[...bien.dong].sort((a, b) => a.phanTram - b.phanTram).map((d, i) => (
                <tr key={i} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{ten.get(d.sanPhamId) ?? "—"}</td>
                  <td className="px-4 py-3 text-muc-3">{d.kenh}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tienVN(d.giaVon)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tienVN(d.giaBan)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${d.lai < 0 ? "text-loi" : ""}`}>{tienVN(d.lai)}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${d.lai < 0 ? "text-loi" : ""}`}>{pt(d.phanTram)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <h2 className="chu-tieu-de mb-2 text-[20px] text-muc">Lãi gộp thực tế kênh sỉ</h2>
      <section data-m="7" className="mau-nhom the-noi mau-vach mb-6 p-4 text-[14px] text-muc-2">
        {si.soDong === 0 ? (
          <p>Chưa có dòng hàng nào của đơn sỉ đã chốt. Thêm dòng hàng ở màn Đơn bán sỉ.</p>
        ) : (
          <>
            <p>Doanh thu {si.soDong} dòng hàng của đơn sỉ đã chốt trở đi: <strong className="text-muc">{tienVN(si.doanhThu)}</strong>.</p>
            {si.laiGop === null ? (
              <p className="mt-1 text-canh-bao">Chưa tính được lãi gộp: chưa dòng nào có giá vốn đã duyệt.</p>
            ) : (
              <p className="mt-1">Trên {si.soDongCoVon}/{si.soDong} dòng có giá vốn (doanh thu {tienVN(si.doanhThuCoVon)}, vốn {tienVN(si.von)}): lãi gộp <strong className="text-muc">{tienVN(si.laiGop)}</strong>, biên <strong className="text-muc">{pt(si.phanTram)}</strong>.</p>
            )}
            {si.thieuVon.length > 0 && <p className="mt-1 text-canh-bao">Thiếu giá vốn nên không tính: {si.thieuVon.map((id) => ten.get(id) ?? id).join(", ")}.</p>}
          </>
        )}
      </section>
      <p className="rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">
        Kênh sàn, Facebook, lẻ: app chưa có số lượng bán theo sản phẩm nên chưa tính lãi gộp thực tế, chỉ có biên theo bảng giá ở trên. Giá vốn lấy từ dòng giá đã duyệt mới nhất của sản phẩm. Chưa trừ phí sàn, vận chuyển, khuyến mãi.
      </p>
    </>
  );
}
