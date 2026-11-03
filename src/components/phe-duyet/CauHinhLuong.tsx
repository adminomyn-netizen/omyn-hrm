"use client";

import { docDieuKien, moTaDieuKien } from "@/lib/dieu-kien";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { luuBuoc, luuGhiDeO, luuNhomMa, luuThongBao, xoaBuoc, xoaThongBao, type KetQuaCauHinh } from "@/app/(app)/ky-thuat/luong-phieu/actions";

type Hang = { id: string; buoc: number; ten_buoc: string | null; kieu: string; loai_nguoi: string; chuc_danh: string | null; nhan_vien_id: string | null; dieu_kien?: unknown; dieu_kien_truong: string | null; dieu_kien_gia_tri: string | null };
type Tb = { id: string; su_kien: string; loai_nguoi: string; chuc_danh: string | null; nhan_vien_id: string | null; dang_bat: boolean };
type GhiDe = { truong: string; bat_buoc: string; che_do_hien: string; hien_truong: string | null; hien_gia_tri: string[] | null };
type Ls = { id: string; doi_tuong: string; hanh_dong: string; mo_ta: string; ten_nguoi: string | null; luc: string };
type Truong = { ma: string; ten: string; kieu: string; batBuoc: boolean; hien: { truong: string; la: readonly string[] } | null; luaChon: string[] | null; danhMuc: string | null };
export type DuLieuCauHinh = { ma: string; ten: string; larkBuoc: string; nhomMacDinh: string; truong: Truong[]; nhom: string; dangDung: boolean; buoc: Hang[]; ghide: GhiDe[]; tb: Tb[]; ls: Ls[]; nhanSu: { id: string; ten: string }[]; danhMuc: Record<string, string[]> };

const KIEU = [{ gia_tri: "AND", nhan: "AND · mọi người đều phải duyệt" }, { gia_tri: "OR", nhan: "OR · một người duyệt là đủ" }, { gia_tri: "CC", nhan: "CC · chỉ nhận bản sao" }];
const LOAI = ["Quản lý trực tiếp", "Quản lý cấp trên", "Chức danh", "Nhân viên", "Giám đốc", "Kỹ thuật"].map((x) => ({ gia_tri: x, nhan: x }));
const LOAI_BUOC = [...LOAI, { gia_tri: "Người nộp", nhan: "Người nộp phiếu (nhận bản sao)" }, { gia_tri: "Người trong phiếu", nhan: "Người chọn trong phiếu" }];
const SU_KIEN = ["Nộp phiếu", "Duyệt xong", "Từ chối", "Cần bổ sung", "Huỷ"].map((x) => ({ gia_tri: x, nhan: x }));
const KIEU_O: Record<string, string> = { chu: "Chữ", nhieu: "Đoạn văn", ngay: "Ngày", ngay_gio: "Ngày giờ", so: "Số", tien: "Tiền", chon: "Chọn", dm: "Danh mục", nv: "Nhân sự", tep: "Tệp", bang: "Bảng", cong: "Tổng", phieu: "Nối phiếu" };
const gio = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const TABS = [["buoc", "Luồng duyệt"], ["o", "Ô nhập"], ["tb", "Thông báo"], ["nhom", "Nhóm mã"], ["ls", "Lịch sử"]] as const;

