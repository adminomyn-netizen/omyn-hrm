export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NutLapHangDoi } from "@/components/kinh-doanh/NutLapHangDoi";
import { docTatCa } from "@/lib/hr-db";

/** Tổng quan tin nhắn khách lẻ: cổng gửi, kịch bản, hàng đợi. Chỉ lập hàng đợi, không gửi gì ra ngoài. */
export default async function TrangTinNhan() {
  const { chiXem } = await yeuCauQuyenSo("Kinh doanh");
  const [ch, kb, hd, kh] = await Promise.all([
    docTatCa<{ cong_gui: string; bat_gui: boolean }>("tn_cau_hinh", "id, cong_gui, bat_gui"),
    docTatCa<{ id: string; ten: string; su_kien: string; so_ngay: number; bat: boolean }>("tn_kich_ban", "id, ten, su_kien, so_ngay, bat"),
    docTatCa<{ id: string; khach_le_id: string; kenh: string; noi_dung: string; ngay_du_kien: string; trang_thai: string }>("tn_hang_doi", "id, khach_le_id, kenh, noi_dung, ngay_du_kien, trang_thai"),
    docTatCa<{ id: string; ten: string; dong_y_nhan_tin: boolean }>("kd_khach_le", "id, ten, dong_y_nhan_tin"),
  ]);
  const tenKhach = new Map(kh.map((k) => [k.id, k.ten]));
  const dongY = kh.filter((k) => k.dong_y_nhan_tin).length;
  const demTT = (t: string) => hd.filter((h) => h.trang_thai === t).length;
  const batNum = kb.filter((k) => k.bat).length;
  const cong = ch[0];
  const gan = [...hd].sort((a, b) => (a.ngay_du_kien < b.ngay_du_kien ? 1 : -1)).slice(0, 30);
  return (
    <>
      <TieuDeTrang tieuDe="Tin nhắn khách lẻ" phu="Mẫu tin, kịch bản và hàng đợi gửi SMS, Zalo. Chỉ nhắn khách đã đồng ý nhận tin.">
        {!chiXem && <NutLapHangDoi />}
      </TieuDeTrang>
      <p className="mb-4 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">
        <strong className="font-semibold text-muc">Cổng gửi đang {cong?.bat_gui ? "BẬT" : "TẮT"}.</strong>{" "}
        {cong?.bat_gui ? `Nhà cung cấp: ${cong.cong_gui}.` : "Chưa chọn nhà cung cấp (gói có phí, chờ chị Lâm chọn). Tin chỉ nằm trong hàng đợi, chưa gửi đi đâu."}{" "}
        <Link href="/hr/cong-gui-tin" className="underline">Cổng gửi</Link> · <Link href="/hr/kich-ban-tin" className="underline">Kịch bản</Link> · <Link href="/hr/mau-tin" className="underline">Mẫu tin</Link>
      </p>
      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{dongY}/{kh.length}</div><div className="mt-1.5 text-[13px] text-muc-2">khách đồng ý nhận tin</div></li>
        <li data-m="7" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{batNum}/{kb.length}</div><div className="mt-1.5 text-[13px] text-muc-2">kịch bản đang bật</div></li>
        <li data-m={demTT("Chờ gửi") > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{demTT("Chờ gửi")}</div><div className="mt-1.5 text-[13px] text-muc-2">tin chờ gửi</div></li>
        <li data-m={demTT("Lỗi") > 0 ? 3 : 1} className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{demTT("Đã gửi")}</div><div className="mt-1.5 text-[13px] text-muc-2">đã gửi ({demTT("Lỗi")} lỗi, {demTT("Bỏ qua")} bỏ qua)</div></li>
      </ul>
      <section data-m="7" className="mau-nhom the-noi the-noi-thap mau-vach overflow-x-auto">
        {gan.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-muc-3">Chưa có tin nào. Bật một kịch bản rồi bấm Lập hàng đợi hôm nay.</p>
        ) : (
          <table className="w-full min-w-[720px] text-[14px]">
            <thead><tr className="text-left text-[12px] font-medium text-muc-3"><th className="px-4 py-3">Ngày</th><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Kênh</th><th className="px-4 py-3">Nội dung</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
            <tbody>
              {gan.map((h) => (
                <tr key={h.id} className="border-t border-vien">
                  <td className="px-4 py-3 tabular-nums text-muc-3">{h.ngay_du_kien}</td>
                  <td className="px-4 py-3 font-medium text-muc">{tenKhach.get(h.khach_le_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-muc-3">{h.kenh}</td>
                  <td className="px-4 py-3 text-muc-2">{h.noi_dung}</td>
                  <td className="px-4 py-3 text-[13px]">{h.trang_thai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
