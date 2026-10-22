export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { QuanLyLuong } from "@/components/luong/QuanLyLuong";
import { PhieuLuongCuaToi, type PhieuView } from "@/components/luong/PhieuLuongCuaToi";
import { layDongLuongCuaKy, layKyLuong, layNhanVienIdTheoUser, layPhieuLuongCuaToi, layThamSoLuong, layThoaThuanLuong } from "@/lib/data";
import { layNguoiDungDaDuyet } from "@/lib/auth";
import { THAM_SO_MAC_DINH, type ThamSo } from "@/lib/luong/tinh-luong";
import type { DongLuongView } from "@/components/luong/ChiTietDongLuong";

export default async function TrangLuong({ searchParams }: { searchParams: Promise<{ ky?: string }> }) {
  const nd = await layNguoiDungDaDuyet();

  // Nhân viên: chỉ phiếu lương đã duyệt của chính mình.
  if (nd.vaiTro === "nhan_vien") {
    const nvId = await layNhanVienIdTheoUser(nd.id);
    const ds = nvId ? await layPhieuLuongCuaToi(nvId) : [];
    const phieu: PhieuView[] = ds.map((d) => ({
      id: d.id, ten_ky: d.ky?.ten_ky ?? "", trang_thai: d.ky?.trang_thai ?? "", cong_chuan: Number(d.cong_chuan), cong_huong: Number(d.cong_huong),
      luong_chuc_danh: Number(d.luong_chuc_danh), luong_kpi: Number(d.luong_kpi), phu_cap_thuc: Number(d.phu_cap_thuc), tien_an: Number(d.tien_an), tien_ot: Number(d.tien_ot),
      hoa_hong: Number(d.hoa_hong), thuong_khac: Number(d.thuong_khac), tong_thu_nhap: Number(d.tong_thu_nhap), bh_xh: Number(d.bh_xh), bh_yt: Number(d.bh_yt), bh_tn: Number(d.bh_tn),
      thue_tncn: Number(d.thue_tncn), khau_tru_khac: Number(d.khau_tru_khac), thuc_linh: Number(d.thuc_linh),
    }));
    return (
      <div className="space-y-10">
        <TieuDeTrang tieuDe="Phiếu lương" phu="Phiếu lương các kỳ đã duyệt của bạn" />
        <PhieuLuongCuaToi ds={phieu} />
      </div>
    );
  }

  // Lương là dữ liệu nhạy cảm: chỉ Quản trị.
  if (nd.vaiTro !== "admin") redirect("/dashboard");

  const { ky: kyThamSo } = await searchParams;
  const [ky, thoaThuan, thamSoDs] = await Promise.all([layKyLuong(), layThoaThuanLuong(), layThamSoLuong()]);
  const chon = ky.find((k) => k.id === kyThamSo)?.id ?? ky[0]?.id ?? "";
  const dongRaw = chon ? await layDongLuongCuaKy(chon) : [];
  const thamSo: ThamSo = { ...THAM_SO_MAC_DINH };
  for (const t of thamSoDs) thamSo[t.khoa] = t.gia_tri;
  const dong = dongRaw.map((d) => ({
    ...d,
    luong_thoa_thuan: Number(d.luong_thoa_thuan), phu_cap: Number(d.phu_cap), cong_chuan: Number(d.cong_chuan), cong_huong: Number(d.cong_huong), ngay_lam: Number(d.ngay_lam),
    gio_ot_thuong: Number(d.gio_ot_thuong), gio_ot_nghi_tuan: Number(d.gio_ot_nghi_tuan), gio_ot_le: Number(d.gio_ot_le), hoa_hong: Number(d.hoa_hong), thuong_khac: Number(d.thuong_khac), khau_tru_khac: Number(d.khau_tru_khac),
    luong_chuc_danh: Number(d.luong_chuc_danh), luong_kpi: Number(d.luong_kpi), phu_cap_thuc: Number(d.phu_cap_thuc), tien_an: Number(d.tien_an), tien_ot: Number(d.tien_ot), tong_thu_nhap: Number(d.tong_thu_nhap),
    bh_xh: Number(d.bh_xh), bh_yt: Number(d.bh_yt), bh_tn: Number(d.bh_tn), giam_tru: Number(d.giam_tru), thu_nhap_tinh_thue: Number(d.thu_nhap_tinh_thue), thue_tncn: Number(d.thue_tncn), thuc_linh: Number(d.thuc_linh), bh_cty: Number(d.bh_cty),
  })) as DongLuongView[];

  return (
    <div className="space-y-8">
      <TieuDeTrang tieuDe="Lương" phu="Kỳ lương, thỏa thuận lương và tham số tính lương" />
      <QuanLyLuong ky={ky} chon={chon} dong={dong} thamSo={thamSo} thoaThuan={thoaThuan} thamSoDs={thamSoDs} />
    </div>
  );
}
