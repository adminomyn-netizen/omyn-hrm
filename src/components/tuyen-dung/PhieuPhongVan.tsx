"use client";

import { useRef, useState, useTransition } from "react";
import { luuPhieuPv, xoaPhieuPv } from "@/app/(app)/tuyen-dung/phieu-pv-actions";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { KET_LUAN_PV, NHAN_DIEM_PV, TIEU_CHI_PV_MAC_DINH, VONG_PV, diemTrungBinhPv, type TieuChiDiem } from "@/lib/phieu-pv";
import { ngayVN } from "@/lib/dinh-dang";

export type PhieuPv = {
  id: string; ung_vien_id: string; vong: string; nguoi_phong_van_id: string | null; ngay: string; tieu_chi: TieuChiDiem[];
  luong_mong_muon: string | null; ngay_co_the_di_lam: string | null; diem_manh: string | null; diem_can_luu_y: string | null; nhan_xet: string | null; ket_luan: string;
};
export type NguoiPv = { id: string; ho_ten: string };

export const kieuKetLuan = (k: string) => (k === "Đạt" ? "tot" : k === "Không đạt" ? "loi" : "cho");

/** Phiếu đánh giá phỏng vấn của một ứng viên: xem các phiếu đã có, thêm hoặc sửa. Không tự đổi bước của ứng viên. */
export function PhieuPhongVan({ ungVienId, hoTen, phieu, nguoi, xong, quayLai }: { ungVienId: string; hoTen: string; phieu: PhieuPv[]; nguoi: NguoiPv[]; xong: () => void; quayLai: () => void }) {
  const [man, setMan] = useState<"ds" | "them" | { sua: PhieuPv }>(phieu.length === 0 ? "them" : "ds");
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const homNay = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const tenNguoi = (id: string | null) => nguoi.find((n) => n.id === id)?.ho_ten ?? "Chưa ghi người phỏng vấn";

  const luu = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const kq = await luuPhieuPv(fd);
      if (kq.loi) return setLoi(kq.loi);
      setLoi(undefined);
      setMan("ds");
      xong();
    });
  };
  const xoa = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    startXuLy(async () => {
      const kq = await xoaPhieuPv(fd);
      if (kq.loi) return setLoi(kq.loi);
      setLoi(undefined);
      setMan("ds");
      xong();
    });
  };

  if (man === "ds") {
    return (
      <div className="space-y-4">
        <p className="text-[14px] text-muc-2">Phiếu của <strong className="font-semibold text-muc">{hoTen}</strong>. Mỗi vòng hoặc mỗi người phỏng vấn một phiếu.</p>
        <ul className="space-y-2.5">
          {phieu.map((p) => {
            const tb = diemTrungBinhPv(p.tieu_chi);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => { setLoi(undefined); setMan({ sua: p }); }} className="the-noi the-noi-thap flex w-full items-center justify-between gap-3 p-3.5 text-left">
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-muc">{p.vong} · {ngayVN(p.ngay)}</span>
                    <span className="block truncate text-[12px] text-muc-3">{tenNguoi(p.nguoi_phong_van_id)}{tb !== null ? ` · Điểm trung bình ${tb}/5` : " · Chưa chấm điểm"}</span>
                  </span>
                  <NhanTrangThai kieu={kieuKetLuan(p.ket_luan)}>{p.ket_luan}</NhanTrangThai>
                </button>
              </li>
            );
          })}
        </ul>
        {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="flex justify-end gap-2 border-t border-vien pt-4">
          <button type="button" onClick={quayLai} className={NUT_PHU}>Quay lại hồ sơ</button>
          <button type="button" onClick={() => { setLoi(undefined); setMan("them"); }} className={NUT_CHINH}>Thêm phiếu</button>
        </div>
      </div>
    );
  }

  const p = man === "them" ? undefined : man.sua;
  const diemLuaChon = [{ gia_tri: "", nhan: "Chưa chấm" }, ...[1, 2, 3, 4, 5].map((n) => ({ gia_tri: String(n), nhan: `${n} — ${NHAN_DIEM_PV[n]}` }))];
  return (
    <form key={p?.id ?? "moi"} ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <input type="hidden" name="ung_vien_id" value={ungVienId} />
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="pv-vong" className={NHAN_O}>Vòng phỏng vấn</label>
          <Chon id="pv-vong" ten="vong" giaTriMacDinh={p?.vong ?? "Vòng 1"} luaChon={VONG_PV.map((v) => ({ gia_tri: v, nhan: v }))} />
        </div>
        <div>
          <label htmlFor="pv-ngay" className={NHAN_O}>Ngày phỏng vấn</label>
          <NgayChon id="pv-ngay" ten="ngay" giaTriMacDinh={p?.ngay ?? homNay} tuNam={2024} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pv-nguoi" className={NHAN_O}>Người phỏng vấn</label>
          <Chon id="pv-nguoi" ten="nguoi_phong_van_id" trong="Chưa ghi" giaTriMacDinh={p?.nguoi_phong_van_id ?? ""} luaChon={[{ gia_tri: "", nhan: "Chưa ghi" }, ...nguoi.map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))]} />
        </div>
      </div>

      <section>
        <div className="nhan-muc mb-2">Chấm từng tiêu chí (1–5, có thể để trống)</div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {TIEU_CHI_PV_MAC_DINH.map((ten, i) => (
            <div key={ten}>
              <label htmlFor={`pv-d${i}`} className={NHAN_O}>{ten}</label>
              <Chon id={`pv-d${i}`} ten={`d${i}`} trong="Chưa chấm" giaTriMacDinh={String(p?.tieu_chi.find((t) => t.ten === ten)?.diem ?? "")} luaChon={diemLuaChon} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="pv-luong" className={NHAN_O}>Mức lương mong muốn</label>
          <input id="pv-luong" name="luong_mong_muon" defaultValue={p?.luong_mong_muon ?? ""} placeholder="Ghi đúng lời ứng viên" className={O_NHAP} />
        </div>
        <div>
          <label htmlFor="pv-di" className={NHAN_O}>Ngày có thể đi làm</label>
          <NgayChon id="pv-di" ten="ngay_co_the_di_lam" giaTriMacDinh={p?.ngay_co_the_di_lam ?? ""} tuNam={2024} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pv-manh" className={NHAN_O}>Điểm mạnh</label>
          <textarea id="pv-manh" name="diem_manh" defaultValue={p?.diem_manh ?? ""} className={O_NHIEU_DONG} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pv-luuy" className={NHAN_O}>Điểm cần lưu ý</label>
          <textarea id="pv-luuy" name="diem_can_luu_y" defaultValue={p?.diem_can_luu_y ?? ""} className={O_NHIEU_DONG} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pv-xet" className={NHAN_O}>Nhận xét chung</label>
          <textarea id="pv-xet" name="nhan_xet" defaultValue={p?.nhan_xet ?? ""} className={O_NHIEU_DONG} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pv-kl" className={NHAN_O}>Kết luận của người phỏng vấn</label>
          <Chon id="pv-kl" ten="ket_luan" giaTriMacDinh={p?.ket_luan ?? "Cân nhắc"} luaChon={KET_LUAN_PV.map((k) => ({ gia_tri: k, nhan: k }))} />
          <p className="mt-1 text-[12px] text-muc-3">Kết luận do người phỏng vấn chọn, không tự tính từ điểm. Lưu phiếu không tự đổi bước của ứng viên.</p>
        </div>
      </div>

      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-vien pt-4">
        <div>{p && <button type="button" disabled={dangXuLy} onClick={() => xoa(p.id)} className={NUT_CHU_NGUY}>Xoá phiếu này</button>}</div>
        <div className="flex gap-2">
          <button type="button" disabled={dangXuLy} onClick={() => { setLoi(undefined); if (phieu.length === 0) quayLai(); else setMan("ds"); }} className={NUT_PHU}>Quay lại</button>
          <button type="button" disabled={dangXuLy} onClick={luu} className={NUT_CHINH}>{dangXuLy ? "Đang lưu" : p ? "Lưu thay đổi" : "Lưu phiếu"}</button>
        </div>
      </div>
    </form>
  );
}
