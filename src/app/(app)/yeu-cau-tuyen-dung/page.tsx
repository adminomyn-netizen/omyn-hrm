export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { BangYeuCau } from "@/components/tuyen-dung/BangYeuCau";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { layDanhSachKhoi } from "@/lib/data";
import { coQuyenGuiYeuCau, layYeuCauTuyenDung } from "@/lib/data-tuyen-dung";

/** Trưởng bộ phận gửi yêu cầu tuyển dụng và xem kết quả xử lý. Quản trị/Kỹ thuật xử lý ở trang Tuyển dụng. */
export default async function TrangYeuCauTuyenDung() {
  const nd = await layNguoiDungDaDuyet();
  if (nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat") redirect("/tuyen-dung?tab=yeu-cau");
  const { ok, nhanVienId } = await coQuyenGuiYeuCau(nd.id, nd.vaiTro);
  if (!ok) {
    return (
      <>
        <TieuDeTrang tieuDe="Yêu cầu tuyển dụng" />
        <p className="max-w-[560px] text-[15px] leading-relaxed text-muc-2">
          Mục này dành cho trưởng bộ phận (người đang quản lý ít nhất một nhân viên). Cần thêm người cho bộ phận của bạn thì nhờ trưởng bộ phận hoặc phòng Hành chính nhân sự gửi yêu cầu.
        </p>
      </>
    );
  }
  const [yeuCau, khoi] = await Promise.all([layYeuCauTuyenDung(nhanVienId), layDanhSachKhoi()]);
  return (
    <>
      <TieuDeTrang tieuDe="Yêu cầu tuyển dụng" phu="Gửi yêu cầu cho phòng Hành chính nhân sự và theo dõi từng bước: chờ tiếp nhận, đã tiếp nhận, đang đăng tin, hoàn thành." />
      <BangYeuCau yeuCau={yeuCau} khoi={khoi.map((k) => ({ id: k.id, ten: k.ten }))} quanTri={false} choGui trong="Bạn chưa gửi yêu cầu nào. Bấm “Gửi yêu cầu tuyển dụng” khi bộ phận cần thêm người." />
    </>
  );
}
