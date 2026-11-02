export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tinhDiemKhach } from "@/lib/kinh-doanh";
import { ngayHomNayHCM } from "@/lib/data";

const so = (n: number) => n.toLocaleString("vi-VN");

/** Điểm và hạng từng khách lẻ, tính từ sổ điểm theo tham số ở màn Tham số điểm. Không nhập tay. */
export default async function TrangDiemKhachLe() {
  await yeuCauQuyenSo("Kinh doanh");
  const [kh, dd, hg, chd] = await Promise.all([
    docTatCa<{ id: string; ten: string; kenh: string; dong_y_nhan_tin: boolean }>("kd_khach_le", "id, ten, kenh, dong_y_nhan_tin"),
    docTatCa<{ khach_le_id: string; loai: string; ngay: string; so_tien: number | null; so_diem: number }>("kd_diem_khach", "id, khach_le_id, loai, ngay, so_tien, so_diem"),
    docTatCa<{ ten: string; mua_toi_thieu: number; he_so_tich_pt: number }>("kd_hang_khach", "id, ten, mua_toi_thieu, he_so_tich_pt"),
    docTatCa<{ dong_moi_diem: number; dong_giam_moi_diem: number; het_han_thang: number; cua_so_hang_thang: number }>("kd_diem_cau_hinh", "id, dong_moi_diem, dong_giam_moi_diem, het_han_thang, cua_so_hang_thang"),
  ]);
  const c = chd[0];
  const ch = c ? { dongMoiDiem: c.dong_moi_diem, dongGiamMoiDiem: c.dong_giam_moi_diem, hetHanThang: c.het_han_thang, cuaSoHangThang: c.cua_so_hang_thang } : null;
  const ds = ch
    ? tinhDiemKhach(
        kh.map((k) => ({ id: k.id, ten: k.ten, kenh: k.kenh, dongYNhanTin: k.dong_y_nhan_tin })),
        dd.map((d) => ({ khachId: d.khach_le_id, loai: d.loai, ngay: d.ngay, soTien: d.so_tien, soDiem: d.so_diem })),
        hg.map((h) => ({ ten: h.ten, muaToiThieu: h.mua_toi_thieu, heSoPt: h.he_so_tich_pt })),
        ch,
        ngayHomNayHCM(),
      )
    : [];
  const tongDu = ds.reduce((a, d) => a + d.soDu, 0);
  const tongSapHet = ds.reduce((a, d) => a + d.sapHet, 0);
  const chuaDongY = ds.filter((d) => !d.dongYNhanTin).length;
  return (
    <>
      <TieuDeTrang tieuDe="Điểm và hạng khách lẻ" phu="Điểm tích theo số tiền mua, nhân hệ số của hạng; hạng theo tổng mua gần đây. Số lấy từ sổ điểm, không nhập tay.">
        <Link href="/hr/diem-khach" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi mua, tặng, dùng điểm</Link>
      </TieuDeTrang>
      <p className="mb-4 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">
        <strong className="font-semibold text-muc">Tham số TẠM, chờ chị Linh/chị Lâm duyệt.</strong>{" "}
        {ch
          ? `${so(ch.dongMoiDiem)}đ mua = 1 điểm; 1 điểm đổi ${so(ch.dongGiamMoiDiem)}đ giảm giá; điểm hết hạn sau ${ch.hetHanThang} tháng; hạng tính theo tổng mua ${ch.cuaSoHangThang} tháng gần nhất. ${hg.length ? "Hạng: " + [...hg].sort((a, b) => a.mua_toi_thieu - b.mua_toi_thieu).map((h) => `${h.ten} (từ ${so(h.mua_toi_thieu)}đ, nhân ${so(h.he_so_tich_pt)}%)`).join(", ") + "." : "Chưa đặt hạng nào."}`
          : "Chưa có tham số điểm."}{" "}
        <Link href="/hr/diem-cau-hinh" className="underline">Sửa tham số</Link> · <Link href="/hr/hang-khach" className="underline">Sửa hạng</Link>
      </p>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{ds.length}</div><div className="mt-1.5 text-[13px] text-muc-2">khách lẻ</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{so(tongDu)}</div><div className="mt-1.5 text-[13px] text-muc-2">điểm đang còn (≈ {so(tongDu * (ch?.dongGiamMoiDiem ?? 0))}đ giảm giá)</div></li>
        <li data-m={tongSapHet > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{so(tongSapHet)}</div><div className="mt-1.5 text-[13px] text-muc-2">điểm sắp hết hạn trong 30 ngày</div></li>
        <li data-m={chuaDongY > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{chuaDongY}</div><div className="mt-1.5 text-[13px] text-muc-2">khách chưa đồng ý nhận tin (không nhắn SMS, Zalo)</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có khách lẻ nào. Thêm khách ở màn Khách lẻ, rồi ghi lần mua cho từng khách.</p>
        ) : (
          <table className="w-full min-w-[820px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Kênh</th><th className="px-4 py-3">Hạng</th><th className="px-4 py-3 text-right">Mua {ch?.cuaSoHangThang} tháng</th><th className="px-4 py-3 text-right">Hệ số</th><th className="px-4 py-3 text-right">Điểm còn</th><th className="px-4 py-3 text-right">Quy đổi (đ)</th><th className="px-4 py-3 text-right">Sắp hết hạn</th><th className="px-4 py-3 text-right">Đã hết hạn</th><th className="px-4 py-3">Nhận tin</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.id} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{d.ten}{d.thieu > 0 && <span className="ml-2 text-[12px] text-loi">dùng quá {so(d.thieu)} điểm</span>}</td>
                  <td className="px-4 py-3 text-muc-3">{d.kenh}</td>
                  <td className="px-4 py-3">{d.hang ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{so(d.muaCuaSo)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muc-3">{d.hang ? `${so(d.heSoPt)}%` : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums mau-chu">{so(d.soDu)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{so(d.soDuTien)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${d.sapHet > 0 ? "text-canh-bao" : "text-muc-3"}`}>{d.sapHet > 0 ? so(d.sapHet) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muc-3">{d.hetHan > 0 ? so(d.hetHan) : "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-muc-3">{d.dongYNhanTin ? "Đã đồng ý" : "Chưa"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
