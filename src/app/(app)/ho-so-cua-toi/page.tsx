export const dynamic = "force-dynamic";

import { HoSoNhanVien } from "@/components/nhan-su/HoSoNhanVien";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { layNhanVienIdTheoUser } from "@/lib/data";
import { layHoSoDayDu } from "@/lib/data-ho-so";

/** Hồ sơ của chính mình: tự điền sơ yếu lý lịch và tải giấy tờ; HCNS xác nhận sau. */
export default async function TrangHoSoCuaToi() {
  const nd = await layNguoiDungDaDuyet();
  const nvId = await layNhanVienIdTheoUser(nd.id);
  const du = nvId ? await layHoSoDayDu(nvId) : null;
  if (!du) {
    return (
      <>
        <TieuDeTrang tieuDe="Hồ sơ của tôi" />
        <p className="max-w-[560px] text-[15px] leading-relaxed text-muc-2">Tài khoản của bạn chưa được gắn với hồ sơ nhân sự. Nhờ phòng Hành chính nhân sự gắn hồ sơ rồi quay lại đây để điền thông tin và tải giấy tờ.</p>
      </>
    );
  }
  return (
    <>
      <TieuDeTrang tieuDe="Hồ sơ của tôi" phu="Điền sơ yếu lý lịch và tải giấy tờ. HCNS xác nhận hoặc yêu cầu bổ sung ngay trên hồ sơ này." />
      <HoSoNhanVien du={du} quanTri={nd.vaiTro === "admin" || nd.vaiTro === "ky_thuat"} />
    </>
  );
}
