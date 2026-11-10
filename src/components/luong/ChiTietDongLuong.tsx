"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { OTien } from "@/components/ui/OTien";
import { tinhLuong, type DauVaoLuong, type ThamSo } from "@/lib/luong/tinh-luong";
import { tienVN } from "@/lib/dinh-dang";
import { luuDongLuong } from "@/app/(app)/luong/actions";

export type DongLuongView = {
  id: string; ho_ten: string; chuc_danh: string; khoi_ten: string;
  luong_thoa_thuan: number; ty_le_kpi: number; thu_viec: boolean; khau_tru_10?: boolean; cong_chuan: number; cong_huong: number; ngay_lam: number; ty_le_ht_kpi: number;
  phu_cap: number; phu_cap_mien_thue: boolean; an_ca: boolean; dong_bh: boolean; so_nguoi_phu_thuoc: number;
  gio_ot_thuong: number; gio_ot_nghi_tuan: number; gio_ot_le: number; hoa_hong: number; thuong_khac: number; khau_tru_khac: number; ghi_chu: string | null;
  luong_chuc_danh: number; luong_kpi: number; phu_cap_thuc: number; tien_an: number; tien_ot: number; tong_thu_nhap: number;
  bh_xh: number; bh_yt: number; bh_tn: number; giam_tru: number; thu_nhap_tinh_thue: number; thue_tncn: number; thuc_linh: number; bh_cty: number;
};

