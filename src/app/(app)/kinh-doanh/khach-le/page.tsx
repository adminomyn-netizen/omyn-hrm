export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { docTatCa } from "@/lib/hr-db";
import { tinhDiemKhach } from "@/lib/kinh-doanh";

/** Điểm và hạng từng khách lẻ, tính từ sổ điểm. Không nhập tay. */
export default async function TrangDiemKhachLe() {
  await yeuCauQuyenSo("Kinh doanh");
  const [kh, dd, hg] = await Promise.all([
    docTatCa<{ id: string; ten: string; kenh: string; dong_y_nhan_tin: boolean }>("kd_khach_le", "id, ten, kenh, dong_y_nhan_tin"),
    docTatCa<{ khach_le_id: string; loai: string; so_diem: number }>("kd_diem_khach", "id, khach_le_id, loai, so_diem"),
    docTatCa<{ ten: string; diem_toi_thieu: number }>("kd_hang_khach", "id, ten, diem_toi_thieu"),
  ]);
  const ds = tinhDiemKhach(
    kh.map((k) => ({ id: k.id, ten: k.ten, kenh: k.kenh, dongYNhanTin: k.dong_y_nhan_tin })),
    dd.map((d) => ({ khachId: d.khach_le_id, loai: d.loai, soDiem: d.so_diem })),
    hg.map((h) => ({ ten: h.ten, diemToiThieu: h.diem_toi_thieu })),
  );
  const tongDu = ds.reduce((a, d) => a + Math.max(0, d.soDu), 0);
  const chuaDongY = ds.filter((d) => !d.dongYNhanTin).length;
  return (
    <>
      <TieuDeTrang tieuDe="Điểm và hạng khách lẻ" phu="Số dư = điểm đã tích − điểm đã dùng. Hạng theo tổng điểm đã tích, so với các mức ở màn Hạng khách. Số lấy từ sổ điểm, không nhập tay.">
        <Link href="/hr/diem-khach" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Ghi điểm</Link>
      </TieuDeTrang>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{ds.length}</div><div className="mt-1.5 text-[13px] text-muc-2">khách lẻ</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{tongDu.toLocaleString("vi-VN")}</div><div className="mt-1.5 text-[13px] text-muc-2">điểm đang còn</div></li>
        <li data-m={chuaDongY > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{chuaDongY}</div><div className="mt-1.5 text-[13px] text-muc-2">khách chưa đồng ý nhận tin</div></li>
      </ul>
      {hg.length === 0 && <p className="mb-4 text-[13px] text-muc-3">Chưa đặt hạng nào nên cột Hạng để trống. Chị Lâm cho tên hạng và số điểm để lên hạng, nhập ở màn Hạng khách.</p>}
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {ds.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có khách lẻ nào. Thêm khách ở màn Khách lẻ, rồi ghi điểm cho từng đơn.</p>
        ) : (
          <table className="w-full min-w-[640px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Kênh</th><th className="px-4 py-3 text-right">Đã tích</th><th className="px-4 py-3 text-right">Đã dùng</th><th className="px-4 py-3 text-right">Số dư</th><th className="px-4 py-3">Hạng</th><th className="px-4 py-3">Nhận tin</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.id} className="border-t border-vien">
                  <td className="px-4 py-3 font-medium text-muc">{d.ten}</td>
                  <td className="px-4 py-3 text-muc-3">{d.kenh}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.tich.toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.dung.toLocaleString("vi-VN")}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${d.soDu < 0 ? "text-loi" : "mau-chu"}`}>{d.soDu.toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3">{d.hang ?? "—"}</td>
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
