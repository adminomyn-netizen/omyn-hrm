"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { capNhatOnb, doiNhiemVu, luuDanhGiaThuViec, themNhiemVu, xoaOnb } from "@/app/(app)/hr/onboarding/actions";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU_NGUY, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { GIAI_DOAN, TINH_TRANG_ONB, TT_HO_SO } from "@/lib/onboarding";

type Tra = { id: string; ten: string };
export type NhiemVu = { id: string; giaiDoan: string; noiDung: string; han: string | null; xong: boolean };
export type DanhGia = { id: string; moc: string; ai: string; diem: number | null; ketQua: string; manh: string | null; caiThien: string | null; ngay: string };
export type Onb = { id: string; hoTen: string; viTri: string | null; email: string | null; dienThoai: string | null; batDau: string; soNgay: number; ngayThu: number; tinhTrang: string; hoSo: string; conThieu: string | null; tkLark: boolean; gioiThieu: boolean; mentorId: string | null; quanLyId: string | null; ghiChu: string | null };

const NGAY = (s: string | null) => (s ? s.split("-").reverse().join("/") : "");
const KQ = (k: string): "tot" | "cho" | "loi" | "tram" => (k === "Đạt" ? "tot" : k === "Không đạt" ? "loi" : k === "Cần theo dõi" ? "cho" : "tram");

