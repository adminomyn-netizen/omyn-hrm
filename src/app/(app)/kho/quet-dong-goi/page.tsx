export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { dbHr } from "@/lib/hr-db";
import { ngayHomNayHCM } from "@/lib/data";
import { QuetDongGoi } from "@/components/kho/QuetDongGoi";

/** Quét mã đóng gói nhanh: quét mã đơn là đơn chuyển sang Đã đóng. Có chế độ nhận hàng hoàn về. */
export default async function TrangQuet() {
  const { chiXem } = await yeuCauQuyenSo("Tài chính & Kho");
  const db = dbHr();
  const homNay = ngayHomNayHCM();
  const dauNgay = new Date(`${homNay}T00:00:00+07:00`).toISOString();
  const [cho, xong] = await Promise.all([
    db.from("kho_dong_goi_giao").select("id", { count: "exact", head: true }).eq("trang_thai", "Chờ đóng"),
    db.from("kho_dong_goi_giao").select("id", { count: "exact", head: true }).gte("dong_goi_luc", dauNgay),
  ]);
  return (
    <>
      <TieuDeTrang tieuDe="Quét đóng gói" phu="Quét mã đơn hoặc mã vận đơn: đơn đang Chờ đóng chuyển sang Đã đóng, ghi người quét và giờ quét. Đơn đã huỷ, hoàn trả hoặc đã giao thì chặn. Quét tồn kho không nằm ở đây: kho chỉ trừ khi đơn lẻ có dòng hàng và đã giao.">
        <Link href="/kho/dong-goi" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Thống kê đóng gói</Link>
      </TieuDeTrang>
      <ul className="mb-6 grid grid-cols-2 gap-3">
        <li data-m="5" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{cho.count ?? 0}</div><div className="mt-1.5 text-[13px] text-muc-2">đơn đang chờ đóng</div></li>
        <li data-m="1" className="mau-nhom the-noi mau-vach mau-nen rounded-nho p-4"><div className="chu-tieu-de mau-chu text-[26px] leading-none">{xong.count ?? 0}</div><div className="mt-1.5 text-[13px] text-muc-2">đã quét đóng hôm nay</div></li>
      </ul>
      {chiXem ? <p className="text-[14px] text-muc-3">Bạn chỉ được xem mục Tài chính và Kho, chưa quét được.</p> : <QuetDongGoi />}
    </>
  );
}
