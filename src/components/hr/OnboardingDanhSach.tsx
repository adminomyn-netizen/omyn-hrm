"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { themNguoiMoi } from "@/app/(app)/hr/onboarding/actions";
import { Chon } from "@/components/ui/Chon";
import { Hop } from "@/components/ui/Hop";
import { NgayChon } from "@/components/ui/NgayChon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

export type OnbThe = { id: string; hoTen: string; viTri: string | null; batDau: string; soNgay: number; ngayThu: number; tinhTrang: string; hoSo: string; xong: number; tong: number; dg30: string | null; dg60: string | null; mentor: string | null };
type Tra = { id: string; ten: string };

const KIEU = (t: string): "tot" | "cho" | "loi" | "tram" => (t.startsWith("Đạt") ? "tot" : t === "Đang thử việc" ? "cho" : t === "Không đạt" || t === "Nghỉ giữa chừng" ? "loi" : "tram");
const NGAY = (s: string) => s.split("-").reverse().join("/");

export function OnboardingDanhSach({ the, nv, khoi }: { the: OnbThe[]; nv: Tra[]; khoi: Tra[] }) {
  const [moHop, setMoHop] = useState(false);
  const [loc, setLoc] = useState("Đang làm");
  const dang = the.filter((t) => t.tinhTrang === "Chuẩn bị" || t.tinhTrang === "Đang thử việc");
  const hien = loc === "Đang làm" ? dang : the;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[["Đang làm", `Đang onboarding (${dang.length})`], ["Tất cả", `Tất cả (${the.length})`]].map(([v, n]) => (
          <button key={v} type="button" onClick={() => setLoc(v)} aria-pressed={loc === v} className={`rounded-tag border px-3 py-1.5 text-[13px] transition-colors ${loc === v ? "border-transparent nut-vang" : "border-vien bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>{n}</button>
        ))}
        <button type="button" onClick={() => setMoHop(true)} className={`${NUT_CHINH} ml-auto flex items-center gap-1.5`}><Plus strokeWidth={1.8} className="h-4 w-4" />Thêm người mới</button>
      </div>
      {hien.length === 0 ? (
        <p className="rounded-nho border border-dashed border-vien px-5 py-10 text-center text-[14px] text-muc-3">Chưa có người mới nào. Bấm “Thêm người mới” để tạo lộ trình 60 ngày (15 việc mẫu, đánh giá mentor 30/60 ngày).</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {hien.map((t) => {
            const pct = t.tong ? Math.round((t.xong / t.tong) * 100) : 0;
            const ngayBar = Math.max(0, Math.min(t.soNgay, t.ngayThu));
            return (
              <li key={t.id}>
                <Link href={`/hr/onboarding/${t.id}`} className="the-noi flex h-full flex-col gap-3 rounded-nho border border-vien bg-giay-sang p-4 transition-shadow hover:[box-shadow:var(--bong-2)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="truncate text-[16px] font-semibold text-muc">{t.hoTen}</h3><p className="truncate text-[13px] text-muc-3">{t.viTri ?? "Chưa có vị trí"}{t.mentor ? ` · Mentor: ${t.mentor}` : ""}</p></div>
                    <NhanTrangThai kieu={KIEU(t.tinhTrang)}>{t.tinhTrang}</NhanTrangThai>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between text-[12px] text-muc-3"><span>{t.ngayThu < 1 ? `Bắt đầu ${NGAY(t.batDau)}` : `Ngày ${Math.min(t.ngayThu, t.soNgay)}/${t.soNgay}`}</span><span>{t.xong}/{t.tong} việc · {pct}%</span></div>
                    <div className="h-2 overflow-hidden rounded-tag bg-giay-tram" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ lộ trình"><div className="h-full rounded-tag" style={{ width: `${pct}%`, background: "var(--gradient-vang)" }} /></div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-tag bg-giay-tram" aria-hidden><div className="h-full rounded-tag bg-muc-3/50" style={{ width: `${(ngayBar / t.soNgay) * 100}%` }} /></div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[12px]">
                    <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-muc-2">Hồ sơ: {t.hoSo}</span>
                    <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-muc-2">30 ngày: {t.dg30 ?? "chưa đánh giá"}</span>
                    <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-muc-2">60 ngày: {t.dg60 ?? "chưa đánh giá"}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Hop mo={moHop} dong={() => setMoHop(false)} tieuDe="Thêm người mới" moTa="Tạo xong hệ thống tự dựng lộ trình 15 việc theo 4 giai đoạn: trước ngày 1, tuần 1, ngày 30, ngày 60." rong="rong">
        {moHop && <FormMoi nv={nv} khoi={khoi} huy={() => setMoHop(false)} />}
      </Hop>
    </div>
  );
}

function FormMoi({ nv, khoi, huy }: { nv: Tra[]; khoi: Tra[]; huy: () => void }) {
  const router = useRouter();
  const [loi, setLoi] = useState<string>();
  const [dang, bat] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const gui = () => {
    if (!ref.current?.reportValidity()) return;
    const fd = new FormData(ref.current);
    bat(async () => { const kq = await themNguoiMoi(fd); if (kq.loi) setLoi(kq.loi); else if (kq.id) router.push(`/hr/onboarding/${kq.id}`); });
  };
  const nvLc = nv.map((x) => ({ gia_tri: x.id, nhan: x.ten }));
  return (
    <form ref={ref} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div><label htmlFor="om-ten" className={NHAN_O}>Họ và tên *</label><input id="om-ten" name="ho_ten" required className={O_NHAP} /></div>
        <div><label htmlFor="om-vt" className={NHAN_O}>Vị trí</label><input id="om-vt" name="vi_tri" className={O_NHAP} /></div>
        <div><label htmlFor="om-mail" className={NHAN_O}>Email</label><input id="om-mail" name="email" type="email" className={O_NHAP} /></div>
        <div><label htmlFor="om-sdt" className={NHAN_O}>Số điện thoại</label><input id="om-sdt" name="dien_thoai" inputMode="tel" className={O_NHAP} /></div>
        <div><label htmlFor="om-bd" className={NHAN_O}>Ngày bắt đầu thử việc *</label><NgayChon id="om-bd" ten="ngay_bat_dau" batBuoc /></div>
        <div><label htmlFor="om-sn" className={NHAN_O}>Số ngày thử việc</label><input id="om-sn" name="so_ngay_thu_viec" inputMode="numeric" defaultValue="60" className={O_NHAP} /></div>
        <div><label htmlFor="om-khoi" className={NHAN_O}>Khối / phòng ban</label><Chon id="om-khoi" ten="khoi_id" trong="Chọn khối" luaChon={khoi.map((x) => ({ gia_tri: x.id, nhan: x.ten }))} /></div>
        <div><label htmlFor="om-ql" className={NHAN_O}>Quản lý trực tiếp</label><Chon id="om-ql" ten="quan_ly_id" trong="Chọn quản lý" luaChon={nvLc} /></div>
        <div className="sm:col-span-2"><label htmlFor="om-mt" className={NHAN_O}>Mentor kèm cặp</label><Chon id="om-mt" ten="mentor_id" trong="Chọn mentor" luaChon={nvLc} /></div>
      </div>
      {loi && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</p>}
      <div className="flex justify-end gap-2.5"><button type="button" onClick={huy} className={NUT_PHU}>Huỷ</button><button type="button" onClick={gui} disabled={dang} className={NUT_CHINH}>{dang ? "Đang tạo" : "Tạo lộ trình"}</button></div>
    </form>
  );
}