export function CauHinhLuong({ d }: { d: DuLieuCauHinh }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("buoc");
  return (
    <section className="min-w-0 space-y-4">
      <div className="the-noi the-noi-thap p-4 sm:p-5">
        <h2 className="text-[17px] font-semibold text-muc">{d.ten}</h2>
        <p className="mt-1 text-[13px] text-muc-3">Luồng mẫu: {d.larkBuoc}. Cấu hình dưới đây là luồng đang chạy trong Omyn.</p>
        <div className="mt-3 flex flex-wrap gap-1" role="tablist">
          {TABS.map(([k, t]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-nho px-3 py-1.5 text-[14px] ${tab === k ? "bg-giay-tram font-semibold text-muc" : "text-muc-2 hover:bg-giay-tram"}`}>{t}</button>
          ))}
        </div>
      </div>
      {tab === "buoc" && <TabBuoc d={d} />}
      {tab === "o" && <TabO d={d} />}
      {tab === "tb" && <TabThongBao d={d} />}
      {tab === "nhom" && <TabNhom d={d} />}
      {tab === "ls" && <TabLichSu d={d} />}
    </section>
  );
}

function useChay() {
  const router = useRouter();
  const [loi, setLoi] = useState<string>();
  const [dang, batDau] = useTransition();
  const chay = (viec: () => Promise<KetQuaCauHinh>, xong?: () => void) => batDau(async () => {
    setLoi(undefined);
    const r = await viec();
    if (!r.ok) { setLoi(r.loi); return; }
    xong?.();
    router.refresh();
  });
  return { loi, dang, chay };
}

function ChonNguoi({ loai, chucDanh, nvId, setChucDanh, setNvId, nhanSu, oNv }: { oNv?: { ma: string; ten: string }[]; loai: string; chucDanh: string; nvId: string; setChucDanh: (v: string) => void; setNvId: (v: string) => void; nhanSu: DuLieuCauHinh["nhanSu"] }) {
  if (loai === "Chức danh") return <div><label className={NHAN_O}>Chức danh</label><input value={chucDanh} onChange={(e) => setChucDanh(e.target.value)} placeholder="Kế toán tổng hợp" className={O_NHAP} /></div>;
  if (loai === "Nhân viên") return <div><label className={NHAN_O}>Nhân sự</label><Chon ariaLabel="Nhân sự" trong="Chọn người" giaTri={nvId} onDoi={setNvId} luaChon={nhanSu.map((n) => ({ gia_tri: n.id, nhan: n.ten }))} /></div>;
  if (loai === "Người trong phiếu") return <div><label className={NHAN_O}>Ô nhân sự của phiếu</label><Chon ariaLabel="Ô nhân sự" trong="Chọn ô" giaTri={chucDanh} onDoi={setChucDanh} luaChon={(oNv ?? []).map((t) => ({ gia_tri: t.ma, nhan: t.ten }))} /></div>;
  return null;
}

const tenNguoi = (loai: string, chucDanh: string | null, nvId: string | null, nhanSu: DuLieuCauHinh["nhanSu"]) => (loai === "Chức danh" ? `Chức danh “${chucDanh}”` : loai === "Người nộp" ? "Người nộp phiếu" : loai === "Người trong phiếu" ? `Người chọn ở ô “${chucDanh}”` : loai === "Nhân viên" ? nhanSu.find((n) => n.id === nvId)?.ten ?? "Nhân sự đã nghỉ" : loai);

// ------------------------------------------------------------------ Luồng duyệt

function TabBuoc({ d }: { d: DuLieuCauHinh }) {
  const [sua, setSua] = useState<Hang | "moi" | null>(null);
  const { loi, dang, chay } = useChay();
  const cacBuoc = [...new Set(d.buoc.map((h) => h.buoc))].sort((a, b) => a - b);
  const oDk = d.truong.filter((t) => t.kieu === "chon" || t.kieu === "dm");
  return (
    <div className="the-noi the-noi-thap p-4 sm:p-5">
      {d.buoc.length === 0 && <p className="mb-4 rounded-nho bg-canh-bao-nen px-3 py-2 text-[13px] text-canh-bao">Chưa có bước nào: phiếu mới sẽ chuyển cho tài khoản Kỹ thuật xử lý.</p>}
      <ol className="space-y-4">
        {cacBuoc.map((b) => (
          <li key={b}>
            <div className="text-[12px] font-medium text-muc-3">Bước {b}{d.buoc.find((h) => h.buoc === b)?.ten_buoc ? ` · ${d.buoc.find((h) => h.buoc === b)!.ten_buoc}` : ""}</div>
            <ul className="mt-1.5 divide-y divide-vien rounded-nho border border-vien">
              {d.buoc.filter((h) => h.buoc === b).map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-[14px]">
                  <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-[12px] font-medium text-muc-2">{h.kieu}</span>
                  <span className="min-w-0 flex-1 text-muc">{tenNguoi(h.loai_nguoi, h.chuc_danh, h.nhan_vien_id, d.nhanSu)}{h.dieu_kien != null && <span className="ml-2 block text-[13px] text-muc-3">Chỉ khi {moTaDieuKien(docDieuKien(h.dieu_kien), (m) => d.truong.find((t) => t.ma === m)?.ten ?? m) || "điều kiện không đọc được"}</span>}{h.dieu_kien_truong && <span className="ml-2 text-[13px] text-muc-3">chỉ khi {d.truong.find((t) => t.ma === h.dieu_kien_truong)?.ten ?? h.dieu_kien_truong} = {h.dieu_kien_gia_tri}</span>}</span>
                  <button type="button" className={NUT_CHU} onClick={() => setSua(h)}>Sửa</button>
                  <button type="button" disabled={dang} className={NUT_CHU_NGUY} onClick={() => { if (window.confirm("Xoá dòng này khỏi luồng duyệt?")) chay(() => xoaBuoc(d.ma, h.id)); }}>Xoá</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {loi && !sua && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
      {sua ? (
        <FormBuoc key={sua === "moi" ? "moi" : sua.id} d={d} oDk={oDk} dau={sua === "moi" ? null : sua} xong={() => setSua(null)} />
      ) : (
        <button type="button" onClick={() => setSua("moi")} className={`${NUT_PHU} mt-4 inline-flex items-center gap-2`}><Plus className="h-4 w-4" strokeWidth={1.6} />Thêm người duyệt</button>
      )}
      <p className="mt-4 text-[12px] text-muc-3">Cùng số bước = cùng một bước. Phiếu đi lần lượt từ bước nhỏ tới bước lớn; bước AND chờ mọi người, OR chờ một người, CC chỉ gửi bản sao và không chặn.</p>
    </div>
  );
}

function FormBuoc({ d, oDk, dau, xong }: { d: DuLieuCauHinh; oDk: Truong[]; dau: Hang | null; xong: () => void }) {
  const { loi, dang, chay } = useChay();
  const [buoc, setBuoc] = useState(String(dau?.buoc ?? (d.buoc.length ? Math.max(...d.buoc.map((h) => h.buoc)) + 1 : 1)));
  const [ten, setTen] = useState(dau?.ten_buoc ?? "");
  const [kieu, setKieu] = useState(dau?.kieu ?? "AND");
  const [loai, setLoai] = useState(dau?.loai_nguoi ?? "Quản lý trực tiếp");
  const [cd, setCd] = useState(dau?.chuc_danh ?? "");
  const [nv, setNv] = useState(dau?.nhan_vien_id ?? "");
  const [dkT, setDkT] = useState(dau?.dieu_kien_truong ?? "");
  const [dkG, setDkG] = useState(dau?.dieu_kien_gia_tri ?? "");
  const oChon = oDk.find((t) => t.ma === dkT);
  const giaTri = oChon ? (oChon.luaChon ?? d.danhMuc[oChon.danhMuc ?? ""] ?? []) : [];
  return (
    <div className="mt-4 rounded-nho border border-vien-dam p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={NHAN_O}>Bước số</label><input inputMode="numeric" value={buoc} onChange={(e) => setBuoc(e.target.value.replace(/\D/g, ""))} className={O_NHAP} /></div>
        <div><label className={NHAN_O}>Tên bước (tuỳ chọn)</label><input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Kế toán kiểm tra" className={O_NHAP} /></div>
        <div><label className={NHAN_O}>Kiểu</label><Chon ariaLabel="Kiểu" giaTri={kieu} onDoi={setKieu} luaChon={KIEU} /></div>
        <div><label className={NHAN_O}>Người duyệt / nhận là</label><Chon ariaLabel="Người duyệt" giaTri={loai} onDoi={setLoai} luaChon={LOAI_BUOC} /></div>
        <ChonNguoi loai={loai} chucDanh={cd} nvId={nv} setChucDanh={setCd} setNvId={setNv} nhanSu={d.nhanSu} oNv={d.truong.filter((t) => t.kieu === "nv")} />
        <div className="sm:col-span-2">
          <label className={NHAN_O}>Chỉ áp dụng khi (tuỳ chọn — dùng cho nhánh theo đơn vị/phòng)</label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Chon ariaLabel="Ô điều kiện" trong="Luôn áp dụng" giaTri={dkT} onDoi={(v) => { setDkT(v); setDkG(""); }} luaChon={[{ gia_tri: "", nhan: "Luôn áp dụng" }, ...oDk.map((t) => ({ gia_tri: t.ma, nhan: t.ten }))]} />
            {dkT && (giaTri.length > 0 ? <Chon ariaLabel="Giá trị" trong="Chọn giá trị" giaTri={dkG} onDoi={setDkG} luaChon={giaTri.map((x) => ({ gia_tri: x, nhan: x }))} /> : <input value={dkG} onChange={(e) => setDkG(e.target.value)} placeholder="Giá trị" className={O_NHAP} />)}
          </div>
        </div>
      </div>
      {loi && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
      <div className="mt-4 flex gap-3">
        <button type="button" disabled={dang} className={NUT_CHINH} onClick={() => chay(() => luuBuoc({ id: dau?.id, ma_phieu: d.ma, buoc: Number(buoc), ten_buoc: ten, kieu, loai_nguoi: loai, chuc_danh: cd, nhan_vien_id: nv, dk_truong: dkT, dk_gia_tri: dkG }), xong)}>{dang ? "Đang lưu…" : "Lưu"}</button>
        <button type="button" className={NUT_CHU} onClick={xong}>Đóng</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Ô nhập

function TabO({ d }: { d: DuLieuCauHinh }) {
  const [sua, setSua] = useState<string | null>(null);
  const gd = (ma: string) => d.ghide.find((g) => g.truong === ma);
  return (
    <div className="the-noi the-noi-thap p-4 sm:p-5">
      <ul className="divide-y divide-vien">
        {d.truong.map((t) => {
          const g = gd(t.ma);
          const batBuoc = g && g.bat_buoc !== "Mặc định" ? g.bat_buoc === "Bắt buộc" : t.batBuoc;
          const hien = g && g.che_do_hien !== "Mặc định" ? (g.che_do_hien === "Theo điều kiện" ? `hiện khi ${d.truong.find((x) => x.ma === g.hien_truong)?.ten} = ${g.hien_gia_tri?.join(" / ")}` : g.che_do_hien === "Ẩn" ? "đang ẩn" : "luôn hiện") : t.hien ? `hiện khi ${d.truong.find((x) => x.ma === t.hien!.truong)?.ten} = ${t.hien.la.join(" / ")}` : "luôn hiện";
          return (
            <li key={t.ma} className="py-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
                <span className="min-w-0 flex-1"><span className="text-muc">{t.ten}</span> <span className="text-[12px] text-muc-3">· {KIEU_O[t.kieu] ?? t.kieu}</span></span>
                <span className="text-[13px] text-muc-2">{batBuoc ? "Bắt buộc" : "Không bắt buộc"} · {hien}{g && <span className="ml-1 rounded-tag bg-canh-bao-nen px-1.5 py-0.5 text-[11px] text-canh-bao">đã chỉnh</span>}</span>
                <button type="button" className={NUT_CHU} onClick={() => setSua(sua === t.ma ? null : t.ma)}>{sua === t.ma ? "Đóng" : "Sửa"}</button>
              </div>
              {sua === t.ma && <FormO key={t.ma} d={d} t={t} g={g ?? null} xong={() => setSua(null)} />}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[12px] text-muc-3">Chỉ chỉnh được các ô cấp trên cùng; cột trong bảng (vd hạng mục chi phí) giữ nguyên. “Ẩn” bỏ hẳn ô khỏi phiếu mới.</p>
    </div>
  );
}

function FormO({ d, t, g, xong }: { d: DuLieuCauHinh; t: Truong; g: GhiDe | null; xong: () => void }) {
  const { loi, dang, chay } = useChay();
  const [bb, setBb] = useState(g?.bat_buoc ?? "Mặc định");
  const [cd, setCd] = useState(g?.che_do_hien ?? "Mặc định");
  const [oDkTruong, setODk] = useState(g?.hien_truong ?? "");
  const [gt, setGt] = useState<string[]>(g?.hien_gia_tri ?? []);
  const oDk = d.truong.filter((x) => (x.kieu === "chon" || x.kieu === "dm") && x.ma !== t.ma);
  const oChon = oDk.find((x) => x.ma === oDkTruong);
  const giaTri = oChon ? (oChon.luaChon ?? d.danhMuc[oChon.danhMuc ?? ""] ?? []) : [];
  return (
    <div className="mt-3 rounded-nho border border-vien-dam p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={NHAN_O}>Bắt buộc nhập</label><Chon ariaLabel="Bắt buộc" giaTri={bb} onDoi={setBb} luaChon={[{ gia_tri: "Mặc định", nhan: `Theo mặc định (${t.batBuoc ? "bắt buộc" : "không bắt buộc"})` }, { gia_tri: "Bắt buộc", nhan: "Bắt buộc" }, { gia_tri: "Không bắt buộc", nhan: "Không bắt buộc" }]} /></div>
        <div><label className={NHAN_O}>Hiển thị</label><Chon ariaLabel="Hiển thị" giaTri={cd} onDoi={setCd} luaChon={[{ gia_tri: "Mặc định", nhan: "Theo mặc định" }, { gia_tri: "Luôn hiện", nhan: "Luôn hiện" }, { gia_tri: "Theo điều kiện", nhan: "Chỉ hiện theo điều kiện" }, { gia_tri: "Ẩn", nhan: "Ẩn" }]} /></div>
        {cd === "Theo điều kiện" && (
          <>
            <div><label className={NHAN_O}>Khi ô</label><Chon ariaLabel="Ô điều khiển" trong="Chọn ô" giaTri={oDkTruong} onDoi={(v) => { setODk(v); setGt([]); }} luaChon={oDk.map((x) => ({ gia_tri: x.ma, nhan: x.ten }))} /></div>
            <div>
              <label className={NHAN_O}>có giá trị (chọn một hoặc nhiều)</label>
              <div className="flex flex-wrap gap-1.5">
                {giaTri.map((v) => (
                  <button key={v} type="button" aria-pressed={gt.includes(v)} onClick={() => setGt(gt.includes(v) ? gt.filter((x) => x !== v) : [...gt, v])} className={`rounded-nho border px-2.5 py-1 text-[13px] ${gt.includes(v) ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{v}</button>
                ))}
                {oDkTruong && giaTri.length === 0 && <span className="text-[13px] text-muc-3">Danh mục của ô này chưa có giá trị.</span>}
              </div>
            </div>
          </>
        )}
      </div>
      {loi && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
      <div className="mt-4 flex gap-3">
        <button type="button" disabled={dang} className={NUT_CHINH} onClick={() => chay(() => luuGhiDeO({ ma_phieu: d.ma, truong: t.ma, bat_buoc: bb, che_do_hien: cd, hien_truong: oDkTruong, hien_gia_tri: gt }), xong)}>{dang ? "Đang lưu…" : "Lưu"}</button>
        {g && <button type="button" disabled={dang} className={NUT_CHU_NGUY} onClick={() => chay(() => luuGhiDeO({ ma_phieu: d.ma, truong: t.ma, bat_buoc: "Mặc định", che_do_hien: "Mặc định", hien_truong: "", hien_gia_tri: [] }), xong)}>Trả về mặc định</button>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Thông báo

function TabThongBao({ d }: { d: DuLieuCauHinh }) {
  const [sua, setSua] = useState<Tb | "moi" | null>(null);
  const { loi, dang, chay } = useChay();
  return (
    <div className="the-noi the-noi-thap p-4 sm:p-5">
      <p className="mb-3 text-[13px] text-muc-2">Luôn báo sẵn: người duyệt khi tới bước của họ, người nhận bản sao (CC), và người nộp khi phiếu được duyệt / bị từ chối / cần bổ sung. Dưới đây là người nhận THÊM.</p>
      {d.tb.length === 0 ? <p className="text-[14px] text-muc-3">Chưa cài người nhận thêm.</p> : (
        <ul className="divide-y divide-vien rounded-nho border border-vien">
          {d.tb.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-[14px]">
              <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-[12px] font-medium text-muc-2">{t.su_kien}</span>
              <span className={`min-w-0 flex-1 ${t.dang_bat ? "text-muc" : "text-muc-3 line-through"}`}>{tenNguoi(t.loai_nguoi, t.chuc_danh, t.nhan_vien_id, d.nhanSu)}</span>
              <button type="button" className={NUT_CHU} onClick={() => setSua(t)}>Sửa</button>
              <button type="button" disabled={dang} className={NUT_CHU_NGUY} onClick={() => { if (window.confirm("Xoá người nhận này?")) chay(() => xoaThongBao(d.ma, t.id)); }}>Xoá</button>
            </li>
          ))}
        </ul>
      )}
      {loi && !sua && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
      {sua ? <FormTb key={sua === "moi" ? "moi" : sua.id} d={d} dau={sua === "moi" ? null : sua} xong={() => setSua(null)} /> : <button type="button" onClick={() => setSua("moi")} className={`${NUT_PHU} mt-4 inline-flex items-center gap-2`}><Plus className="h-4 w-4" strokeWidth={1.6} />Thêm người nhận</button>}
    </div>
  );
}

function FormTb({ d, dau, xong }: { d: DuLieuCauHinh; dau: Tb | null; xong: () => void }) {
  const { loi, dang, chay } = useChay();
  const [sk, setSk] = useState(dau?.su_kien ?? "Duyệt xong");
  const [loai, setLoai] = useState(dau?.loai_nguoi ?? "Giám đốc");
  const [cd, setCd] = useState(dau?.chuc_danh ?? "");
  const [nv, setNv] = useState(dau?.nhan_vien_id ?? "");
  const [bat, setBat] = useState(dau?.dang_bat ?? true);
  return (
    <div className="mt-4 rounded-nho border border-vien-dam p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={NHAN_O}>Khi</label><Chon ariaLabel="Sự kiện" giaTri={sk} onDoi={setSk} luaChon={SU_KIEN} /></div>
        <div><label className={NHAN_O}>Báo cho</label><Chon ariaLabel="Người nhận" giaTri={loai} onDoi={setLoai} luaChon={LOAI} /></div>
        <ChonNguoi loai={loai} chucDanh={cd} nvId={nv} setChucDanh={setCd} setNvId={setNv} nhanSu={d.nhanSu} />
        <label className="flex items-center gap-2 text-[14px] text-muc-2"><input type="checkbox" checked={bat} onChange={(e) => setBat(e.target.checked)} />Đang bật</label>
      </div>
      {loi && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
      <div className="mt-4 flex gap-3">
        <button type="button" disabled={dang} className={NUT_CHINH} onClick={() => chay(() => luuThongBao({ id: dau?.id, ma_phieu: d.ma, su_kien: sk, loai_nguoi: loai, chuc_danh: cd, nhan_vien_id: nv, dang_bat: bat }), xong)}>{dang ? "Đang lưu…" : "Lưu"}</button>
        <button type="button" className={NUT_CHU} onClick={xong}>Đóng</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Nhóm mã

function TabNhom({ d }: { d: DuLieuCauHinh }) {
  const { loi, dang, chay } = useChay();
  const [nhom, setNhom] = useState(d.nhom);
  const [dung, setDung] = useState(d.dangDung);
  return (
    <div className="the-noi the-noi-thap p-4 sm:p-5">
      <div className="grid gap-4 sm:max-w-md">
        <div>
          <label className={NHAN_O} htmlFor="nhom-ma">Nhóm mã (2-6 chữ cái)</label>
          <input id="nhom-ma" value={nhom} onChange={(e) => setNhom(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6))} className={O_NHAP} />
          <p className="mt-1 text-[12px] text-muc-3">Mã phiếu tiếp theo sẽ có dạng {nhom || "XX"}-AAMM-0001 (gợi ý: HR, FIN, MKT, ADM). Số đã cấp không đổi.</p>
        </div>
        <label className="flex items-center gap-2 text-[14px] text-muc-2"><input type="checkbox" checked={dung} onChange={(e) => setDung(e.target.checked)} />Cho phép nộp loại phiếu này</label>
      </div>
      {loi && <p role="alert" className="mt-3 text-[14px] text-loi">{loi}</p>}
      <button type="button" disabled={dang} className={`${NUT_CHINH} mt-4`} onClick={() => chay(() => luuNhomMa(d.ma, nhom, dung))}>{dang ? "Đang lưu…" : "Lưu"}</button>
    </div>
  );
}

// ------------------------------------------------------------------ Lịch sử

function TabLichSu({ d }: { d: DuLieuCauHinh }) {
  return (
    <div className="the-noi the-noi-thap p-4 sm:p-5">
      {d.ls.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có thay đổi nào với loại phiếu này.</p> : (
        <ol className="space-y-3">
          {d.ls.map((l) => (
            <li key={l.id} className="text-[14px]">
              <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-[12px] font-medium text-muc-2">{l.hanh_dong} · {l.doi_tuong}</span>
              <span className="ml-2 text-muc">{l.mo_ta}</span>
              <span className="block text-[12px] text-muc-3">{l.ten_nguoi ?? "—"} · {gio(l.luc)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
