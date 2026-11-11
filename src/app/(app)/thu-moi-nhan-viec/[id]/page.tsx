export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { NutIn } from "@/components/luong/NutIn";
import { yeuCauVaiTro } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { ngayVN, tienVN } from "@/lib/dinh-dang";

type Offer = {
  id: string; ten_ung_vien: string; vi_tri: string; luong_de_xuat: number | null; ngay_gui: string | null; han_tra_loi: string | null; ngay_nhan_viec: string | null;
  loai_hop_dong: string | null; thoi_gian_thu_viec: string | null; dia_diem_lam_viec: string | null; phuc_loi: string | null; nguoi_ky: string | null; chuc_danh_nguoi_ky: string | null; trang_thai: string;
};

const CHO = "……………………";

/** Thư mời nhận việc dựng từ dòng Offer: chỉ dùng thông tin đã nhập, thiếu thì chừa chỗ điền tay. Bản nháp để người có thẩm quyền xem lại trước khi gửi. */
export default async function TrangThuMoi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await dbHr().from("offer_tuyen_dung").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Offer;
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const hinhThuc = o.loai_hop_dong === "Thử việc" ? "thử việc" : o.loai_hop_dong === "Hợp đồng lao động" ? "hợp đồng lao động" : null;
  const dong = (nhan: string, giaTri: string | null | undefined) => (
    <tr>
      <td className="w-[42%] border-b border-vien py-2 pr-4 align-top text-muc-2">{nhan}</td>
      <td className="border-b border-vien py-2 align-top font-medium text-muc">{giaTri || CHO}</td>
    </tr>
  );
  return (
    <div className="mx-auto max-w-[760px]">
      <div className="khong-in mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/hr/offer-tuyen-dung" className="text-[14px] text-nhan-dam hover:underline">← Danh sách offer</Link>
        <NutIn />
      </div>
      <p className="khong-in mb-4 rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[13px] text-canh-bao">
        Bản nháp tự dựng từ thông tin đã nhập. Chỗ còn dấu chấm là thông tin chưa nhập, điền tay hoặc quay lại dòng Offer để bổ sung. Người có thẩm quyền xem lại câu chữ trước khi gửi.
      </p>
      <article className="the-noi p-8 text-[15px] leading-relaxed text-muc">
        <div className="text-center">
          <div className="text-[13px] font-medium uppercase tracking-[0.14em] text-muc-2">Công ty Cổ phần OMYN Cosmetics</div>
          <h1 className="chu-tieu-de mt-5 text-[24px] font-semibold uppercase">Thư mời nhận việc</h1>
        </div>
        <p className="mt-6 text-right text-muc-2">Ngày {ngayVN(o.ngay_gui || homNay)}</p>
        <p className="mt-4">Kính gửi: <strong>{o.ten_ung_vien}</strong></p>
        <p className="mt-4">
          Cảm ơn bạn đã dành thời gian tham gia các vòng phỏng vấn tại Công ty Cổ phần OMYN Cosmetics. Công ty trân trọng mời bạn về làm việc ở vị trí <strong>{o.vi_tri}</strong>{hinhThuc ? ` theo hình thức ${hinhThuc}` : ""} với các nội dung chính như sau:
        </p>
        <table className="mt-4 w-full border-collapse text-[15px]">
          <tbody>
            {dong("Vị trí", o.vi_tri)}
            {dong("Hình thức nhận việc", o.loai_hop_dong)}
            {dong("Thời gian thử việc", o.thoi_gian_thu_viec)}
            {dong("Mức lương đề xuất", o.luong_de_xuat != null ? tienVN(Number(o.luong_de_xuat)) : null)}
            {dong("Ngày nhận việc dự kiến", o.ngay_nhan_viec ? ngayVN(o.ngay_nhan_viec) : null)}
            {dong("Địa điểm làm việc", o.dia_diem_lam_viec)}
          </tbody>
        </table>
        {o.phuc_loi && (
          <div className="mt-4">
            <div className="font-medium">Chế độ, phúc lợi</div>
            <p className="mt-1 whitespace-pre-line text-muc-2">{o.phuc_loi}</p>
          </div>
        )}
        <p className="mt-5">
          Vui lòng phản hồi quyết định của bạn trước ngày <strong>{o.han_tra_loi ? ngayVN(o.han_tra_loi) : CHO}</strong>. Nếu có thắc mắc, bạn liên hệ bộ phận Hành chính nhân sự để được giải đáp.
        </p>
        <p className="mt-3">Chúng tôi rất mong được chào đón bạn gia nhập đội ngũ OMYN.</p>
        <div className="mt-8 grid grid-cols-2 gap-6 text-center">
          <div>
            <div className="font-medium">Người nhận thư</div>
            <div className="mt-1 text-[13px] text-muc-3">(Ký và ghi rõ họ tên nếu đồng ý)</div>
            <div className="mt-14">{o.ten_ung_vien}</div>
          </div>
          <div>
            <div className="font-medium">{o.chuc_danh_nguoi_ky || CHO}</div>
            <div className="mt-1 text-[13px] text-muc-3">(Ký, ghi rõ họ tên)</div>
            <div className="mt-14">{o.nguoi_ky || CHO}</div>
          </div>
        </div>
      </article>
    </div>
  );
}
