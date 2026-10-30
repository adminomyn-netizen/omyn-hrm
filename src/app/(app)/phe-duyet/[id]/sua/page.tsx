export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { yeuCauDangNhapDaDuyet } from "@/lib/phe-duyet-quyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { FormPhieu } from "@/components/phe-duyet/FormPhieu";
import { mauTheoMa } from "@/lib/phe-duyet-mau";
import { docDanhMuc, taiDanhSachNhanSu, taiPhieuCoTheNoi, taiPhieuDeXem } from "@/lib/phe-duyet-data";
import { quyenTrenPhieu } from "@/lib/phe-duyet";

/** Sửa phiếu theo yêu cầu bổ sung rồi nộp lại (luồng duyệt chạy lại từ bước đầu). */
export default async function TrangSuaPhieu({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauDangNhapDaDuyet();
  const { id } = await params;
  const x = await taiPhieuDeXem(id, nd);
  const mau = x && mauTheoMa(x.phieu.ma_phieu);
  if (!x || !mau) notFound();
  const q = quyenTrenPhieu({ trangThai: x.phieu.trang_thai, nguoiNopId: x.phieu.nguoi_nop_id, buocHienTai: x.phieu.buoc_hien_tai }, x.o, { nhanVienId: x.nv?.id ?? null, userId: nd.id });
  if (!q.suaVaNopLai) redirect(`/phe-duyet/${id}`);
  const [danhMuc, nhanSu, phieuNoi] = await Promise.all([docDanhMuc(), taiDanhSachNhanSu(), taiPhieuCoTheNoi(nd.id)]);
  const tepCu: Record<string, string[]> = {};
  for (const f of x.tep) (tepCu[f.truong] ??= []).push(f.ten_tep);
  const y = [...x.lichSu].reverse().find((h) => h.hanh_dong === "Yêu cầu bổ sung");
  return (
    <>
      <TieuDeTrang tieuDe={`Sửa ${mau.ten}`} phu={<><span className="font-mono">{x.phieu.so_phieu}</span>{y?.ghi_chu ? ` · Cần bổ sung: “${y.ghi_chu}”` : ""}</>} />
      <FormPhieu mau={mau} danhMuc={danhMuc} nhanSu={nhanSu} phieuNoi={phieuNoi} ban={x.phieu.du_lieu} tepCu={tepCu} nopLai={id} />
    </>
  );
}
