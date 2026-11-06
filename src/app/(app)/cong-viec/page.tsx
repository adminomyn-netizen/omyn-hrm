export const dynamic = "force-dynamic";

import { BangCongViec } from "@/components/cong-viec/BangCongViec";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { TabHieuSuat } from "@/components/hieu-suat/TabHieuSuat";
import { ThanhCongViec } from "@/components/cong-viec/ThanhCongViec";
import { taiCongViec } from "@/lib/cong-viec-data";
import { duocXemTongQuanBaoCao } from "@/lib/bao-cao-cv-data";
import { mienBaoCaoCv } from "@/lib/bao-cao-cv";
import { sapMauTheoKhoi } from "@/lib/mau-cong-viec";
import { dbHr } from "@/lib/hr-db";
import { layNguoiDungDaDuyet } from "@/lib/auth";

/** Công việc của tôi (và của nhóm với trưởng phòng/Quản trị): thêm nhanh một dòng, ghi số lượng đã làm, theo dõi quá hạn. */
export default async function TrangCongViec() {
  const c = await taiCongViec();
  const laQuanLy = c.quanTri || c.trongTam.length > 1;
  const nd = await layNguoiDungDaDuyet();
  const db = dbHr();
  const [coTongQuan, ho, baoCao] = await Promise.all([
    duocXemTongQuanBaoCao(),
    c.toi ? db.from("nhan_vien").select("chuc_danh, quyen_giam_doc, khoi(ten)").eq("id", c.toi.id).maybeSingle() : Promise.resolve({ data: null }),
    c.toi ? db.from("cong_viec_bao_cao").select("tom_tat, link, nop_luc").eq("nhan_vien_id", c.toi.id).eq("ngay", c.homNay).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const hs = ho.data as { chuc_danh: string | null; quyen_giam_doc: boolean | null; khoi: { ten?: string } | null } | null;
  const phaiBaoCao = !!c.toi && !mienBaoCaoCv(nd.vaiTro, hs?.chuc_danh, hs?.quyen_giam_doc);
  return (
    <>
      <TabHieuSuat dang="cong-viec" />
      <ThanhCongViec dang="viec" coTongQuan={coTongQuan} />
      <TieuDeTrang
        tieuDe="Công việc"
        phu={
          laQuanLy
            ? "Việc của bạn và của nhóm: thêm nhanh, ghi số lượng đã làm, xem việc quá hạn."
            : "Việc của bạn: gõ một dòng để thêm, bấm dấu cộng để ghi số lượng đã làm."
        }
      />
      <BangCongViec
        dong={c.viec}
        nguoi={c.trongTam.map((x) => ({ id: x.id, ten: x.ten }))}
        toiId={c.toi?.id ?? null}
        homNay={c.homNay}
        quanLy={laQuanLy}
        baoCao={baoCao.data ? { tomTat: baoCao.data.tom_tat as string, link: (baoCao.data.link as string | null) ?? null, nopLuc: baoCao.data.nop_luc as string } : null}
        phaiBaoCao={phaiBaoCao}
        mau={sapMauTheoKhoi(hs?.khoi?.ten)}
      />
    </>
  );
}