const so = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Chi tiết một dòng lương: nhập công, giờ tăng ca, KPI, hoa hồng... và xem NGAY kết quả (tính lại tức thời bằng cùng hàm với máy chủ). */
export function ChiTietDongLuong({ dong, thamSo, suaDuoc, xong, huy }: { dong: DongLuongView; thamSo: ThamSo; suaDuoc: boolean; xong: () => void; huy: () => void }) {
  const router = useRouter();
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const [v, setV] = useState({
    congHuong: String(dong.cong_huong), ngayLam: String(dong.ngay_lam), tyLeHtKpi: String(dong.ty_le_ht_kpi),
    otThuong: String(dong.gio_ot_thuong), otNghi: String(dong.gio_ot_nghi_tuan), otLe: String(dong.gio_ot_le),
    hoaHong: dong.hoa_hong, thuongKhac: dong.thuong_khac, khauTru: dong.khau_tru_khac, ghiChu: dong.ghi_chu ?? "",
  });

  const kq = useMemo(() => {
    const dauVao: DauVaoLuong = {
      luongThoaThuan: dong.luong_thoa_thuan, tyLeKpi: dong.ty_le_kpi, thuViec: dong.thu_viec, khauTru10: !!dong.khau_tru_10, congChuan: dong.cong_chuan, congHuong: Math.min(so(v.congHuong), dong.cong_chuan), ngayLam: so(v.ngayLam),
      tyLeHtKpi: Math.min(so(v.tyLeHtKpi), 200), phuCap: dong.phu_cap, phuCapMienThue: dong.phu_cap_mien_thue, anCa: dong.an_ca, dongBh: dong.dong_bh, soNguoiPhuThuoc: dong.so_nguoi_phu_thuoc,
      gioOtThuong: so(v.otThuong), gioOtNghiTuan: so(v.otNghi), gioOtLe: so(v.otLe), hoaHong: v.hoaHong, thuongKhac: v.thuongKhac, khauTruKhac: v.khauTru,
    };
    return tinhLuong(dauVao, thamSo);
  }, [dong, v, thamSo]);

  const gui = () => {
    const fd = new FormData();
    fd.set("id", dong.id);
    fd.set("cong_huong", v.congHuong); fd.set("ngay_lam", v.ngayLam); fd.set("ty_le_ht_kpi", v.tyLeHtKpi);
    fd.set("gio_ot_thuong", v.otThuong); fd.set("gio_ot_nghi_tuan", v.otNghi); fd.set("gio_ot_le", v.otLe);
    fd.set("hoa_hong", String(v.hoaHong)); fd.set("thuong_khac", String(v.thuongKhac)); fd.set("khau_tru_khac", String(v.khauTru)); fd.set("ghi_chu", v.ghiChu);
    startXuLy(async () => {
      const r = await luuDongLuong(fd);
      if (r.loi) setLoi(r.loi);
      else {
        router.refresh();
        xong();
      }
    });
  };

  const o = (nhan: string, k: "congHuong" | "ngayLam" | "tyLeHtKpi" | "otThuong" | "otNghi" | "otLe", goiY?: string) => (
    <div>
      <label className={NHAN_O}>{nhan}</label>
      <input inputMode="decimal" value={v[k]} disabled={!suaDuoc} onChange={(e) => setV({ ...v, [k]: e.target.value })} className={`${O_NHAP} text-right tabular-nums`} />
      {goiY && <div className="mt-1 text-[12px] text-muc-3">{goiY}</div>}
    </div>
  );
  const dongKq = (nhan: string, giaTri: number, dam?: boolean, am?: boolean) => (
    <div className={`flex justify-between gap-4 py-1.5 ${dam ? "border-t border-vien pt-2.5 text-[15px] font-semibold text-muc" : "text-[14px] text-muc-2"}`}>
      <span>{nhan}</span>
      <span className="tabular-nums">{am && giaTri > 0 ? "−" : ""}{tienVN(giaTri)}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="text-[14px] text-muc-2">
        <strong className="font-semibold text-muc">{dong.ho_ten}</strong> · {dong.chuc_danh || "Chưa có chức danh"} · {dong.khoi_ten}
        {dong.thu_viec && <span className="ml-2 rounded-tag bg-canh-bao-nen px-2 py-px text-[12px] font-medium text-canh-bao">Thử việc</span>}
        <div className="mt-1 text-[13px] text-muc-3">Lương thỏa thuận {tienVN(dong.luong_thoa_thuan)} · KPI nền {dong.ty_le_kpi}% · công chuẩn {dong.cong_chuan}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {o("Công hưởng lương", "congHuong", `tối đa ${dong.cong_chuan}`)}
        {o("Ngày đi làm (tiền ăn)", "ngayLam")}
        {o("% hoàn thành KPI", "tyLeHtKpi", "tối đa 120%")}
        {o("Giờ tăng ca ngày thường", "otThuong")}
        {o("Giờ tăng ca nghỉ tuần", "otNghi")}
        {o("Giờ tăng ca ngày lễ", "otLe")}
        <div><label className={NHAN_O}>Hoa hồng</label><OTien giaTriMacDinh={v.hoaHong} voHieu={!suaDuoc} onDoi={(n) => setV((x) => ({ ...x, hoaHong: n }))} /></div>
        <div><label className={NHAN_O}>Thưởng khác</label><OTien giaTriMacDinh={v.thuongKhac} voHieu={!suaDuoc} onDoi={(n) => setV((x) => ({ ...x, thuongKhac: n }))} /></div>
        <div><label className={NHAN_O}>Khấu trừ khác (tạm ứng…)</label><OTien giaTriMacDinh={v.khauTru} voHieu={!suaDuoc} onDoi={(n) => setV((x) => ({ ...x, khauTru: n }))} /></div>
      </div>
      <div>
        <label className={NHAN_O}>Ghi chú</label>
        <textarea value={v.ghiChu} disabled={!suaDuoc} onChange={(e) => setV({ ...v, ghiChu: e.target.value })} className={`${O_NHIEU_DONG} min-h-[64px]`} />
      </div>

      <div className="rounded-[10px] border border-vien bg-giay-tram/50 px-5 py-4" aria-live="polite">
        <div className="nhan-muc pb-1">Kết quả (tính lại ngay khi bạn sửa)</div>
        {dongKq(dong.thu_viec ? "Lương thử việc theo công" : "Lương chức danh theo công", kq.luongChucDanh)}
        {dongKq("Lương KPI", kq.luongKpi)}
        {dongKq("Phụ cấp", kq.phuCapThuc)}
        {dongKq("Tiền ăn", kq.tienAn)}
        {dongKq("Tăng ca", kq.tienOt)}
        {dongKq("Hoa hồng và thưởng khác", v.hoaHong + v.thuongKhac)}
        {dongKq("Tổng thu nhập", kq.tongThuNhap, true)}
        {dongKq("Bảo hiểm người lao động (10,5%)", kq.bhXh + kq.bhYt + kq.bhTn, false, true)}
        {dongKq(`Thuế TNCN (thu nhập tính thuế ${tienVN(kq.thuNhapTinhThue)})`, kq.thueTncn, false, true)}
        {dongKq("Khấu trừ khác", v.khauTru, false, true)}
        {dongKq("Thực lĩnh", kq.thucLinh, true)}
        <div className="mt-1 text-[12px] text-muc-3">Công ty đóng thêm bảo hiểm {tienVN(kq.bhCty)} (không trừ vào lương).</div>
      </div>

      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="flex justify-end gap-2 border-t border-vien pt-4">
        <a href={`/phieu-luong/${dong.id}`} target="_blank" rel="noopener" className={`${NUT_PHU} inline-flex items-center`}>In phiếu</a>
        <button type="button" className={NUT_PHU} onClick={huy} disabled={dangXuLy}>{suaDuoc ? "Huỷ" : "Đóng"}</button>
        {suaDuoc && <button type="button" className={NUT_CHINH} onClick={gui} disabled={dangXuLy}>{dangXuLy ? "Đang lưu" : "Lưu dòng lương"}</button>}
      </div>
    </div>
  );
}
