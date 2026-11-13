export const dynamic = "force-dynamic";

import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NoiQuyBang, type TaiLieu } from "@/components/noi-quy/NoiQuyBang";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { dbHr } from "@/lib/hr-db";
import { duocQuanLyNoiQuy } from "@/lib/noi-quy";

/** Nội quy & chính sách: mọi người đã duyệt xem và tải; Quản trị và Kỹ thuật tải lên, xoá. */
export default async function TrangNoiQuy() {
  const nd = await layNguoiDungDaDuyet();
  const { data } = await dbHr()
    .from("noi_quy_tai_lieu")
    .select("id, loai, ten, ghi_chu, ten_tep, kich_thuoc, ten_nguoi_tai, tao_luc")
    .order("tao_luc", { ascending: false });
  const ds: TaiLieu[] = (data ?? []).map((t) => ({
    id: t.id as string,
    loai: t.loai as string,
    ten: t.ten as string,
    ghiChu: (t.ghi_chu as string | null) ?? "",
    tenTep: t.ten_tep as string,
    kichThuoc: Number(t.kich_thuoc),
    nguoiTai: (t.ten_nguoi_tai as string) || "",
    taoLuc: t.tao_luc as string,
  }));
  return (
    <>
      <TieuDeTrang tieuDe="Nội quy & chính sách" phu="Nội quy lao động, quy chế thưởng phạt và mẫu hợp đồng. Mở để xem hoặc tải về." />
      <NoiQuyBang ds={ds} quanLy={duocQuanLyNoiQuy(nd.vaiTro)} />
    </>
  );
}
