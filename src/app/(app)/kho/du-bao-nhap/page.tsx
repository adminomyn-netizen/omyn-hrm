export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { ngayHomNayHCM } from "@/lib/data";
import { duBaoNhap } from "@/lib/ton-kho";

const so = (n: number) => n.toLocaleString("vi-VN");
const nguyen = (s: string | undefined, mac: number) => { const n = Number(s); return Number.isInteger(n) && n >= 1 && n <= 365 ? n : mac; };
const O = "w-28 rounded-nho border border-vien px-3 py-2 text-[14px] text-muc";

/** Dự báo nhập hàng từ tốc độ xuất kho gần đây. Số ngày chỉnh được ở đầu trang (mặc định 30, TẠM, chờ chị duyệt). */
export default async function TrangDuBaoNhap({ searchParams }: { searchParams: Promise<{ ban?: string; ve?: string; du?: string }> }) {
  await yeuCauQuyenSo("Tài chính & Kho");
  const q = await searchParams;
  const soNgayBan = nguyen(q.ban, 30), ngayHangVe = nguyen(q.ve, 30), ngayDuTru = nguyen(q.du, 30);
  const homNay = ngayHomNayHCM();
  const [sp, nx] = await Promise.all([
    docTatCa<{ id: string; ma_sp: string; ten: string }>("sp_san_pham", "id, ma_sp, ten"),
    docTatCa<{ san_pham_id: string; loai: string; so_luong: number; ngay: string }>("kho_nhap_xuat", "id, san_pham_id, loai, so_luong, ngay"),
  ]);
  const ds = duBaoNhap(
    sp.map((s) => ({ id: s.id, ma: s.ma_sp, ten: s.ten })),
    nx.map((d) => ({ sanPhamId: d.san_pham_id, loai: d.loai, soLuong: d.so_luong, ngay: d.ngay })),
    homNay, soNgayBan, ngayHangVe, ngayDuTru,
  );
  const dem = (t: string) => ds.filter((d) => d.trangThai === t).length;
  const mau = (t: string) => (t === "Hết hàng" || t === "Cần nhập ngay" ? "text-loi" : t === "Sắp cần nhập" ? "text-canh-bao" : "text-muc-3");
  return (
    <>
      <TieuDeTrang tieuDe="Dự báo nhập hàng" phu="Dựa trên tốc độ xuất kho gần đây và tồn hiện có, không phải dự đoán thị trường. Số ngày bên dưới là TẠM, chị chỉnh theo thực tế.">
        <Link href="/ton-kho" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Tồn kho</Link>
      </TieuDeTrang>
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 text-[13px] text-muc-2">
        <label className="flex flex-col gap-1">Tính tốc độ bán trong (ngày)<input type="number" name="ban" min={1} max={365} defaultValue={soNgayBan} className={O} /></label>
        <label className="flex flex-col gap-1">Hàng về sau (ngày)<input type="number" name="ve" min={1} max={365} defaultValue={ngayHangVe} className={O} /></label>
        <label className="flex flex-col gap-1">Dự trữ thêm (ngày)<input type="number" name="du" min={1} max={365} defaultValue={ngayDuTru} className={O} /></label>
        <button type="submit" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Tính lại</button>
      </form>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m={dem("Hết hàng") ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{dem("Hết hàng")}</div><div className="mt-1.5 text-[13px] text-muc-2">sản phẩm hết hàng nhưng đang bán</div></li>
        <li data-m={dem("Cần nhập ngay") ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{dem("Cần nhập ngay")}</div><div className="mt-1.5 text-[13px] text-muc-2">cần nhập ngay (hết trước khi hàng về)</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{dem("Sắp cần nhập")}</div><div className="mt-1.5 text-[13px] text-muc-2">sắp cần nhập</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{dem("Chưa có số bán")}</div><div className="mt-1.5 text-[13px] text-muc-2">chưa có số bán trong kỳ, không dự báo</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có phiếu nhập xuất nào để dự báo. Ghi phiếu ở màn Phiếu nhập xuất.</p>
        ) : (
          <table className="w-full min-w-[760px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3 text-right">Tồn</th><th className="px-4 py-3 text-right">Đã xuất {soNgayBan} ngày</th><th className="px-4 py-3 text-right">Bán mỗi ngày</th><th className="px-4 py-3 text-right">Còn bán được (ngày)</th><th className="px-4 py-3 text-right">Gợi ý nhập</th><th className="px-4 py-3">Tình trạng</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.id} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{d.ten} <span className="text-[12px] text-muc-3">({d.ma})</span></td>
                  <td className={`px-4 py-3 text-right tabular-nums ${d.ton < 0 ? "text-loi" : ""}`}>{so(d.ton)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{so(d.daBan)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muc-3">{d.tocDoNgay > 0 ? d.tocDoNgay.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.ngayConBan === null ? "—" : so(d.ngayConBan)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{d.canNhap > 0 ? so(d.canNhap) : "—"}</td>
                  <td className={`px-4 py-3 text-[13px] ${mau(d.trangThai)}`}>{d.trangThai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <p className="mt-4 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">
        Gợi ý nhập = bán mỗi ngày × (hàng về sau + dự trữ thêm) − tồn. Chỉ tính phiếu Xuất; điều chỉnh, xuất huỷ không phải bán. Chưa tính hàng đang trên đường về và chưa tính mùa vụ, khuyến mãi.
      </p>
    </>
  );
}
