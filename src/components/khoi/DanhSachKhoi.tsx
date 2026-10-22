"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { luuKhoi, xoaKhoi } from "@/app/(app)/khoi/actions";

export type DongKhoi = { id: string; ten: string; mo_ta: string | null; soNhanVien: number; soTinMo: number };

/** Quản lý khối (phòng ban): thêm/sửa/xoá bằng popup. Khối là danh mục dùng khi thêm nhân viên và đăng tuyển. */
export function DanhSachKhoi({ khoi }: { khoi: DongKhoi[] }) {
  const router = useRouter();
  const [hop, setHop] = useState<{ k: "form"; khoi?: DongKhoi } | { k: "xoa"; khoi: DongKhoi } | null>(null);
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const dong = () => {
    setHop(null);
    setLoi(undefined);
  };
  const gui = () => {
    if (!formRef.current || !formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const kq = await luuKhoi(fd);
      if (kq.loi) setLoi(kq.loi);
      else {
        dong();
        router.refresh();
      }
    });
  };
  const xoa = (k: DongKhoi) => {
    const fd = new FormData();
    fd.set("id", k.id);
    startXuLy(async () => {
      const kq = await xoaKhoi(fd);
      if (kq.loi) setLoi(kq.loi);
      else {
        dong();
        router.refresh();
      }
    });
  };

  const tongNv = khoi.reduce((t, k) => t + k.soNhanVien, 0);
  return (
    <>
      <TieuDeTrang tieuDe="Khối và phòng ban" phu={`${khoi.length} khối · ${tongNv} nhân viên đang làm`}>
        <button type="button" className={NUT_CHINH} onClick={() => setHop({ k: "form" })}>+ Thêm khối</button>
      </TieuDeTrang>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead>
            <tr className="nhan-muc border-b border-vien">
              <th className="py-3 pr-4 font-medium">Khối</th>
              <th className="py-3 pr-4 font-medium">Mô tả</th>
              <th className="py-3 pr-4 text-right font-medium">Nhân viên</th>
              <th className="py-3 pr-4 text-right font-medium">Tin đang mở</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {khoi.map((k) => (
              <tr key={k.id} className="h-[60px] border-b border-vien hover:bg-giay-tram/60">
                <td className="py-2 pr-4 font-medium text-muc">{k.ten}</td>
                <td className="max-w-[360px] truncate py-2 pr-4 text-muc-2" title={k.mo_ta ?? undefined}>{k.mo_ta}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {k.soNhanVien > 0 ? <Link href={`/nhan-su?q=${encodeURIComponent(k.ten)}`} className="font-medium text-nhan-dam underline-offset-4 hover:underline">{k.soNhanVien}</Link> : <span className="text-muc-3">0</span>}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-muc-2">{k.soTinMo}</td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-4">
                    <button type="button" className={NUT_CHU} onClick={() => setHop({ k: "form", khoi: k })}>Sửa</button>
                    <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ k: "xoa", khoi: k })}>Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {khoi.length === 0 && <p className="chu-tieu-de py-14 text-center text-[24px] text-muc-3">Chưa có khối nào. Thêm khối đầu tiên để bắt đầu nhập nhân viên.</p>}
      </div>

      <Hop mo={hop?.k === "form"} dong={dong} tieuDe={hop?.k === "form" && hop.khoi ? "Sửa khối" : "Thêm khối"} moTa="Khối dùng để xếp nhân viên và tin tuyển dụng.">
        {hop?.k === "form" && (
          <form ref={formRef} key={hop.khoi?.id ?? "moi"} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
            {hop.khoi && <input type="hidden" name="id" value={hop.khoi.id} />}
            <div>
              <label htmlFor="k-ten" className={NHAN_O}>Tên khối *</label>
              <input id="k-ten" name="ten" required defaultValue={hop.khoi?.ten ?? ""} placeholder="Ví dụ: Marketing & Ecom" className={O_NHAP} />
            </div>
            <div>
              <label htmlFor="k-mo-ta" className={NHAN_O}>Mô tả</label>
              <textarea id="k-mo-ta" name="mo_ta" defaultValue={hop.khoi?.mo_ta ?? ""} placeholder="Khối này gồm những chức danh nào" className={O_NHIEU_DONG} />
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" onClick={dong} disabled={dangXuLy} className={NUT_PHU}>Huỷ</button>
              <button type="button" onClick={gui} disabled={dangXuLy} className={NUT_CHINH}>{dangXuLy ? "Đang lưu" : hop.khoi ? "Lưu thay đổi" : "Thêm khối"}</button>
            </div>
          </form>
        )}
      </Hop>

      <Hop mo={hop?.k === "xoa"} dong={dong} tieuDe="Xoá khối">
        {hop?.k === "xoa" && (
          <div className="space-y-4">
            <p className="text-[15px] text-muc-2">
              Xoá khối <strong className="font-semibold text-muc">{hop.khoi.ten}</strong>? Chỉ xoá được khi khối không còn nhân viên hay tin tuyển dụng nào.
            </p>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={dong} disabled={dangXuLy}>Huỷ</button>
              <button type="button" disabled={dangXuLy} onClick={() => xoa(hop.khoi)} className="h-10 rounded-nho bg-loi px-4 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60">Xoá khối</button>
            </div>
          </div>
        )}
      </Hop>
    </>
  );
}
