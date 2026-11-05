"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { OTien } from "@/components/ui/OTien";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { luuThoaThuan } from "@/app/(app)/luong/actions";
import { tienVN } from "@/lib/dinh-dang";

export type ThoaThuanView = {
  id: string; ho_ten: string; chuc_danh: string; khoi_ten: string; trang_thai: string;
  thoaThuan: { luong_thoa_thuan: number; ty_le_kpi: number; phu_cap: number; phu_cap_mien_thue: boolean; an_ca: boolean; dong_bh: boolean; so_nguoi_phu_thuoc: number; kieu_cong: string; ghi_chu: string | null } | null;
};

/** Thỏa thuận lương của từng người: lương gộp, % KPI, phụ cấp, tiền ăn, bảo hiểm, người phụ thuộc, kiểu công. Dòng lương mỗi kỳ sẽ CHỤP lại các số này. */
export function ThoaThuanLuong({ ds, tienAnNgay }: { ds: ThoaThuanView[]; tienAnNgay: number }) {
  const router = useRouter();
  const [sua, setSua] = useState<ThoaThuanView | null>(null);
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const thieu = ds.filter((d) => !d.thoaThuan).length;

  const gui = () => {
    if (!formRef.current || !formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const r = await luuThoaThuan(fd);
      if (r.loi) setLoi(r.loi);
      else {
        setSua(null);
        setLoi(undefined);
        router.refresh();
      }
    });
  };
  const t = sua?.thoaThuan;

  return (
    <>
      {thieu > 0 && <div role="status" className="mb-4 rounded-nho bg-canh-bao-nen px-4 py-3 text-[14px] text-canh-bao">{thieu} người chưa có thỏa thuận lương nên sẽ chưa có dòng trong bảng lương.</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead>
            <tr className="nhan-muc border-b border-vien">
              <th className="py-3 pr-4 font-medium">Nhân viên</th>
              <th className="py-3 pr-4 text-right font-medium">Lương thỏa thuận</th>
              <th className="py-3 pr-4 text-right font-medium">KPI nền</th>
              <th className="py-3 pr-4 text-right font-medium">Phụ cấp</th>
              <th className="py-3 pr-4 font-medium">Bảo hiểm</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {ds.map((d) => (
              <tr key={d.id} className="h-[60px] border-b border-vien hover:bg-giay-tram/60">
                <td className="py-2 pr-4">
                  <div className="font-medium text-muc">{d.ho_ten}</div>
                  <div className="text-[13px] text-muc-3">{[d.chuc_danh, d.khoi_ten].filter(Boolean).join(" · ")}</div>
                </td>
                {d.thoaThuan ? (
                  <>
                    <td className="py-2 pr-4 text-right tabular-nums text-muc">{tienVN(d.thoaThuan.luong_thoa_thuan)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{d.thoaThuan.ty_le_kpi}%</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(d.thoaThuan.phu_cap)}</td>
                    <td className="py-2 pr-4"><NhanTrangThai kieu={d.thoaThuan.dong_bh ? "tot" : "tram"}>{d.thoaThuan.dong_bh ? "Có đóng" : "Không đóng"}</NhanTrangThai></td>
                  </>
                ) : (
                  <td colSpan={4} className="py-2 pr-4 text-muc-3">Chưa nhập thỏa thuận lương</td>
                )}
                <td className="py-2 text-right"><button type="button" className={NUT_CHU} onClick={() => setSua(d)}>{d.thoaThuan ? "Sửa" : "Nhập"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {ds.length === 0 && <p className="chu-tieu-de py-12 text-center text-[24px] text-muc-3">Chưa có nhân viên nào. Thêm nhân viên ở Hồ sơ nhân sự rồi quay lại nhập thỏa thuận lương.</p>}
      </div>

      <Hop mo={!!sua} dong={() => { setSua(null); setLoi(undefined); }} tieuDe="Thỏa thuận lương" moTa={sua ? `${sua.ho_ten} · ${sua.chuc_danh || "chưa có chức danh"}` : undefined}>
        {sua && (
          <form ref={formRef} key={sua.id} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
            <input type="hidden" name="nhan_vien_id" value={sua.id} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={NHAN_O} htmlFor="tt-luong">Lương thỏa thuận (gộp, chưa trừ bảo hiểm và thuế) *</label>
                <OTien id="tt-luong" ten="luong_thoa_thuan" giaTriMacDinh={t?.luong_thoa_thuan ?? 0} />
                <div className="mt-1 text-[12px] text-muc-3">{sua.trang_thai === "Thử việc" ? "Đang thử việc: nhập đủ 100% lương, bảng lương tự tính 85% (tỷ lệ ở Tham số lương)." : "Nhập đủ 100% lương. Khi nhân viên ở trạng thái Thử việc (Hồ sơ nhân sự), bảng lương tự tính 85% (tỷ lệ ở Tham số lương), không cần nhập tay."}</div>
              </div>
              <div>
                <label className={NHAN_O} htmlFor="tt-kpi">% KPI nền trong lương</label>
                <input id="tt-kpi" name="ty_le_kpi" type="number" min={0} max={50} defaultValue={t?.ty_le_kpi ?? ""} placeholder="0" className={`${O_NHAP} text-right`} />
                <div className="mt-1 text-[12px] text-muc-3">Để trống là 0%. Xuất bảng lương xem rồi điều chỉnh sau.</div>
              </div>
              <div>
                <label className={NHAN_O} htmlFor="tt-pc">Phụ cấp cố định khác mỗi tháng</label>
                <OTien id="tt-pc" ten="phu_cap" giaTriMacDinh={t?.phu_cap ?? 0} />
                <div className="mt-1 text-[12px] text-muc-3">Không gồm tiền ăn trưa (tiền ăn đã tự tính theo ngày công ở dưới).</div>
              </div>
              <div>
                <label className={NHAN_O} htmlFor="tt-kieu">Kiểu công</label>
                <Chon id="tt-kieu" ten="kieu_cong" giaTriMacDinh={t?.kieu_cong ?? "van_phong"} luaChon={[{ gia_tri: "van_phong", nhan: "Văn phòng (24 công)" }, { gia_tri: "van_hanh", nhan: "Vận hành (ngày trong tháng trừ Chủ nhật)" }]} />
              </div>
              <div>
                <label className={NHAN_O} htmlFor="tt-pt">Số người phụ thuộc đã đăng ký</label>
                <input id="tt-pt" name="so_nguoi_phu_thuoc" type="number" min={0} max={20} defaultValue={t?.so_nguoi_phu_thuoc ?? 0} className={`${O_NHAP} text-right`} />
              </div>
              <div className="flex flex-col gap-3 sm:col-span-2">
                <Gat ten="dong_bh" nhan="Đóng bảo hiểm (BHXH, BHYT, BHTN)" giaTriMacDinh={t?.dong_bh ?? true} />
                <Gat ten="an_ca" nhan="Hưởng tiền ăn theo ngày đi làm" giaTriMacDinh={t?.an_ca ?? true} />
                <div>
                  <label className={NHAN_O} htmlFor="tt-an">Phụ cấp ăn trưa (tự động)</label>
                  <input id="tt-an" readOnly tabIndex={-1} value={`${tienVN(tienAnNgay)} / ngày công`} className={`${O_NHAP} bg-giay-tram/60 text-right text-muc-2`} />
                  <div className="mt-1 text-[12px] text-muc-3">Bảng lương tự tính = mức này × số ngày công thực tế. Đổi mức ở Tham số lương. Không nhập vào phụ cấp cố định.</div>
                </div>
                <Gat ten="phu_cap_mien_thue" nhan="Phụ cấp được miễn thuế (vd điện thoại khoán)" giaTriMacDinh={t?.phu_cap_mien_thue ?? true} />
              </div>
              <div className="sm:col-span-2">
                <label className={NHAN_O} htmlFor="tt-gc">Ghi chú</label>
                <textarea id="tt-gc" name="ghi_chu" defaultValue={t?.ghi_chu ?? ""} className={`${O_NHIEU_DONG} min-h-[64px]`} />
              </div>
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={() => setSua(null)} disabled={dangXuLy}>Huỷ</button>
              <button type="button" className={NUT_CHINH} onClick={gui} disabled={dangXuLy}>{dangXuLy ? "Đang lưu" : "Lưu thỏa thuận"}</button>
            </div>
          </form>
        )}
      </Hop>
    </>
  );
}
