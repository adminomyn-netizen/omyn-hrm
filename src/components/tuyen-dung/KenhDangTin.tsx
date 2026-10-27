"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { OTien } from "@/components/ui/OTien";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { ghiKenhDang, goKenhDang } from "@/app/(app)/tuyen-dung/yeu-cau-actions";
import { KENH_DANG, soanBaiDang } from "@/lib/tuyen-dung";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import type { KenhDang } from "@/lib/data-tuyen-dung";

type TinTom = { id: string; vi_tri: string; so_luong_can: number; khoi_ten: string; han_nop: string | null; mo_ta: string | null };

/** Ô "Đăng tin và chi phí" dưới mỗi tin: soạn sẵn bài đăng để dán lên kênh, ghi link bài + chi phí từng kênh. Chưa có bot tự đăng: người đăng tay rồi ghi lại ở đây. */
export function KenhDangTin({ tin, kenh }: { tin: TinTom; kenh: KenhDang[] }) {
  const router = useRouter();
  const [mo, setMo] = useState<"them" | "bai" | null>(null);
  const [loi, setLoi] = useState<string | undefined>();
  const [daChep, setDaChep] = useState(false);
  const [dang, bat] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const tong = kenh.filter((k) => k.trang_thai === "Đang đăng" || k.trang_thai === "Đã gỡ").reduce((s, k) => s + k.chi_phi, 0);
  const bai = soanBaiDang(tin);

  const dong = () => { setMo(null); setLoi(undefined); setDaChep(false); };
  const luu = () => {
    if (!formRef.current?.reportValidity()) return;
    const fd = new FormData(formRef.current); fd.set("tin_id", tin.id);
    bat(async () => { const kq = await ghiKenhDang(fd); if (kq.loi) setLoi(kq.loi); else { dong(); router.refresh(); } });
  };
  const go = (id: string) => { const fd = new FormData(); fd.set("id", id); bat(async () => { const kq = await goKenhDang(fd); if (kq.loi) setLoi(kq.loi); else router.refresh(); }); };
  const chep = async () => { try { await navigator.clipboard.writeText(bai); setDaChep(true); } catch { setLoi("Trình duyệt chưa cho sao chép. Bôi đen nội dung rồi nhấn Ctrl+C."); } };

  return (
    <section aria-label="Đăng tin và chi phí" className="the-noi the-noi-thap p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-muc">Đăng tin và chi phí</h3>
          <p className="text-[13px] text-muc-3">{kenh.length} lần đăng · tổng chi phí <strong className="font-semibold text-muc tabular-nums">{tienVN(tong)}</strong></p>
        </div>
        <div className="flex gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo("bai")}>Soạn bài đăng</button>
          <button type="button" className={NUT_CHINH} onClick={() => setMo("them")}>+ Ghi một lần đăng</button>
        </div>
      </div>
      {loi && !mo && <div role="alert" className="mt-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {kenh.length === 0 ? (
        <p className="mt-4 text-[13px] text-muc-3">Chưa đăng kênh nào. Bấm &ldquo;Soạn bài đăng&rdquo;, dán lên Facebook/Zalo/TopCV rồi ghi lại link và chi phí ở đây để có báo cáo.</p>
      ) : (
        <ul className="mt-4 divide-y divide-vien">
          {kenh.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-[13px]">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-medium text-muc">{k.kenh}</span>
                <NhanTrangThai kieu={k.trang_thai === "Đang đăng" ? "tot" : "tram"}>{k.trang_thai}</NhanTrangThai>
                <span className="text-muc-3">{ngayVN(k.ngay_dang)}</span>
                {k.link_bai && <a href={k.link_bai} target="_blank" rel="noopener noreferrer" className={NUT_CHU}>Xem bài</a>}
              </span>
              <span className="flex items-center gap-4">
                <span className="tabular-nums text-muc-2">{tienVN(k.chi_phi)}</span>
                {k.trang_thai === "Đang đăng" && <button type="button" disabled={dang} className={NUT_CHU_NGUY} onClick={() => go(k.id)}>Gỡ</button>}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Hop mo={mo === "them"} dong={dong} tieuDe="Ghi một lần đăng tin" moTa={`${tin.vi_tri}. Chi phí ghi 0 nếu đăng miễn phí.`}>
        {mo === "them" && (
          <form ref={formRef} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label htmlFor="k-kenh" className={NHAN_O}>Kênh *</label><Chon id="k-kenh" ten="kenh" batBuoc trong="Chọn kênh" luaChon={KENH_DANG.map((k) => ({ gia_tri: k, nhan: k }))} /></div>
              <div><label htmlFor="k-ngay" className={NHAN_O}>Ngày đăng</label><NgayChon id="k-ngay" ten="ngay_dang" tuNam={2024} denNam={2100} /></div>
              <div className="sm:col-span-2"><label htmlFor="k-link" className={NHAN_O}>Link bài đăng</label><input id="k-link" name="link_bai" className={O_NHAP} placeholder="https://" /></div>
              <div><label htmlFor="k-cp" className={NHAN_O}>Chi phí</label><OTien id="k-cp" ten="chi_phi" /></div>
              <div><label htmlFor="k-gc" className={NHAN_O}>Ghi chú</label><input id="k-gc" name="ghi_chu" className={O_NHAP} /></div>
            </div>
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={dong} disabled={dang}>Đóng</button>
              <button type="button" className={NUT_CHINH} onClick={luu} disabled={dang}>{dang ? "Đang lưu" : "Lưu"}</button>
            </div>
          </form>
        )}
      </Hop>

      <Hop mo={mo === "bai"} dong={dong} tieuDe="Bài đăng soạn sẵn" moTa="Sao chép rồi dán lên kênh tuyển dụng. Sửa tin thì bài này tự đổi theo.">
        {mo === "bai" && (
          <div className="space-y-4">
            <textarea readOnly value={bai} className="min-h-[220px] w-full rounded-nho border border-vien-dam bg-giay-sang px-3 py-2.5 text-[14px] text-muc" onFocus={(e) => e.currentTarget.select()} />
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4">
              <button type="button" className={NUT_PHU} onClick={dong}>Đóng</button>
              <button type="button" className={NUT_CHINH} onClick={chep}>{daChep ? "Đã sao chép" : "Sao chép nội dung"}</button>
            </div>
          </div>
        )}
      </Hop>
    </section>
  );
}
