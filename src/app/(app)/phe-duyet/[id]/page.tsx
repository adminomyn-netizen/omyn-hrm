export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { yeuCauDangNhapDaDuyet } from "@/lib/phe-duyet-quyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { PanelXuLy } from "@/components/phe-duyet/PanelXuLy";
import { dbHr } from "@/lib/hr-db";
import { TEN_TRANG_THAI_O, mauHieuLuc, taiPhieuDeXem } from "@/lib/phe-duyet-data";
import { quyenTrenPhieu, truongDangHien, type Truong } from "@/lib/phe-duyet";

const MAU_TT = { "Chờ duyệt": "cho", "Cần bổ sung": "cho", "Đã duyệt": "tot", "Từ chối": "loi", "Đã huỷ": "tram" } as const;
const MAU_O = { "Chờ": "cho", "Đã duyệt": "tot", "Từ chối": "loi", "Bỏ qua": "tram", "Đã xem": "tram" } as const;
const gio = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dMY = (s: string) => s.slice(0, 10).split("-").reverse().join("/");
const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function TrangPhieu({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauDangNhapDaDuyet();
  const { id } = await params;
  const x = await taiPhieuDeXem(id, nd);
  const mau = x && (await mauHieuLuc(x.phieu.ma_phieu));
  if (!x || !mau) notFound();
  const { phieu: p, o, nv, tep, lichSu } = x;

  // Tên người (ô chọn nhân sự) và số phiếu được nối
  const idNv = new Set<string>();
  const idPhieu = new Set<string>();
  const quet = (ts: readonly Truong[], d: Record<string, unknown>) => { for (const t of ts) { const v = d[t.ma]; if (t.kieu === "nv") (Array.isArray(v) ? v : [v]).forEach((i) => typeof i === "string" && idNv.add(i)); if (t.kieu === "phieu" && typeof v === "string") idPhieu.add(v); } };
  quet(mau.truong, p.du_lieu);
  const [nvs, ps] = await Promise.all([
    idNv.size ? dbHr().from("nhan_vien").select("id, ho_ten").in("id", [...idNv]) : { data: [] },
    idPhieu.size ? dbHr().from("pd_phieu").select("id, so_phieu").in("id", [...idPhieu]) : { data: [] },
  ]);
  const tenNv = new Map(((nvs.data ?? []) as { id: string; ho_ten: string }[]).map((n) => [n.id, n.ho_ten]));
  const soPhieu = new Map(((ps.data ?? []) as { id: string; so_phieu: string }[]).map((n) => [n.id, n.so_phieu]));

  const hienGiaTri = (t: Truong, v: unknown): React.ReactNode => {
    if (t.kieu === "tep") {
      const ds = tep.filter((f) => f.truong === t.ma);
      return ds.length === 0 ? "—" : (
        <ul className="space-y-1">{ds.map((f) => <li key={f.id}><a href={`/phe-duyet/tep/${f.id}`} className="inline-flex items-center gap-1.5 text-nhan-dam underline-offset-4 hover:underline"><Paperclip className="h-3.5 w-3.5" strokeWidth={1.6} />{f.ten_tep}<span className="text-muc-3">({kb(f.kich_thuoc)})</span></a></li>)}</ul>
      );
    }
    if (v === undefined || v === null || v === "") return "—";
    switch (t.kieu) {
      case "tien": case "cong": return `${Number(v).toLocaleString("vi-VN")} đ`;
      case "ngay": return dMY(String(v));
      case "ngay_gio": return `${dMY(String(v))} ${String(v).slice(11, 16)}`;
      case "nv": return (Array.isArray(v) ? v : [v]).map((i) => tenNv.get(String(i)) ?? "(đã nghỉ)").join(", ");
      case "phieu": return <Link href={`/phe-duyet/${String(v)}`} className="font-mono text-nhan-dam underline-offset-4 hover:underline">{soPhieu.get(String(v)) ?? "Phiếu đã nối"}</Link>;
      case "bang": return (
        <div className="overflow-x-auto"><table className="w-full text-[14px]"><thead><tr>{(t.con ?? []).map((c) => <th key={c.ma} className="pb-1.5 pr-4 text-left text-[12px] font-medium text-muc-3">{c.ten}</th>)}</tr></thead><tbody>
          {(v as Record<string, unknown>[]).map((d, i) => <tr key={i} className="border-t border-vien">{(t.con ?? []).map((c) => <td key={c.ma} className="py-1.5 pr-4 align-top">{hienGiaTri(c, d[c.ma])}</td>)}</tr>)}
        </tbody></table></div>
      );
      default: return <span className="whitespace-pre-wrap">{String(v)}</span>;
    }
  };

  const q = quyenTrenPhieu({ trangThai: p.trang_thai, nguoiNopId: p.nguoi_nop_id, buocHienTai: p.buoc_hien_tai }, o, { nhanVienId: nv?.id ?? null, userId: nd.id });
  const cacBuoc = [...new Set(o.map((s) => s.buoc))].sort((a, b) => a - b);

  return (
    <>
      <TieuDeTrang tieuDe={mau.ten} phu={<><span className="font-mono text-nhan-dam">{p.so_phieu}</span> · {p.nguoi_nop?.ho_ten ?? "—"} · nộp {gio(p.tao_luc)}</>}>
        <NhanTrangThai kieu={MAU_TT[p.trang_thai]}>{p.trang_thai}</NhanTrangThai>
        <Link href="/phe-duyet" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Danh sách phiếu</Link>
      </TieuDeTrang>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <PanelXuLy id={p.id} duocDuyet={!!q.oDuyet} suaNopLai={q.suaVaNopLai} huy={q.huy} />
          <MucTrang tieuDe="Nội dung phiếu">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {mau.truong.filter((t) => truongDangHien(t, p.du_lieu)).map((t) => (
                <div key={t.ma} className={t.kieu === "nhieu" || t.kieu === "bang" || t.kieu === "tep" ? "sm:col-span-2" : ""}>
                  <dt className="text-[12px] font-medium text-muc-3">{t.ten}</dt>
                  <dd className="mt-0.5 text-[15px] text-muc">{hienGiaTri(t, p.du_lieu[t.ma])}</dd>
                </div>
              ))}
            </dl>
          </MucTrang>
        </div>

        <div className="min-w-0 space-y-5">
          <MucTrang tieuDe="Luồng duyệt">
            <ol className="space-y-3.5">
              {cacBuoc.map((b) => {
                const cacO = o.filter((s) => s.buoc === b);
                const hienTai = p.trang_thai === "Chờ duyệt" && b === p.buoc_hien_tai;
                return (
                  <li key={b}>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-muc-3">
                      <span className={hienTai ? "text-nhan-dam" : ""}>Bước {b}{cacO[0]?.tenBuoc ? ` · ${cacO[0].tenBuoc}` : ""}</span>
                      <span>{cacO.some((s) => s.kieu === "CC") ? "(nhận bản sao)" : cacO.some((s) => s.kieu === "OR") ? "(một người duyệt là đủ)" : cacO.filter((s) => s.trangThai !== "Bỏ qua").length > 1 ? "(mọi người cùng duyệt)" : ""}</span>
                    </div>
                    <ul className="mt-1.5 space-y-1.5">
                      {cacO.map((s) => (
                        <li key={s.id} className="flex items-start justify-between gap-3 text-[14px]">
                          <span className="min-w-0"><span className="text-muc">{s.ten}</span>{s.yKien && <span className="block text-[13px] text-muc-3">“{s.yKien}”</span>}</span>
                          <NhanTrangThai kieu={MAU_O[s.trangThai]}>{TEN_TRANG_THAI_O[s.trangThai]}</NhanTrangThai>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </MucTrang>
          <MucTrang tieuDe="Lịch sử">
            <ol className="space-y-3">
              {lichSu.map((h) => (
                <li key={h.id} className="text-[14px]">
                  <span className="font-medium text-muc">{h.hanh_dong}</span> <span className="text-muc-2">· {h.ten_nguoi ?? "Hệ thống"}</span>
                  <span className="block text-[12px] text-muc-3">{gio(h.luc)}</span>
                  {h.ghi_chu && <span className="mt-0.5 block text-[13px] text-muc-2">“{h.ghi_chu}”</span>}
                </li>
              ))}
            </ol>
          </MucTrang>
        </div>
      </div>
    </>
  );
}
