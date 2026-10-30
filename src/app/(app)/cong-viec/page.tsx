export const dynamic = "force-dynamic";

import { BangCongViec } from "@/components/cong-viec/BangCongViec";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { taiCongViec } from "@/lib/cong-viec-data";

/** Công việc của tôi (và của nhóm với trưởng phòng/Quản trị): thêm nhanh một dòng, ghi số lượng đã làm, theo dõi quá hạn. */
export default async function TrangCongViec() {
  const c = await taiCongViec();
  const laQuanLy = c.quanTri || c.trongTam.length > 1;
  return (
    <>
      <TieuDeTrang tieuDe="Công việc" phu={laQuanLy ? "Việc của bạn và của nhóm: thêm nhanh, ghi số lượng đã làm, xem việc quá hạn." : "Việc của bạn: gõ một dòng để thêm, bấm dấu cộng để ghi số lượng đã làm."} />
      <BangCongViec dong={c.viec} nguoi={c.trongTam.map((x) => ({ id: x.id, ten: x.ten }))} toiId={c.toi?.id ?? null} homNay={c.homNay} quanLy={laQuanLy} />
    </>
  );
}
