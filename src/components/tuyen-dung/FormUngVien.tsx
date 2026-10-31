"use client";

import { useRef, useState, useTransition } from "react";
import { luuUngVien } from "@/app/(app)/tuyen-dung/actions";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { CHON_TEP_ACCEPT, TepDinhKem, taiTepLen } from "@/components/hr/TepDinhKem";
import { BUOC_UNG_VIEN, NGUON_UNG_VIEN } from "@/lib/tuyen-dung";
import { MAN_UNG_VIEN } from "@/lib/tep-dinh-kem";

export type UngVien = {
  id: string;
  tin_tuyen_dung_id: string;
  ho_ten: string;
  email: string | null;
  dien_thoai: string | null;
  trang_thai: string;
  nam_sinh: number | null;
  nguon: string | null;
  link_cv: string | null;
  ghi_chu: string | null;
  ngay_phong_van: string | null;
  ngay_nhan_ho_so: string;
};

export function FormUngVien({ tinId, coSan, xong, huy }: { tinId: string; coSan?: UngVien; xong: () => void; huy: () => void }) {
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const [tepCho, setTepCho] = useState<File | null>(null);
  const [daLuuId, setDaLuuId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

  const gui = () => {
    if (!formRef.current || !formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const kq = await luuUngVien(fd);
      if (kq.loi) return setLoi(kq.loi);
      if (tepCho && kq.id) {
        const e = await taiTepLen({ man: MAN_UNG_VIEN, dongId: kq.id, loai: "CV", file: tepCho });
        if (e) {
          // Ứng viên đã lưu: giữ form ở chế độ tải tệp để không thêm trùng.
          setDaLuuId(kq.id);
          return setLoi(`Đã lưu ứng viên nhưng tệp CV chưa tải lên được: ${e} Bấm chọn tệp bên dưới để tải lại.`);
        }
      }
      xong();
    });
  };

  return (
    <form ref={formRef} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
      {(coSan || daLuuId) && <input type="hidden" name="id" value={coSan?.id ?? daLuuId ?? ""} />}
      <input type="hidden" name="tin_tuyen_dung_id" value={tinId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="u-ten" className={NHAN_O}>Họ và tên *</label>
          <input id="u-ten" name="ho_ten" required defaultValue={coSan?.ho_ten ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="u-sdt" className={NHAN_O}>Số điện thoại</label>
          <input id="u-sdt" name="dien_thoai" inputMode="tel" defaultValue={coSan?.dien_thoai ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="u-email" className={NHAN_O}>Email</label>
          <input id="u-email" name="email" type="email" defaultValue={coSan?.email ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="u-ns" className={NHAN_O}>Năm sinh</label>
          <input id="u-ns" name="nam_sinh" type="number" min={1940} max={2020} defaultValue={coSan?.nam_sinh ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="u-nguon" className={NHAN_O}>Nguồn</label>
          <Chon id="u-nguon" ten="nguon" trong="Chưa rõ" giaTriMacDinh={coSan?.nguon ?? ""} luaChon={[{ gia_tri: "", nhan: "Chưa rõ" }, ...NGUON_UNG_VIEN.map((n) => ({ gia_tri: n, nhan: n }))]} />
        </div>
        <div className="sm:col-span-2">
          <p className={NHAN_O}>CV của ứng viên</p>
          {coSan || daLuuId ? (
            <TepDinhKem man={MAN_UNG_VIEN} dongId={(coSan?.id ?? daLuuId)!} tieuDe="Tệp CV và giấy tờ (đẩy từ máy lên)" />
          ) : (
            <div className="space-y-1.5">
              <input id="u-cv-tep" type="file" accept={CHON_TEP_ACCEPT} className="sr-only" onChange={(e) => setTepCho(e.target.files?.[0] ?? null)} />
              <label htmlFor="u-cv-tep" className={`${NUT_PHU} inline-flex cursor-pointer items-center`}>{tepCho ? `Đã chọn: ${tepCho.name}` : "Chọn tệp CV từ máy (PDF, Word, ảnh, slide…)"}</label>
              <p className="text-[12px] text-muc-3">Tệp được tải lên khi bấm Thêm ứng viên. Tối đa 25 MB.</p>
            </div>
          )}
          <label htmlFor="u-cv" className={`${NHAN_O} mt-3`}>Link CV (nếu CV nằm trên mạng)</label>
          <input id="u-cv" name="link_cv" type="url" placeholder="https://" defaultValue={coSan?.link_cv ?? ""} className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="u-nhan" className={NHAN_O}>Ngày nhận hồ sơ</label>
          <NgayChon id="u-nhan" ten="ngay_nhan_ho_so" giaTriMacDinh={coSan?.ngay_nhan_ho_so ?? homNay} voHieu={!!coSan} tuNam={2024} />
        </div>
        <div>
          <label htmlFor="u-pv" className={NHAN_O}>Ngày phỏng vấn</label>
          <NgayChon id="u-pv" ten="ngay_phong_van" giaTriMacDinh={coSan?.ngay_phong_van ?? ""} tuNam={2024} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="u-buoc" className={NHAN_O}>Bước hiện tại</label>
          <Chon id="u-buoc" ten="trang_thai" giaTriMacDinh={coSan?.trang_thai ?? "Mới nộp"} luaChon={BUOC_UNG_VIEN.map((b) => ({ gia_tri: b, nhan: b }))} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="u-ghi" className={NHAN_O}>Ghi chú</label>
          <textarea id="u-ghi" name="ghi_chu" defaultValue={coSan?.ghi_chu ?? ""} className={O_NHIEU_DONG} />
        </div>
      </div>
      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="flex justify-end gap-2 border-t border-vien pt-4">
        <button type="button" onClick={huy} disabled={dangXuLy} className={NUT_PHU}>Quay lại danh sách</button>
        <button type="button" onClick={gui} disabled={dangXuLy} className={NUT_CHINH}>
          {dangXuLy ? "Đang lưu" : coSan || daLuuId ? "Lưu thay đổi" : "Thêm ứng viên"}
        </button>
      </div>
    </form>
  );
}
