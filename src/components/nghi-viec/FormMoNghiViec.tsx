"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_CHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { taoHoSoNghiViec } from "@/app/(app)/nghi-viec/actions";

export function FormMoNghiViec({ nhanSu, homNay }: { nhanSu: { id: string; ten: string }[]; homNay: string }) {
  const router = useRouter();
  const [nv, setNv] = useState("");
  const [loai, setLoai] = useState("Đúng hạn");
  const [ngayNop, setNgayNop] = useState(homNay);
  const [ngayCuoi, setNgayCuoi] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState<string>();
  const [dang, batDau] = useTransition();
  return (
    <div className="the-noi the-noi-thap max-w-2xl p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={NHAN_O}>Nhân sự nghỉ việc <span className="text-loi">*</span></label><Chon ariaLabel="Nhân sự" trong="Chọn người" giaTri={nv} onDoi={setNv} luaChon={nhanSu.map((n) => ({ gia_tri: n.id, nhan: n.ten }))} /></div>
        <div><label className={NHAN_O}>Loại nghỉ việc</label><Chon ariaLabel="Loại" giaTri={loai} onDoi={setLoai} luaChon={[{ gia_tri: "Đúng hạn", nhan: "Đúng hạn (báo trước đủ)" }, { gia_tri: "Trước hạn", nhan: "Trước hạn" }]} /></div>
        <div />
        <div><label className={NHAN_O}>Ngày nộp đơn <span className="text-loi">*</span></label><NgayChon ariaLabel="Ngày nộp đơn" giaTri={ngayNop} onDoi={setNgayNop} tuNam={2020} denNam={2100} /></div>
        <div><label className={NHAN_O}>Ngày làm việc cuối cùng <span className="text-loi">*</span></label><NgayChon ariaLabel="Ngày làm việc cuối cùng" giaTri={ngayCuoi} onDoi={setNgayCuoi} tuNam={2020} denNam={2100} /></div>
        <div className="sm:col-span-2"><label className={NHAN_O}>Lý do (tuỳ chọn)</label><textarea value={lyDo} onChange={(e) => setLyDo(e.target.value)} maxLength={400} className={O_NHIEU_DONG} /></div>
      </div>
      {loi && <p role="alert" className="mt-4 text-[14px] text-loi">{loi}</p>}
      <div className="mt-5 flex items-center gap-3 border-t border-vien pt-5">
        <button type="button" disabled={dang} className={NUT_CHINH} onClick={() => batDau(async () => { setLoi(undefined); const r = await taoHoSoNghiViec({ nhanVienId: nv, loai, ngayNop, ngayCuoi, lyDo }); if (!r.ok) { setLoi(r.loi); return; } router.push(`/nghi-viec/${r.id}`); })}>{dang ? "Đang mở…" : "Mở hồ sơ nghỉ việc"}</button>
        <button type="button" className={NUT_CHU} onClick={() => router.back()}>Quay lại</button>
      </div>
      <p className="mt-4 text-[12px] text-muc-3">Nếu người đó đã nộp phiếu “Xin nghỉ việc” trong mục Phê duyệt, hồ sơ này tự mở khi phiếu được duyệt xong — không cần mở tay.</p>
    </div>
  );
}
