"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  Clock,
  Inbox,
  Info,
  LogOut,
  Menu,
  UserCheck,
  UserCog,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { ChuyenCheDo } from "./ChuyenCheDo";
import { TimKiem } from "./TimKiem";
import { datChuaDoc, datDemMenu } from "@/lib/dem-menu";

export const SU_KIEN_MO_THONG_BAO = "omyn-mo-thong-bao";
export const SU_KIEN_MO_TAI_KHOAN = "omyn-mo-tai-khoan";
import { SU_KIEN_MO_MENU } from "./MobileNav";
import { Hop } from "@/components/ui/Hop";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { dangXuat } from "@/lib/actions";
import { capNhatThongTinCaNhan } from "@/app/ca-nhan-actions";
import { useLuuTru } from "@/lib/luu-tru";
import { menuChinh } from "@/lib/nav";
import type { VaiTro } from "@/lib/auth";

export type ThongBao = {
  id: string;
  loai: "tai_khoan" | "don_tu" | "ung_vien" | "tin" | "cham_cong" | "he_thong";
  tieuDe: string;
  noiDung: string;
  thoiDiem: string;
  href: string;
};

const KHOA_DA_DOC = "omyn-hrm-tb-da-doc";
const ICON: Record<ThongBao["loai"], LucideIcon> = {
  tai_khoan: UserCheck,
  don_tu: Inbox,
  ung_vien: UserPlus,
  tin: CalendarClock,
  cham_cong: Clock,
  he_thong: Info,
};

function tuongDoi(iso: string, bayGio: number) {
  const s = Math.max(0, Math.round((bayGio - new Date(iso).getTime()) / 1000));
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return `${Math.floor(s / 86400)} ngày trước`;
}

function useDongKhiBamNgoai(mo: boolean, dong: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mo) return;
    const click = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && dong();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && dong();
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", esc);
    };
  }, [mo, dong]);
  return ref;
}

const CHU_KY_LAM_MOI = 90_000;

/** Tải thông báo SAU khi trang đã hiện; làm mới khi quay lại tab và mỗi 90 giây. */
function useThongBao() {
  const [ds, setDs] = useState<ThongBao[]>([]);
  useEffect(() => {
    let huy = false;
    const tai = async () => {
      try {
        const r = await fetch("/api/thong-bao", { cache: "no-store" });
        if (!r.ok || !r.headers.get("content-type")?.includes("json")) return;
        const j = (await r.json()) as { thongBao: ThongBao[]; dem?: Record<string, number> };
        if (!huy) {
          setDs(j.thongBao);
          datDemMenu(j.dem ?? {});
        }
      } catch {
        // mất mạng thoáng qua: giữ danh sách cũ
      }
    };
    tai();
    const dinhKy = setInterval(tai, CHU_KY_LAM_MOI);
    const khiQuayLai = () => document.visibilityState === "visible" && tai();
    document.addEventListener("visibilitychange", khiQuayLai);
    return () => {
      huy = true;
      clearInterval(dinhKy);
      document.removeEventListener("visibilitychange", khiQuayLai);
    };
  }, []);
  return ds;
}

