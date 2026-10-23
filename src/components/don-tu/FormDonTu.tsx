"use client";

import { useRef, useState, useTransition } from "react";
import { layChamCongDeGiaiTrinh, taoDonTu, type KetQuaChamCongNgay } from "@/app/(app)/don-tu/actions";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { GioChon } from "@/components/ui/GioChon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { LOAI_NGHI_THEO_GIO } from "@/lib/don-tu";

const GOI_Y_LY_DO: Record<string, string> = {
  "Nghỉ chế độ": "Ghi rõ loại chế độ: thai sản, ...",
  "Giải trình công": "Vì sao chấm công chưa đúng (quên chấm, mất mạng, họp ngoài...)",
  "Chấm công ngoài công ty": "Làm việc ở đâu, với ai, giờ bắt đầu và kết thúc",
  "Làm remote": "Làm remote những việc gì",
  "Đi trễ": "Đến lúc mấy giờ và lý do",
  "Về sớm": "Về lúc mấy giờ và lý do",
};
const dMY = (iso: string) => iso.split("-").reverse().join("/");

/** Biểu mẫu nộp đơn trong hộp thoại. Nút type="button" gọi action qua onClick (lý do ở src/lib/actions.ts).
 * Giải trình công: chọn MỘT ngày → hệ thống lấy chấm công của người đó, nêu sai phạm và chỉ hỏi giờ đúng cần sửa về.
 * Nghỉ phép/không lương/ốm: chọn nhiều ngày hoặc một buổi theo khoảng giờ. */
