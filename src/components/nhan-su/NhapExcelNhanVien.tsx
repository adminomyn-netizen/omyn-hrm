"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { nhapNhanVienTuTep, type KetQuaNhap } from "@/app/(app)/nhan-su/actions";

/** Nhập nhân viên hàng loạt từ Excel: tải mẫu → chọn tệp → "Kiểm tra" (không ghi) → "Nhập" (chỉ khi không dòng nào lỗi). */
export function NhapExcelNhanVien() {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [tep, setTep] = useState<File | null>(null);
  const [kq, setKq] = useState<KetQuaNhap | null>(null);
  const [dangXuLy, startXuLy] = useTransition();
  const oTep = useRef<HTMLInputElement>(null);

  const dong = () => {
    setMo(false);
    setTep(null);
    setKq(null);
  };
  const chay = (cheDo: "xem" | "nhap") => {
    if (!tep) return setKq({ loi: "Chọn một tệp Excel trước." });
    const fd = new FormData();
    fd.set("tep", tep);
    fd.set("che_do", cheDo);
    startXuLy(async () => {
      const r = await nhapNhanVienTuTep(fd);
      setKq(r);
      if (r.daNhap) router.refresh();
    });
  };
  const sachLoi = !!kq && !kq.loi && kq.ok && (kq.loiDong?.length ?? 0) === 0 && !kq.daNhap;

  return (
    <>
      <button type="button" className={NUT_PHU} onClick={() => setMo(true)}>Nhập từ Excel</button>
      <Hop mo={mo} dong={dong} tieuDe="Nhập nhân viên từ Excel" moTa="Nhập nhiều hồ sơ một lần. Tệp được kiểm tra trước, chỉ nhập khi không có dòng nào lỗi." rong="rong">
        <div className="space-y-4 text-[14px]">
          <ol className="list-decimal space-y-1 pl-5 text-muc-2">
            <li><a href="/api/xuat/mau-nhan-vien" download className="font-medium text-nhan-dam underline-offset-4 hover:underline">Tải tệp mẫu</a>, điền mỗi nhân viên một dòng (bắt buộc: Họ và tên, Khối, Ngày vào làm dạng dd/mm/yyyy).</li>
            <li>Tên Khối phải đúng với danh mục (xem trang &quot;Danh mục&quot; trong tệp mẫu). Mã nhân viên và email không được trùng.</li>
            <li>Chọn tệp, bấm Kiểm tra, sửa các dòng báo lỗi nếu có, rồi bấm Nhập.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={oTep} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => { setTep(e.target.files?.[0] ?? null); setKq(null); }} />
            <button type="button" className={NUT_PHU} onClick={() => oTep.current?.click()}>Chọn tệp</button>
            <span className="text-muc-2">{tep ? `${tep.name} · ${Math.max(1, Math.round(tep.size / 1024))} KB` : "Chưa chọn tệp"}</span>
          </div>

          {kq?.loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-loi">{kq.loi}</div>}
          {kq && !kq.loi && kq.tongDong !== undefined && (
            <div role="status" className={`rounded-nho px-3 py-2.5 ${sachLoi || kq.daNhap ? "bg-nhan-nhat text-nhan-dam" : "bg-canh-bao-nen text-canh-bao"}`}>
              {kq.daNhap ? `Đã nhập ${kq.daNhap} nhân viên.` : `Đọc được ${kq.tongDong} dòng: ${kq.hopLe} hợp lệ, ${(kq.loiDong?.length ?? 0)} lỗi.`}
            </div>
          )}
          {kq?.loiDong && kq.loiDong.length > 0 && (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-nho border border-vien px-3 py-2">
              {kq.loiDong.map((l) => <li key={`${l.dong}-${l.thongBao}`}><span className="font-medium tabular-nums text-muc">Dòng {l.dong}:</span> <span className="text-muc-2">{l.thongBao}</span></li>)}
            </ul>
          )}

          <div className="flex justify-end gap-2 border-t border-vien pt-4">
            <button type="button" className={NUT_PHU} onClick={dong}>{kq?.daNhap ? "Xong" : "Đóng"}</button>
            <button type="button" className={NUT_PHU} disabled={dangXuLy || !tep} onClick={() => chay("xem")}>{dangXuLy ? "Đang xử lý" : "Kiểm tra"}</button>
            <button type="button" className={NUT_CHINH} disabled={dangXuLy || !sachLoi} onClick={() => chay("nhap")}>Nhập {sachLoi ? kq?.hopLe : ""} nhân viên</button>
          </div>
        </div>
      </Hop>
    </>
  );
}
