export const dynamic = "force-dynamic";

import Link from "next/link";
import { BangYeuCau } from "@/components/tuyen-dung/BangYeuCau";
import { BaoCaoTuyenDung } from "@/components/tuyen-dung/BaoCaoTuyenDung";
import { DanhSachTuyenDung } from "@/components/tuyen-dung/DanhSachTuyenDung";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { layDanhSachKhoi, layTuyenDungDayDu } from "@/lib/data";
import { layKenhDang, layYeuCauTuyenDung } from "@/lib/data-tuyen-dung";
import { tinhBaoCaoTuyenDung } from "@/lib/tuyen-dung";
import { yeuCauVaiTro } from "@/lib/auth";
import { layJd } from "@/lib/data-jd";

const TAB = [
  { ma: "yeu-cau", ten: "Yêu cầu" },
  { ma: "tin", ten: "Tin và ứng viên" },
  { ma: "bao-cao", ten: "Báo cáo" },
] as const;
/** Mô tả công việc (JD) từng vị trí nằm ở Sổ tuyển dụng; để một lối vào ngay trên thanh này cho dễ thấy. */
const LINK_JD = "/hr/jd-vi-tri";

export default async function TrangTuyenDung({ searchParams }: { searchParams: Promise<{ tab?: string; tin?: string; dang?: string }> }) {
  const { tab: tabThamSo, tin: tinThamSo, dang } = await searchParams;
  await yeuCauVaiTro(["admin", "ky_thuat"]);
  const [{ tin, ungVien }, khoi, yeuCau, kenh, jdRows] = await Promise.all([layTuyenDungDayDu(), layDanhSachKhoi(), layYeuCauTuyenDung(), layKenhDang(), layJd()]);
  const choTiepNhan = yeuCau.filter((y) => y.trang_thai === "Chờ tiếp nhận").length;
  // Link cũ (?tin=…, ?dang=1) luôn mở tab Tin; không chỉ định thì ưu tiên Yêu cầu khi còn yêu cầu chờ tiếp nhận.
  const tab = tabThamSo === "yeu-cau" || tabThamSo === "tin" || tabThamSo === "bao-cao" ? tabThamSo : tinThamSo || dang ? "tin" : choTiepNhan > 0 ? "yeu-cau" : "tin";
  const khoiLC = khoi.map((k) => ({ id: k.id, ten: k.ten }));

  return (
    <>
      <nav aria-label="Các phần của tuyển dụng" className="-mt-1 mb-5 flex gap-1 border-b border-vien" role="tablist">
        {TAB.map((t) => (
          <Link key={t.ma} role="tab" aria-selected={tab === t.ma} href={`/tuyen-dung?tab=${t.ma}`} className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] ${tab === t.ma ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>
            {t.ten}{t.ma === "yeu-cau" && choTiepNhan > 0 && <span className="ml-2 rounded-tag bg-canh-bao-nen px-1.5 py-px text-[11px] font-semibold text-canh-bao">{choTiepNhan}</span>}
          </Link>
        ))}
        <Link href={LINK_JD} className="-mb-px ml-auto border-b-2 border-transparent px-4 py-2.5 text-[14px] text-muc-2 hover:text-muc">Mô tả công việc (JD)</Link>
      </nav>

      {tab === "yeu-cau" && (
        <>
          <TieuDeTrang tieuDe="Yêu cầu tuyển dụng" phu="Sếp hoặc trưởng bộ phận gửi yêu cầu → HCNS tiếp nhận → tạo tin và đăng → ghi kết quả. Không xoá yêu cầu, chỉ huỷ kèm lý do." />
          <BangYeuCau yeuCau={yeuCau} khoi={khoiLC} quanTri choGui trong="Chưa có yêu cầu tuyển dụng nào. Khi trưởng bộ phận gửi yêu cầu, nó hiện ở đây để HCNS tiếp nhận." />
        </>
      )}
      {tab === "tin" && (
        <DanhSachTuyenDung
          tin={tin.map((t) => ({ id: t.id, vi_tri: t.vi_tri, khoi_id: t.khoi_id, khoi_ten: t.khoi_ten, so_luong_can: t.so_luong_can, trang_thai: t.trang_thai, han_nop: t.han_nop, mo_ta: t.mo_ta }))}
          ungVien={ungVien}
          kenh={kenh}
          jd={jdRows}
          khoi={khoiLC}
          tinBanDau={tinThamSo}
          moDangTuyen={dang === "1"}
        />
      )}
      {tab === "bao-cao" && (
        <>
          <TieuDeTrang tieuDe="Báo cáo tuyển dụng" phu="Phễu ứng viên, nguồn, chi phí theo kênh, chi phí mỗi người nhận việc và thời gian lấp đầy vị trí." />
          <BaoCaoTuyenDung bc={tinhBaoCaoTuyenDung({ tin: tin.map((t) => ({ id: t.id, vi_tri: t.vi_tri, so_luong_can: t.so_luong_can, yeu_cau_id: t.yeu_cau_id })), ungVien, kenh, yeuCau })} />
        </>
      )}
    </>
  );
}