export function FormDonTu({ xong, huy, loaiChoPhep, phepNam, nhanVienChon, macDinhNopCho, tenNguoiNop }: { xong: () => void; huy: () => void; loaiChoPhep: string[]; phepNam: { daDung: number; moiNam: number; nam: number }; nhanVienChon?: { gia_tri: string; nhan: string }[]; macDinhNopCho?: string; tenNguoiNop?: string }) {
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [loai, setLoai] = useState("");
  const [nopCho, setNopCho] = useState(macDinhNopCho ?? "");
  const [ngayGt, setNgayGt] = useState("");
  const [cc, setCc] = useState<KetQuaChamCongNgay | undefined>();
  const [dangTai, setDangTai] = useState(false);
  const [vaoDung, setVaoDung] = useState("");
  const [raDung, setRaDung] = useState("");
  const [theoGio, setTheoGio] = useState(false);
  const [gioTu, setGioTu] = useState("");
  const [gioDen, setGioDen] = useState("");

  const giaiTrinh = loai === "Giải trình công";
  const choTheoGio = (LOAI_NGHI_THEO_GIO as readonly string[]).includes(loai);
  const canVao = !!cc?.saiPham?.some((s) => s.ma === "vao_tre");
  const canRa = !!cc?.saiPham?.some((s) => s.ma !== "vao_tre");
  const coSaiPham = !!cc?.saiPham?.length;

  const taiChamCong = (ngay: string, nguoi: string) => {
    setCc(undefined);
    setVaoDung("");
    setRaDung("");
    if (!ngay) return;
    setDangTai(true);
    layChamCongDeGiaiTrinh(ngay, nguoi)
      .then(setCc)
      .finally(() => setDangTai(false));
  };

  const gui = () => {
    if (!formRef.current || !formRef.current.reportValidity()) return;
    setLoi(undefined);
    const fd = new FormData(formRef.current);
    if (giaiTrinh) {
      fd.set("den_ngay", ngayGt);
      if (canVao) fd.set("gio_vao_dung", vaoDung);
      if (canRa) fd.set("gio_ra_dung", raDung);
    } else if (choTheoGio && theoGio) {
      fd.set("den_ngay", String(fd.get("tu_ngay") || ""));
      fd.set("gio_tu", gioTu);
      fd.set("gio_den", gioDen);
    }
    startXuLy(async () => {
      const kq = await taoDonTu(fd);
      if (kq?.loi) setLoi(kq.loi);
      else xong();
    });
  };

  const nutChon = (bat: boolean, nhan: string, bam: () => void) => (
    <button type="button" onClick={bam} aria-pressed={bat} className={`h-9 rounded-nho border px-3.5 text-[13px] font-medium ${bat ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>
      {nhan}
    </button>
  );

  return (
    <form ref={formRef} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
      {!nhanVienChon && tenNguoiNop && (
        <div>
          <span className={NHAN_O}>Người nộp đơn</span>
          <div className="flex h-11 items-center rounded-nho border border-vien bg-giay-tram px-3 text-[15px] font-medium text-muc" aria-label="Người nộp đơn">{tenNguoiNop}</div>
        </div>
      )}
      {nhanVienChon && (
        <div>
          <label htmlFor="d-nop-cho" className={NHAN_O}>Nộp cho *</label>
          <Chon id="d-nop-cho" ten="nop_cho" batBuoc trong="Chọn nhân viên" giaTri={nopCho} onDoi={(v) => { setNopCho(v); if (giaiTrinh) taiChamCong(ngayGt, v); }} luaChon={nhanVienChon} />
        </div>
      )}
      <div>
        <label htmlFor="d-loai" className={NHAN_O}>Loại đơn *</label>
        <Chon id="d-loai" ten="loai" batBuoc trong="Chọn loại đơn" giaTri={loai} onDoi={(v) => { setLoai(v); setLoi(undefined); if (v === "Giải trình công" && ngayGt) taiChamCong(ngayGt, nopCho); }} luaChon={loaiChoPhep.map((l) => ({ gia_tri: l, nhan: l }))} />
        {loai === "Nghỉ phép năm" && !nhanVienChon && (
          <p className="mt-1.5 text-[13px] text-muc-3">
            Năm {phepNam.nam}: đã dùng hoặc đang chờ duyệt {phepNam.daDung}/{phepNam.moiNam} ngày, còn {Math.max(0, phepNam.moiNam - phepNam.daDung)} ngày. Chủ nhật không tính; nghỉ theo giờ tối đa 4 tiếng tính nửa ngày.
          </p>
        )}
      </div>

      {giaiTrinh ? (
        <>
          <div>
            <label htmlFor="d-ngay-gt" className={NHAN_O}>Ngày cần giải trình *</label>
            <NgayChon id="d-ngay-gt" ten="tu_ngay" batBuoc giaTri={ngayGt} onDoi={(v) => { setNgayGt(v); taiChamCong(v, nopCho); }} />
          </div>
          {dangTai && <p className="text-[13px] text-muc-3">Đang lấy chấm công của ngày này…</p>}
          {cc?.loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{cc.loi}</div>}
          {cc && !cc.loi && cc.coDuLieu === false && <p className="rounded-nho bg-giay-tram px-3 py-2.5 text-[14px] text-muc-2">Ngày {dMY(ngayGt)} chưa có dữ liệu chấm công nên chưa có gì để giải trình.</p>}
          {cc?.coDuLieu && !coSaiPham && <p className="rounded-nho bg-giay-tram px-3 py-2.5 text-[14px] text-muc-2">Ngày {dMY(ngayGt)} chấm công đúng quy định, không có sai phạm cần giải trình.</p>}
          {cc?.coDuLieu && coSaiPham && (
            <div className="space-y-3 rounded-nho border border-vien px-4 py-3.5">
              <div className="text-[13px] text-muc-3">Chấm công ngày {dMY(ngayGt)}</div>
              <div className="flex gap-8 text-[15px] tabular-nums text-muc">
                <span>Vào <strong>{cc.gioVao ?? "--:--"}</strong></span>
                <span>Ra <strong>{cc.gioRa ?? "--:--"}</strong></span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {cc.saiPham!.map((s) => (
                  <li key={s.ma} className="rounded-tag bg-canh-bao-nen px-2.5 py-1 text-[12px] font-medium text-canh-bao">{s.nhan}</li>
                ))}
              </ul>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {canVao && (
                  <div>
                    <label htmlFor="d-vao-dung" className={NHAN_O}>Giờ vào đúng *</label>
                    <GioChon id="d-vao-dung" ariaLabel="Giờ vào đúng" onDoi={setVaoDung} />
                  </div>
                )}
                {canRa && (
                  <div>
                    <label htmlFor="d-ra-dung" className={NHAN_O}>Giờ ra đúng *</label>
                    <GioChon id="d-ra-dung" ariaLabel="Giờ ra đúng" onDoi={setRaDung} />
                  </div>
                )}
              </div>
              <p className="text-[12px] text-muc-3">Khi đơn được duyệt, chấm công ngày này tự sửa về đúng giờ bạn chọn.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {choTheoGio && (
            <div>
              <span className={NHAN_O}>Thời gian nghỉ</span>
              <div className="flex gap-2">
                {nutChon(!theoGio, "Cả ngày hoặc nhiều ngày", () => setTheoGio(false))}
                {nutChon(theoGio, "Một buổi / theo giờ", () => setTheoGio(true))}
              </div>
            </div>
          )}
          {choTheoGio && theoGio ? (
            <>
              <div>
                <label htmlFor="d-tu" className={NHAN_O}>Ngày nghỉ *</label>
                <NgayChon id="d-tu" ten="tu_ngay" batBuoc />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="d-gio-tu" className={NHAN_O}>Nghỉ từ giờ *</label>
                  <GioChon id="d-gio-tu" ariaLabel="Nghỉ từ giờ" onDoi={setGioTu} />
                </div>
                <div>
                  <label htmlFor="d-gio-den" className={NHAN_O}>Đến giờ *</label>
                  <GioChon id="d-gio-den" ariaLabel="Nghỉ đến giờ" onDoi={setGioDen} />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="d-tu" className={NHAN_O}>Từ ngày *</label>
                <NgayChon id="d-tu" ten="tu_ngay" batBuoc />
              </div>
              <div>
                <label htmlFor="d-den" className={NHAN_O}>Đến ngày *</label>
                <NgayChon id="d-den" ten="den_ngay" batBuoc />
              </div>
            </div>
          )}
        </>
      )}

      <div>
        <label htmlFor="d-ly-do" className={NHAN_O}>Lý do{giaiTrinh ? " *" : ""}</label>
        <textarea id="d-ly-do" name="ly_do" placeholder={GOI_Y_LY_DO[loai] ?? "Mô tả ngắn lý do"} className={O_NHIEU_DONG} />
      </div>
      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="flex justify-end gap-2 border-t border-vien pt-4">
        <button type="button" onClick={huy} disabled={dangXuLy} className={NUT_PHU}>Huỷ</button>
        <button type="button" onClick={gui} disabled={dangXuLy || (giaiTrinh && !coSaiPham)} className={NUT_CHINH}>{dangXuLy ? "Đang gửi" : "Nộp đơn"}</button>
      </div>
    </form>
  );
}
