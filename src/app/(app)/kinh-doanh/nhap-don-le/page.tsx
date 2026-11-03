export const dynamic = "force-dynamic";

import Link from "next/link";
import { yeuCauQuyenSo } from "@/lib/quyen-nghiep-vu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhapDonLe } from "@/components/kinh-doanh/NhapDonLe";

/** Nhập hàng loạt đơn lẻ từ file xuất của sàn (Shopee, TikTok Shop) hoặc bảng Excel. */
export default async function TrangNhapDonLe() {
  const { chiXem } = await yeuCauQuyenSo("Kinh doanh");
  return (
    <>
      <TieuDeTrang tieuDe="Nhập đơn lẻ từ file" phu="Dán bảng đơn từ Excel hoặc file xuất của sàn. Đơn đã giao có số điện thoại khách sẽ tự cộng điểm.">
        <Link href="/hr/don-le" className="nut-vang rounded-nho px-3.5 py-2 text-[14px] font-medium">Sổ đơn lẻ</Link>
      </TieuDeTrang>
      {chiXem ? <p className="text-[14px] text-muc-3">Bạn chỉ có quyền xem mục Kinh doanh nên không nhập được.</p> : <NhapDonLe />}
      <div className="mt-6 rounded-nho border border-vien px-4 py-3 text-[13px] text-muc-2">
        <p className="font-medium text-muc">Cột nhận được (tên tiếng Việt hoặc tiếng Anh của sàn):</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Bắt buộc: <strong>Mã đơn</strong> (Mã đơn hàng, Order ID), <strong>Ngày</strong> (Ngày đặt hàng, dd/mm/yyyy hoặc yyyy-mm-dd), <strong>Tiền khách trả</strong> (Tổng thanh toán, Tổng tiền, Order Amount).</li>
          <li>Tuỳ chọn: Tên khách (Tên người nhận, Buyer), Số điện thoại (SĐT, Phone), Trạng thái (Hoàn thành/Completed → Đã giao; Huỷ/Cancelled → Huỷ; Hoàn/Trả hàng → Hoàn trả; còn lại → Đang xử lý).</li>
        </ul>
        <p className="mt-2">Mã đơn đã có trong sổ cùng kênh thì bỏ qua, nhập lại cùng file không bị trùng. File chưa có dòng hàng nên chưa tự trừ kho và chưa tính lãi gộp; thêm dòng hàng ở Dòng hàng đơn lẻ nếu cần. Khách mới tạo ra mặc định CHƯA đồng ý nhận tin.</p>
      </div>
    </>
  );
}
