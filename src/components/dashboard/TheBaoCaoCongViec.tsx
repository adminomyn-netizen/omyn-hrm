import Link from "next/link";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { duocXemTongQuanBaoCao, layTongQuanBaoCao } from "@/lib/bao-cao-cv-data";
import { homNayHcm } from "@/lib/kpi-data";

/** Thẻ "Báo cáo công việc hôm nay" cho Giám đốc / Phó giám đốc / Kỹ thuật: x/y đã nộp, ai chưa nộp, bấm vào xem chi tiết. Người khác không thấy (trả về null); lỗi thì thẻ tự ẩn, không kéo sập trang. */
export async function TheBaoCaoCongViec() {
  let tq: Awaited<ReturnType<typeof layTongQuanBaoCao>> | null = null;
  try {
    if (await duocXemTongQuanBaoCao()) tq = await layTongQuanBaoCao(homNayHcm());
  } catch {
    tq = null;
  }
  if (!tq) return null;
  const chua = tq.dong.filter((d) => d.phai && !d.baoCao);
  return (
    <MucTrang tieuDe="Báo cáo công việc hôm nay" phai={<Link href="/cong-viec/tong-quan" className="font-medium text-nhan-dam underline-offset-4 hover:underline">Xem chi tiết</Link>}>
      {tq.phaiNop === 0 ? (
        <p className="text-[14px] text-muc-3">Hôm nay không có ai phải nộp báo cáo công việc.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-3"><span className="chu-tieu-de text-[34px] leading-none text-nhan-dam">{tq.daNop}/{tq.phaiNop}</span><span className="pb-1 text-[13px] text-muc-3">người đã nộp báo cáo</span></div>
          {chua.length > 0 ? (
            <ul className="flex flex-wrap gap-2">{chua.map((d) => <li key={d.nhanVienId}><NhanTrangThai kieu="loi">{d.hoTen} chưa nộp</NhanTrangThai></li>)}</ul>
          ) : (
            <NhanTrangThai kieu="tot">Tất cả đã nộp</NhanTrangThai>
          )}
        </div>
      )}
    </MucTrang>
  );
}
