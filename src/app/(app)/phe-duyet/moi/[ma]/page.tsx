export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { yeuCauDangNhapDaDuyet } from "@/lib/phe-duyet-quyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { FormPhieu } from "@/components/phe-duyet/FormPhieu";
import { mauTheoMa } from "@/lib/phe-duyet-mau";
import { docDanhMuc, docNhomMa, taiDanhSachNhanSu, taiPhieuCoTheNoi } from "@/lib/phe-duyet-data";

export default async function TrangTaoPhieu({ params }: { params: Promise<{ ma: string }> }) {
  const nd = await yeuCauDangNhapDaDuyet();
  const { ma } = await params;
  const mau = mauTheoMa(ma);
  if (!mau) notFound();
  const [danhMuc, nhanSu, phieuNoi, nhom] = await Promise.all([docDanhMuc(), taiDanhSachNhanSu(), taiPhieuCoTheNoi(nd.id), docNhomMa()]);
  const k = nhom[ma]?.nhom ?? mau.nhomMacDinh;
  return (
    <>
      <TieuDeTrang tieuDe={mau.ten} phu={`${mau.moTa} Mã phiếu sẽ có dạng ${k}-AAMM-0001.`} />
      <FormPhieu mau={mau} danhMuc={danhMuc} nhanSu={nhanSu} phieuNoi={phieuNoi} />
    </>
  );
}