function Chuong() {
  const thongBao = useThongBao();
  const [mo, setMo] = useState(false);
  const [raw, ghi] = useLuuTru(KHOA_DA_DOC, "[]");
  const [bayGio] = useState(() => Date.now());
  const ref = useDongKhiBamNgoai(mo, () => setMo(false));

  const daDoc = useMemo(() => {
    try {
      return new Set<string>(JSON.parse(raw));
    } catch {
      return new Set<string>();
    }
  }, [raw]);
  const chuaDoc = thongBao.filter((t) => !daDoc.has(t.id)).length;

  useEffect(() => {
    datChuaDoc(chuaDoc);
  }, [chuaDoc]);
  useEffect(() => {
    const moChuong = () => setMo(true);
    window.addEventListener(SU_KIEN_MO_THONG_BAO, moChuong);
    return () => window.removeEventListener(SU_KIEN_MO_THONG_BAO, moChuong);
  }, []);

  const danhDau = (ids: string[]) => ghi(JSON.stringify([...new Set([...daDoc, ...ids])].slice(-300)));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setMo((m) => !m)}
        aria-haspopup="true"
        aria-expanded={mo}
        aria-label={chuaDoc ? `Thông báo, ${chuaDoc} chưa đọc` : "Thông báo"}
        title="Thông báo"
        className="relative rounded-nho p-2 text-muc-2 hover:bg-giay-tram hover:text-muc"
      >
        <Bell strokeWidth={1.5} className="h-[19px] w-[19px]" />
        {chuaDoc > 0 && (
          <span className="nut-vang absolute right-0.5 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-nho px-1 text-[10px] leading-none">
            {chuaDoc > 9 ? "9+" : chuaDoc}
          </span>
        )}
      </button>
      {mo && (
        <div className="the-noi bang-nho absolute right-0 top-full z-40 mt-2.5 w-[min(380px,calc(100vw-2rem))] overflow-hidden">
          <div className="flex items-center justify-between border-b border-vien px-4 py-3">
            <span className="text-[14px] font-semibold text-muc">Thông báo</span>
            {chuaDoc > 0 && (
              <button type="button" onClick={() => danhDau(thongBao.map((t) => t.id))} className="text-[12px] font-medium text-nhan-dam underline-offset-4 hover:underline">
                Đánh dấu đã đọc hết
              </button>
            )}
          </div>
          <ul className="max-h-[420px] overflow-y-auto">
            {thongBao.map((t) => {
              const Icon = ICON[t.loai];
              const moi = !daDoc.has(t.id);
              return (
                <li key={t.id} className="border-b border-vien last:border-b-0">
                  <Link
                    href={t.href}
                    onClick={() => {
                      danhDau([t.id]);
                      setMo(false);
                    }}
                    className="flex gap-3 px-4 py-3 hover:bg-giay-tram/70"
                  >
                    <Icon strokeWidth={1.5} className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${moi ? "text-nhan" : "text-muc-3"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] ${moi ? "font-semibold text-muc" : "font-medium text-muc-2"}`}>{t.tieuDe}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-muc-2">{t.noiDung}</span>
                      <span className="mt-1 block text-[12px] text-muc-3">{tuongDoi(t.thoiDiem, bayGio)}</span>
                    </span>
                    {moi && <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 bg-nhan" style={{ borderRadius: 2 }} />}
                  </Link>
                </li>
              );
            })}
          </ul>
          {thongBao.length === 0 && <p className="px-4 py-10 text-center text-[14px] text-muc-3">Chưa có thông báo nào. Khi có việc cần bạn, nó sẽ hiện ở đây.</p>}
        </div>
      )}
    </div>
  );
}

function FormCaNhan({ hoTen, xong, huy }: { hoTen: string; xong: () => void; huy: () => void }) {
  const [loi, setLoi] = useState<string | undefined>();
  const [dangXuLy, startXuLy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const gui = () => {
    if (!formRef.current || !formRef.current.reportValidity()) return;
    const fd = new FormData(formRef.current);
    startXuLy(async () => {
      const kq = await capNhatThongTinCaNhan(fd);
      if (kq.loi) setLoi(kq.loi);
      else xong();
    });
  };

  return (
    <form ref={formRef} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
      <div>
        <label htmlFor="cn-ten" className={NHAN_O}>Họ và tên hiển thị</label>
        <input id="cn-ten" name="ho_ten" required defaultValue={hoTen} className={O_NHAP} />
      </div>
      <fieldset className="space-y-4 border-t border-vien pt-4">
        <legend className="nhan-muc pr-2">Đổi mật khẩu (bỏ trống nếu không đổi)</legend>
        <div>
          <label htmlFor="cn-mk-cu" className={NHAN_O}>Mật khẩu hiện tại</label>
          <input id="cn-mk-cu" name="mat_khau_hien_tai" type="password" autoComplete="current-password" className={O_NHAP} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cn-mk-moi" className={NHAN_O}>Mật khẩu mới</label>
            <input id="cn-mk-moi" name="mat_khau_moi" type="password" autoComplete="new-password" className={O_NHAP} />
          </div>
          <div>
            <label htmlFor="cn-mk-lai" className={NHAN_O}>Nhập lại mật khẩu mới</label>
            <input id="cn-mk-lai" name="mat_khau_nhap_lai" type="password" autoComplete="new-password" className={O_NHAP} />
          </div>
        </div>
        <p className="text-[12px] text-muc-3">Tối thiểu 8 ký tự, có chữ in hoa và ký tự đặc biệt.</p>
      </fieldset>
      {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      <div className="flex justify-end gap-2 border-t border-vien pt-4">
        <button type="button" onClick={huy} disabled={dangXuLy} className={NUT_PHU}>Huỷ</button>
        <button type="button" onClick={gui} disabled={dangXuLy} className={NUT_CHINH}>{dangXuLy ? "Đang lưu" : "Lưu thay đổi"}</button>
      </div>
    </form>
  );
}

function MenuAvatar({ hoTen, email, viTri }: { hoTen: string; email: string; viTri: string }) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [suaHoSo, setSuaHoSo] = useState(false);
  const [dangXuatXong, startXuat] = useTransition();
  const ref = useDongKhiBamNgoai(mo, () => setMo(false));
  useEffect(() => {
    const moMenu = () => setMo(true);
    window.addEventListener(SU_KIEN_MO_TAI_KHOAN, moMenu);
    return () => window.removeEventListener(SU_KIEN_MO_TAI_KHOAN, moMenu);
  }, []);
  const chuDau = (hoTen.trim().split(/\s+/).pop() ?? "?").charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setMo((m) => !m)}
        aria-haspopup="true"
        aria-expanded={mo}
        className="flex items-center gap-2.5 rounded-nho py-1 pl-1 pr-2 hover:bg-giay-tram"
      >
        <span className="nut-vang flex h-8 w-8 items-center justify-center text-[13px] font-semibold" style={{ borderRadius: 9999 }}>
          {chuDau}
        </span>
        <span className="hidden max-w-[160px] truncate text-[14px] font-medium text-muc sm:block">{hoTen}</span>
        <ChevronDown strokeWidth={1.8} className={`hidden h-4 w-4 text-muc-3 transition-transform sm:block ${mo ? "rotate-180" : ""}`} />
      </button>
      {mo && (
        <div role="menu" aria-label="Tài khoản" className="the-noi bang-nho absolute right-0 top-full z-40 mt-2.5 w-[300px] max-w-[calc(100vw-1.5rem)] overflow-hidden">
          <div className="flex items-center gap-3.5 px-5 pb-4 pt-6">
            <span className="nut-vang flex h-12 w-12 shrink-0 items-center justify-center text-[18px] font-semibold" style={{ borderRadius: 9999 }}>{chuDau}</span>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-muc">{hoTen}</div>
              <div className="mt-0.5 text-[13px] text-nhan-dam">{viTri}</div>
            </div>
          </div>
          <div className="border-t border-vien px-5 py-3">
            <div className="nhan-muc">Email đăng nhập</div>
            <div className="mt-0.5 break-all text-[13px] text-muc-2">{email}</div>
          </div>
          <ChuyenCheDo />
          <div className="border-t border-vien p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMo(false);
                setSuaHoSo(true);
              }}
              className="muc-bang-nho flex w-full items-center gap-3 rounded-nho px-3 py-2.5 text-left text-[14px] text-muc hover:bg-giay-tram"
            >
              <UserCog strokeWidth={1.6} className="h-[18px] w-[18px] text-muc-3" aria-hidden />Chỉnh sửa thông tin
            </button>
          </div>
          <div className="border-t border-vien p-2">
            <button
              type="button"
              role="menuitem"
              disabled={dangXuatXong}
              onClick={() => startXuat(() => dangXuat())}
              className="muc-bang-nho flex w-full items-center gap-3 rounded-nho px-3 py-2.5 text-left text-[14px] text-loi hover:bg-loi-nen disabled:opacity-50"
            >
              <LogOut strokeWidth={1.6} className="h-[18px] w-[18px]" aria-hidden />Đăng xuất
            </button>
          </div>
        </div>
      )}
      <Hop mo={suaHoSo} dong={() => setSuaHoSo(false)} tieuDe="Thông tin của bạn" moTa={email}>
        {suaHoSo && <FormCaNhan hoTen={hoTen} huy={() => setSuaHoSo(false)} xong={() => { setSuaHoSo(false); router.refresh(); }} />}
      </Hop>
    </div>
  );
}

/** Đầu trang mỏng 56 px: tiêu đề trang bên trái; bên phải: sáng/tối, thông báo, avatar + tên (bấm vào để sửa thông tin / đăng xuất). */
export function DauTrang({ hoTen, email, vaiTro, viTri }: { hoTen: string; email: string; vaiTro: VaiTro; viTri: string }) {
  const pathname = usePathname();
  const tieuDe = menuChinh.find((m) => pathname === m.duong_dan || pathname.startsWith(m.duong_dan + "/"))?.ten ?? "OMYN";
  return (
    <header className="dau-trang-omyn sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between gap-3 px-3 lg:px-8">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(SU_KIEN_MO_MENU))}
          aria-label="Mở menu"
          className="rounded-nho p-2 text-muc-2 hover:bg-giay-tram hover:text-muc lg:hidden"
        >
          <Menu strokeWidth={1.5} className="h-5 w-5" />
        </button>
        <span className="truncate text-[15px] font-semibold text-muc lg:hidden">{tieuDe}</span>
        <TimKiem vaiTro={vaiTro} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Chuong />
        <MenuAvatar hoTen={hoTen} email={email} viTri={viTri} />
      </div>
    </header>
  );
}