export function OnboardingChiTiet({ onb, nhiemVu, danhGia, nv }: { onb: Onb; nhiemVu: NhiemVu[]; danhGia: DanhGia[]; nv: Tra[] }) {
  const router = useRouter();
  const [loi, setLoi] = useState<string>();
  const [dang, bat] = useTransition();
  const lamViec = (f: () => Promise<{ loi?: string }>) => bat(async () => { const k = await f(); setLoi(k.loi); router.refresh(); });
  const tong = nhiemVu.length; const xong = nhiemVu.filter((n) => n.xong).length; const pct = tong ? Math.round((xong / tong) * 100) : 0;
  const hnIso = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

  return (
    <div className="space-y-8">
      <section className="the-noi rounded-nho border border-vien bg-giay-sang p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[13px] text-muc-3">{onb.viTri ?? "Chưa có vị trí"}{onb.email ? ` · ${onb.email}` : ""}{onb.dienThoai ? ` · ${onb.dienThoai}` : ""}</p>
            <p className="mt-1 text-[14px] text-muc-2">Bắt đầu {NGAY(onb.batDau)} · {onb.ngayThu < 1 ? "chưa tới ngày bắt đầu" : `đang ở ngày ${Math.min(onb.ngayThu, onb.soNgay)}/${onb.soNgay}`}</p></div>
          <NhanTrangThai kieu={onb.tinhTrang.startsWith("Đạt") ? "tot" : onb.tinhTrang === "Đang thử việc" ? "cho" : "tram"}>{onb.tinhTrang}</NhanTrangThai>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[13px] text-muc-3"><span>Tiến độ lộ trình</span><span>{xong}/{tong} việc · {pct}%</span></div>
          <div className="h-2.5 overflow-hidden rounded-tag bg-giay-tram" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-tag transition-[width]" style={{ width: `${pct}%`, background: "var(--gradient-vang)" }} /></div>
        </div>
      </section>

      {loi && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</p>}

      <section aria-label="Lộ trình 60 ngày">
        <h2 className="mb-4 text-[20px] font-semibold text-muc">Lộ trình {onb.soNgay} ngày</h2>
        <ol className="space-y-6">
          {GIAI_DOAN.map((gd) => {
            const ds = nhiemVu.filter((n) => n.giaiDoan === gd);
            const x = ds.filter((n) => n.xong).length;
            return (
              <li key={gd} className="relative border-l-2 border-vien pl-5">
                <span aria-hidden className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-tag" style={{ background: x === ds.length && ds.length ? "var(--gradient-vang)" : "var(--vien-dam)" }} />
                <div className="mb-2 flex items-baseline gap-3"><h3 className="text-[16px] font-semibold text-muc">{gd}</h3><span className="text-[12px] text-muc-3">{x}/{ds.length} xong</span></div>
                <ul className="space-y-1.5">
                  {ds.map((n) => {
                    const tre = !n.xong && n.han !== null && n.han < hnIso;
                    return (
                      <li key={n.id}>
                        <button type="button" disabled={dang} onClick={() => lamViec(() => doiNhiemVu(onb.id, n.id, !n.xong))} aria-pressed={n.xong}
                          className="flex w-full items-start gap-3 rounded-nho px-2 py-2 text-left transition-colors hover:bg-giay-tram disabled:opacity-70">
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${n.xong ? "border-transparent nut-vang" : "border-vien-dam bg-giay-sang"}`}>{n.xong && <Check strokeWidth={2.4} className="h-3.5 w-3.5" />}</span>
                          <span className="min-w-0 flex-1"><span className={`block text-[14px] ${n.xong ? "text-muc-3 line-through" : "text-muc"}`}>{n.noiDung}</span>
                            {n.han && <span className={`text-[12px] ${tre ? "font-medium text-loi" : "text-muc-3"}`}>Hạn {NGAY(n.han)}{tre ? " · quá hạn" : ""}</span>}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <ThemViec onbId={onb.id} gd={gd} lamViec={lamViec} />
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-label="Đánh giá thử việc">
        <h2 className="mb-4 text-[20px] font-semibold text-muc">Đánh giá thử việc</h2>
        {danhGia.length > 0 && (
          <ul className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {danhGia.map((d) => (
              <li key={d.id} className="rounded-nho border border-vien bg-giay-sang p-4 text-[13px]">
                <div className="mb-2 flex flex-wrap items-center gap-2"><strong className="text-[15px] text-muc">Mốc {d.moc}</strong><span className="text-muc-3">{d.ai} · {NGAY(d.ngay)}</span><NhanTrangThai kieu={KQ(d.ketQua)}>{d.ketQua}</NhanTrangThai>{d.diem && <span className="ml-auto font-semibold text-nhan-dam">{d.diem}/5</span>}</div>
                {d.manh && <p className="text-muc-2"><span className="text-muc-3">Điểm mạnh:</span> {d.manh}</p>}
                {d.caiThien && <p className="mt-1 text-muc-2"><span className="text-muc-3">Cần cải thiện:</span> {d.caiThien}</p>}
              </li>
            ))}
          </ul>
        )}
        <FormDanhGia onbId={onb.id} lamViec={lamViec} dang={dang} />
      </section>

      <section aria-label="Hồ sơ và trạng thái">
        <h2 className="mb-4 text-[20px] font-semibold text-muc">Hồ sơ & trạng thái</h2>
        <FormTrangThai onb={onb} nv={nv} lamViec={lamViec} dang={dang} />
        <div className="mt-6 border-t border-vien pt-4"><button type="button" disabled={dang} onClick={() => window.confirm("Xoá hẳn người này khỏi onboarding (kèm lộ trình, đánh giá)?") && bat(async () => { const k = await xoaOnb(onb.id); if (k.loi) setLoi(k.loi); else router.push("/hr/onboarding"); })} className={NUT_CHU_NGUY}>Xoá khỏi onboarding</button></div>
      </section>
    </div>
  );
}

function ThemViec({ onbId, gd, lamViec }: { onbId: string; gd: string; lamViec: (f: () => Promise<{ loi?: string }>) => void }) {
  const [mo, setMo] = useState(false);
  const [nd, setNd] = useState("");
  if (!mo) return <button type="button" onClick={() => setMo(true)} className="mt-2 inline-flex items-center gap-1 px-2 text-[13px] font-medium text-nhan-dam hover:underline"><Plus strokeWidth={1.8} className="h-3.5 w-3.5" />Thêm việc</button>;
  return (
    <div className="mt-2 flex gap-2"><input value={nd} onChange={(e) => setNd(e.target.value)} placeholder="Việc cần làm…" className={O_NHAP} aria-label="Việc cần làm" />
      <button type="button" className={NUT_CHINH} onClick={() => { const fd = new FormData(); fd.set("onb_id", onbId); fd.set("giai_doan", gd); fd.set("noi_dung", nd); lamViec(async () => { const k = await themNhiemVu(fd); if (!k.loi) { setNd(""); setMo(false); } return k; }); }}>Thêm</button></div>
  );
}

function FormDanhGia({ onbId, lamViec, dang }: { onbId: string; lamViec: (f: () => Promise<{ loi?: string }>) => void; dang: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} className="space-y-4 rounded-nho border border-vien bg-giay-sang p-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
      <input type="hidden" name="onb_id" value={onbId} />
      <p className="text-[14px] font-medium text-muc">Ghi đánh giá mới</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div><label className={NHAN_O}>Mốc</label><Chon ten="moc" giaTriMacDinh="30 ngày" luaChon={["30 ngày", "60 ngày"].map((x) => ({ gia_tri: x, nhan: x }))} /></div>
        <div><label className={NHAN_O}>Người đánh giá</label><Chon ten="nguoi_danh_gia" giaTriMacDinh="Mentor" luaChon={["Mentor", "Quản lý", "Nhân sự"].map((x) => ({ gia_tri: x, nhan: x }))} /></div>
        <div><label className={NHAN_O}>Điểm (1–5)</label><input name="diem" inputMode="numeric" className={O_NHAP} placeholder="4" /></div>
        <div><label className={NHAN_O}>Kết quả</label><Chon ten="ket_qua" giaTriMacDinh="Đạt" luaChon={["Chờ", "Đạt", "Cần theo dõi", "Không đạt"].map((x) => ({ gia_tri: x, nhan: x }))} /></div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div><label className={NHAN_O}>Điểm mạnh</label><textarea name="diem_manh" className={O_NHIEU_DONG} style={{ minHeight: 64 }} /></div>
        <div><label className={NHAN_O}>Cần cải thiện</label><textarea name="can_cai_thien" className={O_NHIEU_DONG} style={{ minHeight: 64 }} /></div>
      </div>
      <div className="flex justify-end"><button type="button" disabled={dang} className={NUT_CHINH} onClick={() => { const fd = new FormData(ref.current!); lamViec(async () => { const k = await luuDanhGiaThuViec(fd); if (!k.loi) ref.current?.reset(); return k; }); }}>Lưu đánh giá</button></div>
    </form>
  );
}

function FormTrangThai({ onb, nv, lamViec, dang }: { onb: Onb; nv: Tra[]; lamViec: (f: () => Promise<{ loi?: string }>) => void; dang: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
  const [tk, setTk] = useState(onb.tkLark); const [gt, setGt] = useState(onb.gioiThieu);
  const lc = nv.map((x) => ({ gia_tri: x.id, nhan: x.ten }));
  return (
    <form ref={ref} className="space-y-4" onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA" && e.preventDefault()}>
      <input type="hidden" name="id" value={onb.id} />
      <input type="hidden" name="tk_lark_da_tao" value={tk ? "1" : "0"} /><input type="hidden" name="da_gioi_thieu_cong_ty" value={gt ? "1" : "0"} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className={NHAN_O}>Tình trạng thử việc</label><Chon ten="tinh_trang" giaTriMacDinh={onb.tinhTrang} luaChon={TINH_TRANG_ONB.map((x) => ({ gia_tri: x, nhan: x }))} /></div>
        <div><label className={NHAN_O}>Hồ sơ cá nhân</label><Chon ten="trang_thai_ho_so" giaTriMacDinh={onb.hoSo} luaChon={TT_HO_SO.map((x) => ({ gia_tri: x, nhan: x }))} /></div>
        <div><label className={NHAN_O}>Quản lý trực tiếp</label><Chon ten="quan_ly_id" trong="Chọn" giaTriMacDinh={onb.quanLyId ?? ""} luaChon={lc} /></div>
        <div><label className={NHAN_O}>Mentor</label><Chon ten="mentor_id" trong="Chọn" giaTriMacDinh={onb.mentorId ?? ""} luaChon={lc} /></div>
        <div className="sm:col-span-2"><label className={NHAN_O}>Thông tin còn thiếu</label><input name="thong_tin_con_thieu" defaultValue={onb.conThieu ?? ""} className={O_NHAP} placeholder="VD: thiếu CCCD mặt sau, sổ BHXH" /></div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 sm:col-span-2"><Gat nhan="Đã tạo tài khoản Lark" giaTriMacDinh={onb.tkLark} onDoi={setTk} /><Gat nhan="Đã giới thiệu công ty" giaTriMacDinh={onb.gioiThieu} onDoi={setGt} /></div>
        <div className="sm:col-span-2"><label className={NHAN_O}>Ghi chú</label><textarea name="ghi_chu" defaultValue={onb.ghiChu ?? ""} className={O_NHIEU_DONG} style={{ minHeight: 64 }} /></div>
      </div>
      <div className="flex justify-end gap-2.5"><button type="button" disabled={dang} className={NUT_CHINH} onClick={() => { const fd = new FormData(ref.current!); lamViec(() => capNhatOnb(fd)); }}>Lưu trạng thái</button></div>
    </form>
  );
}
